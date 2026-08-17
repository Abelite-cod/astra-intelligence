import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { claudeGenerate, friendlyBedrockError } from "@/lib/bedrock";

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
    return NextResponse.json({ error: "brand_id and question are required" }, { status: 400 });
  }

  const admin = getAdmin();

  // ── Retrieve relevant knowledge chunks ───────────────────────────────────────
  // Simple keyword search across chunks — no vector DB required.
  // Supabase full-text search on the content column.
  let chunksQuery = admin
    .from("knowledge_chunks")
    .select("content, document_id, chunk_index")
    .eq("brand_id", brand_id)
    .textSearch("content", question.split(/\s+/).filter((w: string) => w.length > 3).join(" | "), {
      type: "plain",
      config: "english",
    })
    .limit(8);

  if (document_id) {
    chunksQuery = chunksQuery.eq("document_id", document_id);
  }

  const { data: chunks } = await chunksQuery;

  // Fallback: if text search returns nothing, grab latest chunks
  let contextChunks = chunks ?? [];
  if (contextChunks.length === 0) {
    let fallbackQuery = admin
      .from("knowledge_chunks")
      .select("content, document_id, chunk_index")
      .eq("brand_id", brand_id)
      .order("created_at", { ascending: false })
      .limit(6);

    if (document_id) {
      fallbackQuery = fallbackQuery.eq("document_id", document_id);
    }

    const { data: fallbackChunks } = await fallbackQuery;
    contextChunks = fallbackChunks ?? [];
  }

  if (contextChunks.length === 0) {
    return NextResponse.json({
      answer: "I don't have any documents to reference yet. Please upload and index a document first.",
    });
  }

  // ── Build context from chunks ─────────────────────────────────────────────
  const context = contextChunks
    .map((c, i) => `[Excerpt ${i + 1}]\n${c.content}`)
    .join("\n\n---\n\n");

  // ── Build conversation history ────────────────────────────────────────────
  const historyText = (messages as Array<{ role: string; content: string }>)
    .slice(-6)
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  const systemPrompt = `You are a helpful AI assistant that answers questions based strictly on the provided document excerpts.

RULES:
- Answer ONLY using information from the excerpts below
- If the answer is not in the excerpts, say "I couldn't find that information in the uploaded documents"
- Be concise and direct — no lengthy preambles
- Do not invent or hallucinate facts
- Do not use markdown formatting (no **, ##, -, etc.) — write in plain prose
- If referencing multiple points, use numbered lines separated by newlines`;

  const userPrompt = `DOCUMENT EXCERPTS:
${context}

${historyText ? `CONVERSATION HISTORY:\n${historyText}\n\n` : ""}QUESTION: ${question}

Answer based only on the document excerpts above:`;

  try {
    const answer = await claudeGenerate(systemPrompt, userPrompt, 1024);
    return NextResponse.json({ answer: answer.trim() });
  } catch (error) {
    console.error("[chat] Bedrock error:", error);
    return NextResponse.json(
      { error: friendlyBedrockError(error) },
      { status: 500 }
    );
  }
}
