import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
const MODEL_NAME = process.env.GOOGLE_AI_MODEL ?? "gemini-1.5-flash";
const MAX_CONTEXT_CHARS = 12000;

function extractTextFromPdfBytes(bytes: Uint8Array): string {
  const text = new TextDecoder("latin1").decode(bytes);
  const chunks: string[] = [];
  const btPattern = /BT\s*([\s\S]*?)\s*ET/g;
  let m: RegExpExecArray | null;
  while ((m = btPattern.exec(text)) !== null) {
    const block = m[1];
    const tjP = /\(([^)]*)\)\s*Tj/g;
    const TJP = /\[([^\]]*)\]\s*TJ/g;
    let t: RegExpExecArray | null;
    while ((t = tjP.exec(block)) !== null) chunks.push(t[1]);
    while ((t = TJP.exec(block)) !== null) {
      chunks.push(t[1].replace(/\(([^)]*)\)/g, (_: string, s: string) => s + " "));
    }
  }
  if (chunks.length < 5) {
    const sp = /\(([^\x00-\x08\x0b\x0e-\x1f]{4,})\)/g;
    while ((m = sp.exec(text)) !== null) {
      const s = m[1].replace(/\\n/g, "\n").replace(/\\r/g, "").replace(/\\t/g, " ");
      if (s.trim().length > 3) chunks.push(s);
    }
  }
  return chunks.join(" ").replace(/\s{3,}/g, " ").replace(/[^\x20-\x7E\n]/g, "").trim();
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

  const { data: brand } = await supabase
    .from("brands")
    .select("name, description, tone_of_voice")
    .eq("id", brand_id)
    .single();

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
        const { data: fileData, error: dlErr } = await supabase.storage
          .from("knowledge")
          .download(doc.file_path);
        if (!dlErr && fileData) {
          const buffer = await fileData.arrayBuffer();
          documentContext = doc.type === "pdf"
            ? extractTextFromPdfBytes(new Uint8Array(buffer))
            : new TextDecoder().decode(buffer);
        }
      }
    }
  } else {
    const { data: chunks } = await supabase
      .from("knowledge_chunks")
      .select("content")
      .eq("brand_id", brand_id)
      .order("chunk_index")
      .limit(30);
    if (chunks?.length) {
      documentContext = chunks.map((c) => c.content).join("\n\n");
      documentName = "brand knowledge base";
    }
  }

  if (documentContext.length > MAX_CONTEXT_CHARS) {
    documentContext = documentContext.slice(0, MAX_CONTEXT_CHARS) + "\n\n[...truncated...]";
  }

  const systemPrompt = `You are an intelligent assistant for ${brand?.name ?? "this brand"}.
${documentContext ? `\nDOCUMENT CONTEXT (${documentName}):\n---\n${documentContext}\n---\n` : ""}
INSTRUCTIONS:
- Answer questions based ONLY on the document context provided above
- If the answer is not in the document, say "I don't see that information in this document"
- Be concise and precise
- Quote relevant passages when helpful`;

  try {
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: systemPrompt,
    });

    // Build chat history
    const history = messages.slice(-6).map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(question);
    const answer = result.response.text();

    return NextResponse.json({
      answer,
      document_name: documentName,
      model: MODEL_NAME,
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
