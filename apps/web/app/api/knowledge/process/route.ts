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

  // Use legacy build — works in Node.js without canvas
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js") as {
    getDocument: (src: { data: Uint8Array }) => { promise: Promise<{
      numPages: number;
      getPage: (n: number) => Promise<{
        getTextContent: () => Promise<{ items: Array<{ str: string }> }>;
      }>;
    }> };
    GlobalWorkerOptions: { workerSrc: string | boolean };
  };

  // Disable web worker — not needed in Node.js
  pdfjsLib.GlobalWorkerOptions.workerSrc = false as unknown as string;

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

    // ── Stage 5: Chunking (coming next) ───────────────────────────────────
    // For now: return success with the extracted text to confirm parsing works
    console.log(`[process] ✅ Text extraction complete. Ready for chunking.`);

    // Temporary: update status to show we got this far
    await admin.from("knowledge_documents").update({
      status: "indexed",
      chunk_count: Math.ceil(rawText.length / 1500),
      token_count: Math.ceil(rawText.length / 4),
    }).eq("id", document_id);

    return NextResponse.json({
      success: true,
      document_id,
      num_pages: numPages,
      text_length: rawText.length,
      preview: rawText.slice(0, 300),
      status: "text_extracted_chunking_pending",
    });

  } catch (error) {
    console.error(`[process] ❌ Error:`, error);
    await admin.from("knowledge_documents")
      .update({ status: "failed", error_message: String(error) })
      .eq("id", document_id);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
