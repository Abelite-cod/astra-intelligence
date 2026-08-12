import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });
const MODEL = process.env.GOOGLE_AI_MODEL ?? "gemini-2.0-flash-lite";
const MAX_CONTEXT_CHARS = 12000;

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
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

  const admin = getAdmin();

  // Load brand info
  const { data: brand } = await admin.from("brands").select("name").eq("id", brand_id).single();

  let documentContext = "";
  let documentName = "";

  if (document_id) {
    // Load chunks for a specific document from DB (not from storage)
    const { data: doc } = await admin
      .from("knowledge_documents")
      .select("name")
      .eq("id", document_id)
      .single();
    if (doc) documentName = doc.name;

    const { data: chunks } = await admin
      .from("knowledge_chunks")
      .select("content, chunk_index")
      .eq("document_id", document_id)
      .order("chunk_index")
      .limit(50);

    if (chunks && chunks.length > 0) {
      documentContext = chunks.map((c) => c.content).join("\n\n");
      console.log(`[chat] Loaded ${chunks.length} chunks for document ${document_id}`);
    } else {
      console.log(`[chat] No chunks found for document ${document_id}`);
    }
  } else {
    // Load all knowledge chunks for this brand
    const { data: chunks } = await admin
      .from("knowledge_chunks")
      .select("content, chunk_index")
      .eq("brand_id", brand_id)
      .order("chunk_index")
      .limit(50);

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

  console.log(`[chat] Context length: ${documentContext.length} chars, has_context: ${documentContext.length > 0}`);

  const systemInstruction = documentContext
    ? `You are an intelligent assistant for ${brand?.name ?? "this company"}.

DOCUMENT CONTENT (${documentName}):
---
${documentContext}
---

IMPORTANT RULES:
- Answer questions based on the document content above
- Quote specific parts of the document when relevant
- If something is clearly NOT in the document, say "That information is not in this document"
- Be helpful and concise`
    : `You are an intelligent assistant for ${brand?.name ?? "this company"}. No documents have been indexed yet. Ask the user to upload documents.`;

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
      chunks_loaded: documentContext.length > 0 ? Math.round(documentContext.length / 200) : 0,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Chat failed" },
      { status: 500 }
    );
  }
}
