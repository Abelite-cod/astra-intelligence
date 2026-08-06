import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string; numpages: number }>;

const MAX_CHUNK_CHARS = 1500;
const CHUNK_OVERLAP = 200;

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── Chunking ──────────────────────────────────────────────────────────────────

function chunkText(text: string): string[] {
  if (!text || text.length < 100) return text ? [text] : [];
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + MAX_CHUNK_CHARS, text.length);
    let chunkEnd = end;
    if (end < text.length) {
      for (const bp of ["\n\n", ". ", ".\n", "! ", "? "]) {
        const idx = text.lastIndexOf(bp, end);
        if (idx > start + MAX_CHUNK_CHARS / 2) { chunkEnd = idx + bp.length; break; }
      }
    }
    const chunk = text.slice(start, chunkEnd).trim();
    if (chunk.length > 30) chunks.push(chunk);
    start = Math.max(start + 1, chunkEnd - CHUNK_OVERLAP);
  }
  return chunks;
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const { document_id } = await request.json();
  if (!document_id) return NextResponse.json({ error: "document_id required" }, { status: 400 });

  const admin = getAdmin();

  const { data: doc, error: docError } = await admin
    .from("knowledge_documents")
    .select("*")
    .eq("id", document_id)
    .single();

  if (docError) {
    console.error("[process] Doc lookup error:", docError);
    return NextResponse.json({ error: docError.message }, { status: 500 });
  }
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  await admin.from("knowledge_documents").update({ status: "processing" }).eq("id", document_id);

  try {
    let rawText = "";

    if (doc.file_path) {
      const { data: fileData, error: dlErr } = await admin.storage
        .from("knowledge")
        .download(doc.file_path);

      if (dlErr || !fileData) {
        throw new Error(`Storage download failed: ${dlErr?.message ?? "unknown"}`);
      }

      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (doc.type === "pdf") {
        const parsed = await pdfParse(buffer);
        rawText = parsed.text ?? "";
        console.log(`[process] PDF parsed: ${parsed.numpages} pages, ${rawText.length} chars`);
      } else {
        rawText = buffer.toString("utf-8");
      }

      console.log(`[process] Preview: "${rawText.slice(0, 150)}"`);
    } else if (doc.source_url) {
      const res = await fetch(doc.source_url, { headers: { "User-Agent": "AstraBot/1.0" } });
      if (!res.ok) throw new Error(`URL fetch failed: ${res.status}`);
      const html = await res.text();
      rawText = html.replace(/<[^>]*>/g, " ").replace(/\s{3,}/g, " ").trim();
      console.log(`[process] Crawled ${rawText.length} chars from ${doc.source_url}`);
    }

    if (!rawText || rawText.trim().length < 50) {
      throw new Error("Could not extract meaningful text from this document");
    }

    const chunks = chunkText(rawText.trim());
    if (chunks.length === 0) throw new Error("No chunks created");
    console.log(`[process] Created ${chunks.length} chunks`);

    // Delete old chunks and insert fresh
    await admin.from("knowledge_chunks").delete().eq("document_id", document_id);

    const chunkRows = chunks.map((content, i) => ({
      document_id,
      brand_id: doc.brand_id,
      content,
      chunk_index: i,
      token_count: Math.ceil(content.length / 4),
      metadata: { source: doc.name, type: doc.type },
    }));

    const { error: insertErr } = await admin.from("knowledge_chunks").insert(chunkRows);
    if (insertErr) throw new Error(`Chunk insert failed: ${insertErr.message}`);

    const totalTokens = chunkRows.reduce((s, c) => s + c.token_count, 0);
    await admin.from("knowledge_documents").update({
      status: "indexed",
      chunk_count: chunks.length,
      token_count: totalTokens,
    }).eq("id", document_id);

    return NextResponse.json({
      success: true,
      document_id,
      chunks_created: chunks.length,
      text_length: rawText.length,
      preview: rawText.slice(0, 200),
    });
  } catch (error) {
    console.error(`[process] Error:`, error);
    await admin.from("knowledge_documents")
      .update({ status: "failed", error_message: String(error) })
      .eq("id", document_id);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
