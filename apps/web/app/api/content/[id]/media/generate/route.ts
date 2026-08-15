import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { GoogleGenAI, PersonGeneration } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── POST /api/content/[id]/media/generate ────────────────────────────────────
// Generates an image using Google Imagen 3 and stores it in Supabase Storage.
// Reference image (image-to-image): only supported with Imagen 3 billed tier.
// The free tier (imagen-3.0-generate-001) is TEXT → IMAGE only.
// If a reference_media_id is provided but the model doesn't support it,
// we log the limitation and generate from text only rather than failing.
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

  // Build the generation prompt
  const brand = content.brands as { name?: string; tone_of_voice?: string; industry?: string } | null;
  const builtPrompt = userPrompt ?? buildPrompt(content, brand);

  // Reference image note
  let referenceNote = "";
  if (reference_media_id) {
    referenceNote = "NOTE: Image-to-image reference is not supported on the current free tier of Google Imagen. Generating from text only.";
    console.log(`[media/generate] ${referenceNote}`);
  }

  try {
    // Use Imagen 3 via Google AI SDK
    const response = await ai.models.generateImages({
      model: "imagen-3.0-generate-001",
      prompt: builtPrompt,
      config: {
        numberOfImages: 1,
        aspectRatio: content.platform === "twitter" ? "1:1" : "4:5",
        personGeneration: PersonGeneration.DONT_ALLOW,
      },
    });

    const imageData = response.generatedImages?.[0]?.image?.imageBytes;
    if (!imageData) {
      return NextResponse.json({ error: "No image returned from AI" }, { status: 500 });
    }

    // Decode base64 bytes
    const imageBytes = Buffer.from(imageData, "base64");

    // Upload to Supabase Storage
    const sortResult = await admin
      .from("content_media")
      .select("sort_order")
      .eq("content_id", params.id)
      .order("sort_order", { ascending: false })
      .limit(1);
    const nextOrder = (sortResult.data?.[0]?.sort_order ?? -1) + 1;

    const storagePath = `${content.brand_id}/${params.id}/generated-${crypto.randomUUID()}.png`;
    const { error: uploadError } = await admin.storage
      .from("content-media")
      .upload(storagePath, imageBytes, { contentType: "image/png", upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: `Storage upload failed: ${uploadError.message}` }, { status: 500 });
    }

    const { data: { publicUrl } } = admin.storage
      .from("content-media")
      .getPublicUrl(storagePath);

    // Insert content_media row
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

    return NextResponse.json({
      media,
      reference_note: referenceNote || undefined,
    });
  } catch (error) {
    console.error("[media/generate] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Image generation failed" },
      { status: 500 }
    );
  }
}

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildPrompt(
  content: { body?: string; hook?: string; platform?: string },
  brand: { name?: string; tone_of_voice?: string; industry?: string } | null
): string {
  const parts = [
    `Create a professional marketing image for ${brand?.name ?? "a brand"}.`,
    brand?.industry && `Industry: ${brand.industry}.`,
    content.hook && `Post message: "${content.hook}"`,
    content.platform && `Platform: ${content.platform}.`,
    "Style: clean, modern, professional, high quality, no text overlays.",
    "Aspect ratio appropriate for social media.",
  ].filter(Boolean);

  return parts.join(" ");
}
