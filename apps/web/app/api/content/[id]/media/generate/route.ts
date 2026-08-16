import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// ── Image generation via Pollinations.ai ──────────────────────────────────────
// Free, no API key required, works on any server including Railway production.
// Google AI Studio (AQ. keys) does NOT support responseModalities:["IMAGE"] on
// free tier — that requires Google Cloud Vertex AI credentials.
// Pollinations.ai generates real AI images from text prompts with no auth.
// ─────────────────────────────────────────────────────────────────────────────

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getAdmin();

  const { prompt: userPrompt, reference_media_id } = await request.json();

  // Load content for context
  const { data: content } = await admin
    .from("content")
    .select("*, brands(name, tone_of_voice, industry)")
    .eq("id", params.id)
    .single();

  if (!content) return NextResponse.json({ error: "Content not found" }, { status: 404 });

  const brand = content.brands as { name?: string; tone_of_voice?: string; industry?: string } | null;
  const builtPrompt = userPrompt ?? buildPrompt(content, brand);

  let referenceNote: string | undefined;
  if (reference_media_id) {
    referenceNote = "Image-to-image reference requires a paid image generation plan. Generating from text only.";
  }

  try {
    // Pollinations.ai: free image generation, no API key required
    // Encodes prompt into a URL and fetches the generated image bytes
    const encodedPrompt = encodeURIComponent(builtPrompt);
    const aspectRatio = content.platform === "twitter" ? "1024x1024" : "1024x1280";
    const [width, height] = aspectRatio.split("x");
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&enhance=true&model=flux`;

    const imgRes = await fetch(pollinationsUrl, {
      headers: { "User-Agent": "AstraIntelligence/1.0" },
      signal: AbortSignal.timeout(60000), // 60 second timeout
    });

    if (!imgRes.ok) {
      throw new Error(`Image generation service returned ${imgRes.status}`);
    }

    const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";
    const imageBytes = Buffer.from(await imgRes.arrayBuffer());

    if (imageBytes.length < 1000) {
      throw new Error("Generated image too small — service may be temporarily unavailable");
    }

    const ext = contentType.includes("png") ? "png" : contentType.includes("gif") ? "gif" : "jpg";

    // Get next sort_order
    const sortResult = await admin
      .from("content_media")
      .select("sort_order")
      .eq("content_id", params.id)
      .order("sort_order", { ascending: false })
      .limit(1);
    const nextOrder = (sortResult.data?.[0]?.sort_order ?? -1) + 1;

    // Upload to Supabase Storage
    const storagePath = `${content.brand_id}/${params.id}/generated-${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await admin.storage
      .from("content-media")
      .upload(storagePath, imageBytes, { contentType, upsert: false });

    if (uploadError) {
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: { publicUrl } } = admin.storage
      .from("content-media")
      .getPublicUrl(storagePath);

    // Insert content_media row — each generate creates a NEW row, never overwrites
    const { data: media, error: dbError } = await admin
      .from("content_media")
      .insert({
        content_id: params.id,
        brand_id: content.brand_id,
        type: "generated",
        storage_path: storagePath,
        public_url: publicUrl,
        prompt: builtPrompt,
        sort_order: nextOrder,
        selected: true,
      })
      .select()
      .single();

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

    return NextResponse.json({ media, reference_note: referenceNote });

  } catch (error) {
    console.error("[media/generate] Error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    const clean = msg.includes("abort") || msg.includes("timeout")
      ? "Image generation timed out. Try again."
      : msg.includes("503") || msg.includes("unavailable")
      ? "Image generation service temporarily unavailable. Try again in a moment."
      : "Image generation failed. Try again shortly.";
    return NextResponse.json({ error: clean }, { status: 500 });
  }
}

function buildPrompt(
  content: { body?: string; hook?: string; platform?: string },
  brand: { name?: string; tone_of_voice?: string; industry?: string } | null
): string {
  return [
    `Professional marketing image for ${brand?.name ?? "a brand"}.`,
    brand?.industry && `Industry: ${brand.industry}.`,
    content.hook && `Theme: ${content.hook.slice(0, 100)}`,
    content.platform === "linkedin"
      ? "Corporate, clean, professional style. LinkedIn format."
      : content.platform === "instagram"
      ? "Vibrant, lifestyle, visually compelling. Instagram format."
      : "Clean, modern, social media optimized.",
    "No text. No words. High quality. Photorealistic or illustrated.",
  ].filter(Boolean).join(" ");
}
