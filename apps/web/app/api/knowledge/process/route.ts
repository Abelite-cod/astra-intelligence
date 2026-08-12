import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── PDF parsing with pdfjs-dist (no test-file side effects) ───────────────────

async function parsePdfBuffer(buffer: Buffer): Promise<{ text: string; numPages: number }> {
  console.log("📄 Starting PDF parse...");

  // pdfjs-dist v6 uses .mjs — must use dynamic import
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs") as {
    getDocument: (src: { data: Uint8Array }) => { promise: Promise<{
      numPages: number;
      getPage: (n: number) => Promise<{
        getTextContent: () => Promise<{ items: Array<{ str?: string }> }>;
      }>;
    }> };
    GlobalWorkerOptions: { workerSrc: string };
  };

  // Point to the actual worker file — required by pdfjs-dist v6
  const { resolve } = await import("path");
  const workerPath = resolve(
    process.cwd(),
    "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"
  );
  pdfjsLib.GlobalWorkerOptions.workerSrc = `file://${workerPath}`;

  const uint8Array = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
  const pdf = await loadingTask.promise;

  const numPages = pdf.numPages;
  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => item.str)
      .join(" ")
      .replace(/\s{3,}/g, " ")
      .trim();
    if (pageText) pageTexts.push(pageText);
  }

  const text = pageTexts.join("\n\n");

  console.log(`✅ PDF parsed successfully`);
  console.log(`Pages: ${numPages}`);
  console.log(`Text length: ${text.length} chars`);
  console.log(`Preview: "${text.slice(0, 200)}"`);

  return { text, numPages };
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: { document_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { document_id } = body;
  if (!document_id) return NextResponse.json({ error: "document_id required" }, { status: 400 });

  console.log(`[process] Starting for document_id: ${document_id}`);

  const admin = getAdmin();

  // ── Stage 1: Look up document ─────────────────────────────────────────────
  const { data: rows, error: docError } = await admin
    .from("knowledge_documents")
    .select("*")
    .eq("id", document_id)
    .limit(1);

  if (docError) {
    return NextResponse.json({ error: `DB lookup error: ${docError.message}` }, { status: 500 });
  }

  const doc = rows?.[0];
  if (!doc) {
    return NextResponse.json({ error: `Document ${document_id} not found` }, { status: 404 });
  }

  console.log(`[process] Document found: ${doc.name} (type: ${doc.type})`);

  // ── Stage 2: Mark as processing ───────────────────────────────────────────
  await admin.from("knowledge_documents").update({ status: "processing" }).eq("id", document_id);

  try {
    let rawText = "";
    let numPages = 0;

    if (doc.file_path) {
      // ── Stage 3: Download from Supabase Storage ───────────────────────────
      console.log(`[process] Downloading from storage: ${doc.file_path}`);
      const { data: fileData, error: dlErr } = await admin.storage
        .from("knowledge")
        .download(doc.file_path);

      if (dlErr || !fileData) {
        throw new Error(`Storage download failed: ${dlErr?.message ?? "unknown"}`);
      }

      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      console.log(`[process] Buffer ready: ${buffer.length} bytes`);

      // ── Stage 4: Parse ────────────────────────────────────────────────────
      if (doc.type === "pdf") {
        const result = await parsePdfBuffer(buffer);
        rawText = result.text;
        numPages = result.numPages;
      } else {
        rawText = buffer.toString("utf-8");
        console.log(`[process] Text file decoded: ${rawText.length} chars`);
      }
    } else if (doc.source_url) {
      // ── URL source ────────────────────────────────────────────────────────
      const res = await fetch(doc.source_url, { headers: { "User-Agent": "AstraBot/1.0" } });
      if (!res.ok) throw new Error(`URL fetch failed: ${res.status}`);
      const html = await res.text();
      rawText = html.replace(/<[^>]*>/g, " ").replace(/\s{3,}/g, " ").trim();
      console.log(`[process] URL crawled: ${rawText.length} chars`);
    }

    if (!rawText || rawText.trim().length < 50) {
      throw new Error("Could not extract meaningful text from this document");
    }

    // ── Stage 5: Chunk the text ───────────────────────────────────────────
    console.log(`[process] ✅ Text extraction complete. Chunking...`);
    const MAX_CHUNK = 1500;
    const OVERLAP = 150;
    const chunks: string[] = [];
    const cleanText = rawText.trim();
    let start = 0;
    while (start < cleanText.length) {
      const end = Math.min(start + MAX_CHUNK, cleanText.length);
      let chunkEnd = end;
      if (end < cleanText.length) {
        for (const bp of ["\n\n", ". ", ".\n", "! ", "? "]) {
          const idx = cleanText.lastIndexOf(bp, end);
          if (idx > start + MAX_CHUNK / 2) { chunkEnd = idx + bp.length; break; }
        }
      }
      const chunk = cleanText.slice(start, chunkEnd).trim();
      if (chunk.length > 30) chunks.push(chunk);
      start = Math.max(start + 1, chunkEnd - OVERLAP);
    }
    console.log(`[process] Created ${chunks.length} chunks`);

    // ── Stage 6: Persist chunks ───────────────────────────────────────────
    await admin.from("knowledge_chunks").delete().eq("document_id", document_id);

    const chunkRows = chunks.map((content, i) => ({
      document_id,
      brand_id: doc.brand_id,
      content,
      chunk_index: i,
      token_count: Math.ceil(content.length / 4),
      metadata: { source: doc.name, type: doc.type, num_pages: numPages },
    }));

    const { error: insertErr } = await admin.from("knowledge_chunks").insert(chunkRows);
    if (insertErr) throw new Error(`Chunk insert failed: ${insertErr.message}`);

    const totalTokens = chunkRows.reduce((s, c) => s + c.token_count, 0);
    await admin.from("knowledge_documents").update({
      status: "indexed",
      chunk_count: chunks.length,
      token_count: totalTokens,
    }).eq("id", document_id);

    console.log(`[process] ✅ Done — ${chunks.length} chunks persisted`);

    return NextResponse.json({
      success: true,
      document_id,
      num_pages: numPages,
      text_length: rawText.length,
      chunks_created: chunks.length,
      preview: rawText.slice(0, 300),
    });

  } catch (error) {
    console.error(`[process] ❌ Error:`, error);
    await admin.from("knowledge_documents")
      .update({ status: "failed", error_message: String(error) })
      .eq("id", document_id);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
