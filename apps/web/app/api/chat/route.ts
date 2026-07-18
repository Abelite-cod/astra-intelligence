import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const MODEL = process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.1-8b-instruct:free";
const MAX_CONTEXT_CHARS = 12000; // Keep within token limits for free models

async function extractTextFromPdf(buffer: ArrayBuffer): Promise<string> {
  // Pure JS PDF text extraction — no native deps needed
  const bytes = new Uint8Array(buffer);
  const text = new TextDecoder("latin1").decode(bytes);

  // Extract text from PDF stream objects
  const chunks: string[] = [];
  
  // Method 1: BT/ET text blocks
  const btPattern = /BT\s*(.*?)\s*ET/gs;
  let match;
  while ((match = btPattern.exec(text)) !== null) {
    const block = match[1];
    // Extract Tj and TJ operators
    const tjPattern = /\(([^)]*)\)\s*Tj/g;
    const TJPattern = /\[([^\]]*)\]\s*TJ/g;
    let tj;
    while ((tj = tjPattern.exec(block)) !== null) {
      chunks.push(tj[1]);
    }
    while ((tj = TJPattern.exec(block)) !== null) {
      // Extract strings from TJ arrays
      const inner = tj[1].replace(/\(([^)]*)\)/g, (_: string, s: string) => s + " ");
      chunks.push(inner);
    }
  }

  // Method 2: Direct string extraction as fallback
  if (chunks.length < 10) {
    const stringPattern = /\(([^\x00-\x08\x0b\x0e-\x1f]{4,})\)/g;
    while ((match = stringPattern.exec(text)) !== null) {
      const str = match[1]
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "")
        .replace(/\\t/g, " ")
        .replace(/\\\(/g, "(")
        .replace(/\\\)/g, ")")
        .replace(/\\\\/g, "\\");
      if (str.trim().length > 3) {
        chunks.push(str);
      }
    }
  }

  const extracted = chunks
    .join(" ")
    .replace(/\s{3,}/g, " ")
    .replace(/[^\x20-\x7E\n]/g, "")
    .trim();

  return extracted || "Could not extract text from this PDF. The file may be scanned or image-based.";
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { brand_id, document_id, question, messages = [] } = body;

  if (!brand_id || !question) {
    return NextResponse.json({ error: "brand_id and question are required" }, { status: 400 });
  }

  // Load brand context
  const { data: brand } = await supabase
    .from("brands")
    .select("name, description, tone_of_voice")
    .eq("id", brand_id)
    .single();

  // If specific document requested, load it
  let documentContext = "";
  let documentName = "";

  if (document_id) {
    const { data: doc } = await supabase
      .from("knowledge_documents")
      .select("name, file_path, source_url, type")
      .eq("id", document_id)
      .single();

    if (doc) {
      documentName = doc.name;

      if (doc.file_path && doc.type !== "url") {
        // Download from Supabase Storage
        const { data: fileData, error: downloadError } = await supabase
          .storage
          .from("knowledge")
          .download(doc.file_path);

        if (!downloadError && fileData) {
          const buffer = await fileData.arrayBuffer();

          if (doc.type === "pdf") {
            documentContext = await extractTextFromPdf(buffer);
          } else {
            documentContext = new TextDecoder().decode(buffer);
          }
        }
      }
    }
  } else {
    // Load all indexed knowledge chunks for this brand
    const { data: chunks } = await supabase
      .from("knowledge_chunks")
      .select("content")
      .eq("brand_id", brand_id)
      .order("chunk_index")
      .limit(30);

    if (chunks && chunks.length > 0) {
      documentContext = chunks.map((c) => c.content).join("\n\n");
      documentName = "brand knowledge base";
    }
  }

  // Trim context to fit within token limits
  if (documentContext.length > MAX_CONTEXT_CHARS) {
    documentContext = documentContext.slice(0, MAX_CONTEXT_CHARS) + "\n\n[...content truncated for length...]";
  }

  const systemPrompt = `You are an intelligent assistant for ${brand?.name ?? "this brand"}.

${documentContext ? `DOCUMENT CONTEXT (${documentName}):\n---\n${documentContext}\n---\n` : ""}
INSTRUCTIONS:
- Answer questions based ONLY on the document context provided above
- If the answer is not in the document, say "I don't see that information in this document"
- Be concise and precise
- Quote relevant passages when helpful
- Format your answers clearly with bullet points or sections when appropriate`;

  // Build conversation history
  const chatMessages = [
    { role: "system", content: systemPrompt },
    ...messages.slice(-6), // Keep last 6 messages for context
    { role: "user", content: question },
  ];

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://astra-intelligence.com",
        "X-Title": "Astra Intelligence",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: chatMessages,
        temperature: 0.3, // Lower temp for Q&A accuracy
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: (err as { error?: { message?: string } }).error?.message ?? `AI error: ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { total_tokens?: number };
    };
    const answer = data.choices?.[0]?.message?.content ?? "No response generated.";

    return NextResponse.json({
      answer,
      document_name: documentName,
      model: MODEL,
      tokens_used: data.usage?.total_tokens ?? 0,
      has_context: documentContext.length > 0,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Chat failed" },
      { status: 500 }
    );
  }
}
