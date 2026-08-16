import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

// ── Why we use Gemini, not Imagen ─────────────────────────────────────────────
// imagen-3.0-generate-001 is a Vertex AI model and is NOT available via
// Google AI Studio keys (AQ. prefix). It requires Google Cloud credentials.
// The correct image generation model for Google AI Studio keys is
// gemini-2.0-flash-exp with responseModalities: ["IMAGE"].
// ─────────────────────────────────────────────────────────────────────────────

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });

// gemini-2.0-flash-image was confirmed in the user's available model list.
// The SDK requires responseModalities to include both "TEXT" and "IMAGE".
const IMAGE_MODEL = "gemini-2.0-flash-image";

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
    referenceNote = "Image-to-image reference requires a billed Google AI plan. Generating from text only.";
  }

  try {
    // Generate image using Gemini with IMAGE modality
    // gemini-2.0-flash-preview-image-generation supports responseModalities:["IMAGE"]
    // on Google AI Studio keys (no Vertex AI / billing required)
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: [{ role: "user", parts: [{ text: builtPrompt }] }],
      config: {
        // Must include TEXT alongside IMAGE — required by Gemini SDK
        responseModalities: ["TEXT", "IMAGE"],
      },
    });

    // Extract the image part from the response
    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find(
      (p) => p.inlineData?.mimeType?.startsWith("image/")
    );

    if (!imagePart?.inlineData?.data) {
      // If no image was returned, the model may not support images in this region/version
      const textPart = parts.find((p) => p.text);
      const reason = textPart?.text ?? "No image was returned by the AI.";
      return NextResponse.json(
        { error: `Image generation unavailable: ${reason.slice(0, 200)}` },
        { status: 503 }
      );
    }

    const mimeType = imagePart.inlineData.mimeType;
    const ext = mimeType === "image/png" ? "png" : mimeType === "image/gif" ? "gif" : "jpg";
    const imageBytes = Buffer.from(imagePart.inlineData.data, "base64");

    // Get next sort_order
    const sortResult = await admin
      .from("content_media")
      .select("sort_order")
      .eq("content_id", params.id)
      .order("sort_order", { ascending: false })
      .limit(1);
    const nextOrder = (sortResult.data?.[0]?.sort_order ?? -1) + 1;

    // Upload to Supabase Storage (content-media bucket)
    const storagePath = `${content.brand_id}/${params.id}/generated-${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await admin.storage
      .from("content-media")
      .upload(storagePath, imageBytes, { contentType: mimeType, upsert: false });

    if (uploadError) {
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: { publicUrl } } = admin.storage
      .from("content-media")
      .getPublicUrl(storagePath);

    // Insert content_media row (does NOT overwrite previous generations)
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
    // Return clean error message — never expose raw API error to browser
    const msg = error instanceof Error ? error.message : String(error);
    const clean = msg.includes("not found") || msg.includes("404")
      ? "Image generation model unavailable. Try again or contact support."
      : msg.includes("quota") || msg.includes("429")
      ? "Image generation quota exceeded. Try again in a minute."
      : "Image generation failed. Try again shortly.";
    return NextResponse.json({ error: clean }, { status: 500 });
  }
}

function buildPrompt(
  content: { body?: string; hook?: string; platform?: string },
  brand: { name?: string; tone_of_voice?: string; industry?: string } | null
): string {
  return [
    `Create a professional marketing image for ${brand?.name ?? "a brand"}.`,
    brand?.industry && `Industry: ${brand.industry}.`,
    content.hook && `Post theme: "${content.hook}"`,
    content.platform === "linkedin"
      ? "Style: corporate, clean, professional, suitable for LinkedIn."
      : content.platform === "instagram"
      ? "Style: vibrant, visual, lifestyle, suitable for Instagram."
      : "Style: clear, modern, suitable for social media.",
    "No text overlays. High quality.",
  ].filter(Boolean).join(" ");
}
