import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });
const MODEL = process.env.GOOGLE_AI_MODEL ?? "gemini-2.0-flash-lite";
const MAX_CONTEXT_CHARS = 12000;

// Admin client bypasses RLS — used only server-side for reading chunks
function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function extractTextFromPdfBytes(bytes: Uint8Array): string {
  const text = new TextDecoder("latin1").decode(bytes);
  const chunks: string[] = [];
  const btPattern = /BT\s*([\s\S]*?)\s*ET/g;
  let m: RegExpExecArray | null;
  while ((m = btPattern.exec(text)) !== null) {
    const block = m[1];
    const tjP = /\(([^)]*)\)\s*Tj/g;
    let t: RegExpExecArray | null;
    while ((t = tjP.exec(block)) !== null) chunks.push(t[1]);
  }
  if (chunks.length < 5) {
    const sp = /\(([^\x00-\x08\x0b\x0e-\x1f]{4,})\)/g;
    while ((m = sp.exec(text)) !== null) {
      if (m[1].trim().length > 3) chunks.push(m[1]);
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
    return NextResponse.json({ error: "brand_id and question required" }, { status: 400 });
  }

  const admin = getAdminClient();

  // Load brand info
  const { data: brand } = await admin.from("brands").select("name").eq("id", brand_id).single();

  let documentContext = "";
  let documentName = "";

  if (document_id) {
    // Load specific document from storage
    const { data: doc } = await admin
      .from("knowledge_documents")
      .select("name, file_path, source_url, type")
      .eq("id", document_id)
      .single();

    if (doc) {
      documentName = doc.name;
      if (doc.file_path && doc.type !== "url") {
        const { data: fileData } = await admin.storage.from("knowledge").download(doc.file_path);
        if (fileData) {
          const buffer = await fileData.arrayBuffer();
          documentContext = doc.type === "pdf"
            ? extractTextFromPdfBytes(new Uint8Array(buffer))
            : new TextDecoder().decode(buffer);
        }
      }
    }
  } else {
    // Load all knowledge chunks for this brand
    const { data: chunks } = await admin
      .from("knowledge_chunks")
      .select("content, chunk_index")
      .eq("brand_id", brand_id)
      .order("chunk_index")
      .limit(40);

    if (chunks && chunks.length > 0) {
      documentContext = chunks.map((c) => c.content).join("\n\n");
      documentName = "brand knowledge base";
      console.log(`[chat] Loaded ${chunks.length} chunks for brand ${brand_id}`);
    } else {
      console.log(`[chat] No chunks found for brand ${brand_id}`);
    }
  }

  if (documentContext.length > MAX_CONTEXT_CHARS) {
    documentContext = documentContext.slice(0, MAX_CONTEXT_CHARS) + "\n\n[...truncated...]";
  }

  const systemInstruction = documentContext
    ? `You are an intelligent assistant for ${brand?.name ?? "this company"}.

DOCUMENT CONTENT (${documentName}):
---
${documentContext}
---

IMPORTANT RULES:
- Answer questions ONLY based on the document content above
- Quote specific parts of the document when answering
- If something is NOT in the document, say exactly "That information is not in this document"
- Be concise and helpful`
    : `You are an intelligent assistant for ${brand?.name ?? "this company"}. The knowledge base is currently empty. Tell the user to upload documents first.`;

  // Build conversation history
  const history = messages.slice(-6).map((m: { role: string; content: string }) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));

  try {
    const chat = ai.chats.create({
      model: MODEL,
      config: { systemInstruction },
      history,
    });
    const response = await chat.sendMessage({ message: question });
    return NextResponse.json({
      answer: response.text ?? "No response.",
      document_name: documentName,
      model: MODEL,
      has_context: documentContext.length > 0,
      chunks_loaded: documentContext.length > 0 ? Math.round(documentContext.length / 100) : 0,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Chat failed" },
      { status: 500 }
    );
  }
}
