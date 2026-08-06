import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const MAX_CHUNK_CHARS = 1500;
const CHUNK_OVERLAP = 200;

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── Text extraction ───────────────────────────────────────────────────────────

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
      const s = m[1]
        .replace(/\\n/g, "\n").replace(/\\r/g, "").replace(/\\t/g, " ")
        .replace(/\\\(/g, "(").replace(/\\\)/g, ")").replace(/\\\\/g, "\\");
      if (s.trim().length > 3) chunks.push(s);
    }
  }
  return chunks.join(" ").replace(/\s{3,}/g, " ").replace(/[^\x20-\x7E\n]/g, "").trim();
}

function extractTextFromBytes(bytes: Uint8Array, type: string): string {
  if (type === "pdf") return extractTextFromPdfBytes(bytes);
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
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
      for (const bp of [". ", ".\n", "! ", "? ", "\n\n"]) {
        const idx = text.lastIndexOf(bp, end);
        if (idx > start + MAX_CHUNK_CHARS / 2) { chunkEnd = idx + bp.length; break; }
      }
    }
    const chunk = text.slice(start, chunkEnd).trim();
    if (chunk.length > 50) chunks.push(chunk);
    start = Math.max(start + 1, chunkEnd - CHUNK_OVERLAP);
  }
  return chunks;
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Auth check with user client
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { document_id } = await request.json();
  if (!document_id) return NextResponse.json({ error: "document_id required" }, { status: 400 });

  // Use admin client for all DB operations (bypasses RLS)
  const admin = getAdmin();

  const { data: doc } = await admin
    .from("knowledge_documents")
    .select("*")
    .eq("id", document_id)
    .single();

  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  await admin
    .from("knowledge_documents")
    .update({ status: "processing" })
    .eq("id", document_id);

  try {
    let rawText = "";

    if (doc.file_path) {
      // Download from Supabase Storage using admin client
      const { data: fileData, error: dlErr } = await admin.storage
        .from("knowledge")
        .download(doc.file_path);

      if (dlErr || !fileData) {
        throw new Error(`Storage download failed: ${dlErr?.message ?? "unknown"}`);
      }

      const buffer = await fileData.arrayBuffer();
      rawText = extractTextFromBytes(new Uint8Array(buffer), doc.type);
      console.log(`[process] Extracted ${rawText.length} chars from ${doc.name}`);
    } else if (doc.source_url) {
      const res = await fetch(doc.source_url, { headers: { "User-Agent": "AstraBot/1.0" } });
      if (!res.ok) throw new Error(`URL fetch failed: ${res.status}`);
      const html = await res.text();
      rawText = html.replace(/<[^>]*>/g, " ").replace(/\s{3,}/g, " ").trim();
      console.log(`[process] Crawled ${rawText.length} chars from ${doc.source_url}`);
    }

    if (!rawText || rawText.length < 50) {
      throw new Error("Could not extract meaningful text from this document");
    }

    const chunks = chunkText(rawText);
    if (chunks.length === 0) throw new Error("No chunks created");
    console.log(`[process] Created ${chunks.length} chunks`);

    // Delete old chunks
    await admin.from("knowledge_chunks").delete().eq("document_id", document_id);

    // Insert new chunks using admin client (bypasses RLS)
    const chunkRows = chunks.map((content, i) => ({
      document_id,
      brand_id: doc.brand_id,
      content,
      chunk_index: i,
      token_count: Math.ceil(content.length / 4),
      metadata: { source: doc.name, type: doc.type },
    }));

    const { error: insertErr } = await admin
      .from("knowledge_chunks")
      .insert(chunkRows);

    if (insertErr) throw new Error(`Chunk insert failed: ${insertErr.message}`);
    console.log(`[process] Inserted ${chunks.length} chunks for doc ${document_id}`);

    const totalTokens = chunkRows.reduce((s, c) => s + (c.token_count ?? 0), 0);

    // Update document status
    await admin
      .from("knowledge_documents")
      .update({
        status: "indexed",
        chunk_count: chunks.length,
        token_count: totalTokens,
      })
      .eq("id", document_id);

    return NextResponse.json({
      success: true,
      document_id,
      chunks_created: chunks.length,
      text_length: rawText.length,
    });
  } catch (error) {
    console.error(`[process] Error for doc ${document_id}:`, error);
    await admin
      .from("knowledge_documents")
      .update({ status: "failed", error_message: String(error) })
      .eq("id", document_id);

    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
