import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

// ── Two-stage image generation pipeline ───────────────────────────────────────
// Stage 1: Gemini analyzes the post and generates a structured visual brief
//          (subject, visual metaphor, mood, composition, platform guidance)
// Stage 2: Pollinations.ai renders the visual brief as a real image
//
// This ensures the image is semantically relevant to the actual post content,
// not a generic "professional marketing image."
// ─────────────────────────────────────────────────────────────────────────────

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });
const BRIEF_MODEL = process.env.GOOGLE_AI_MODEL ?? "gemini-2.0-flash-lite";

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── Stage 1: Use Gemini to build a visual brief from post content ─────────────

async function buildVisualBrief(params: {
  body: string;
  hook?: string;
  title?: string;
  platform: string;
  brandName: string;
  brandIndustry?: string;
  brandTone?: string;
  userPrompt?: string;
}): Promise<string> {
  const { body, hook, title, platform, brandName, brandIndustry, brandTone, userPrompt } = params;

  const postContent = [
    title && `TITLE: ${title}`,
    hook && `HOOK: ${hook}`,
    `POST CONTENT:\n${body.slice(0, 800)}`,
  ].filter(Boolean).join("\n\n");

  const platformGuidance = {
    linkedin: "LinkedIn: professional, thought-leadership, clean corporate style, suitable for B2B audience",
    twitter: "X/Twitter: bold, attention-grabbing, strong visual hierarchy, high contrast",
    instagram: "Instagram: visually rich, polished, strong focal point, lifestyle or brand feel",
  }[platform] ?? "social media: clean, modern, professional";

  const systemPrompt = `You are a visual art director specializing in social media marketing for SaaS and technology brands. 
Your job is to analyze a post and produce a precise, detailed image generation prompt for an AI image generator.
The image must visually represent the SPECIFIC topic and concepts of this post — never a generic "professional" image.
Write ONLY the image generation prompt — no explanation, no preamble, no quotes. Just the prompt text.`;

  const userContent = `BRAND: ${brandName}
INDUSTRY: ${brandIndustry ?? "Technology / SaaS"}
BRAND TONE: ${brandTone ?? "professional, modern, intelligent"}
PLATFORM: ${platformGuidance}
${userPrompt ? `USER'S CUSTOM REQUEST: ${userPrompt}\n` : ""}
${postContent}

Now write a detailed visual scene description for an AI image generator. 
Requirements:
- Describe a specific visual scene that directly represents the post's main concept
- Use visual metaphors (e.g., for AI decision-making: a sleek control room with data flows, not a generic robot)
- Include mood, lighting, color palette
- Specify composition (wide shot, close-up, isometric, etc.)
- Include style (photorealistic, flat illustration, 3D render, etc.)
- Platform guidance: ${platformGuidance}
- IMPORTANT: No text in the image. No typography. No words.
- IMPORTANT: No generic stock photo clichés (handshakes, lightbulbs, magnifying glasses unless truly relevant)
- The image should make a LinkedIn/X/Instagram viewer stop scrolling because it's visually interesting AND relevant to the post`;

  const response = await ai.models.generateContent({
    model: BRIEF_MODEL,
    contents: userContent,
    config: { systemInstruction: systemPrompt },
  });

  const brief = response.text ?? "";
  if (!brief || brief.length < 20) {
    throw new Error("Gemini did not return a usable visual brief");
  }
  return brief.trim();
}

// ── Stage 2: Render via Pollinations.ai ────────────────────────────────────────

async function renderWithPollinations(prompt: string, platform: string): Promise<Buffer> {
  const [width, height] = platform === "twitter"
    ? ["1024", "1024"]     // 1:1 for Twitter
    : platform === "instagram"
    ? ["1080", "1350"]     // 4:5 for Instagram
    : ["1200", "630"];     // 1.91:1 for LinkedIn

  const encodedPrompt = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&enhance=true&model=flux&seed=${Math.floor(Math.random() * 999999)}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "AstraIntelligence/1.0" },
    signal: AbortSignal.timeout(90000),
  });

  if (!res.ok) throw new Error(`Image generation service returned ${res.status}`);

  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length < 5000) throw new Error("Generated image too small — service may be unavailable");

  return bytes;
}

// ── Main handler ───────────────────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getAdmin();
  const { prompt: userPrompt, reference_media_id } = await request.json();

  // Load content + brand
  const { data: content } = await admin
    .from("content")
    .select("*, brands(name, tone_of_voice, industry)")
    .eq("id", params.id)
    .single();

  if (!content) return NextResponse.json({ error: "Content not found" }, { status: 404 });

  const brand = content.brands as { name?: string; tone_of_voice?: string; industry?: string } | null;

  let referenceNote: string | undefined;
  if (reference_media_id) {
    referenceNote = "Image-to-image reference requires a paid image generation plan. Generating from text only.";
  }

  // ── Stage 1: Build visual brief with Gemini ───────────────────────────────
  let finalPrompt: string;
  try {
    finalPrompt = await buildVisualBrief({
      body: content.body ?? "",
      hook: content.hook ?? undefined,
      title: content.title ?? undefined,
      platform: content.platform ?? "linkedin",
      brandName: brand?.name ?? "Astra Intelligence",
      brandIndustry: brand?.industry ?? undefined,
      brandTone: brand?.tone_of_voice ?? undefined,
      userPrompt: userPrompt ?? undefined,
    });
  } catch (briefError) {
    // Fallback: if Gemini fails, use a structured manual prompt
    console.warn("[media/generate] Gemini brief failed, using fallback:", briefError);
    finalPrompt = buildFallbackPrompt(content, brand, userPrompt);
  }

  // ── Stage 2: Render image ─────────────────────────────────────────────────
  try {
    const imageBytes = await renderWithPollinations(finalPrompt, content.platform ?? "linkedin");
    const contentType = "image/jpeg";

    // Get next sort_order
    const sortResult = await admin
      .from("content_media")
      .select("sort_order")
      .eq("content_id", params.id)
      .order("sort_order", { ascending: false })
      .limit(1);
    const nextOrder = (sortResult.data?.[0]?.sort_order ?? -1) + 1;

    // Upload to Supabase Storage
    const storagePath = `${content.brand_id}/${params.id}/generated-${crypto.randomUUID()}.jpg`;
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

    // Insert content_media row — never overwrites previous generations
    const { data: media, error: dbError } = await admin
      .from("content_media")
      .insert({
        content_id: params.id,
        brand_id: content.brand_id,
        type: "generated",
        storage_path: storagePath,
        public_url: publicUrl,
        prompt: finalPrompt, // store the actual visual brief for inspection
        sort_order: nextOrder,
        selected: true,
      })
      .select()
      .single();

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

    return NextResponse.json({ media, reference_note: referenceNote });

  } catch (error) {
    console.error("[media/generate] Render error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    const clean = msg.includes("timeout") || msg.includes("abort")
      ? "Image generation timed out (90s). Try again."
      : msg.includes("unavailable") || msg.includes("503")
      ? "Image generation service temporarily unavailable. Try again in a moment."
      : "Image generation failed. Try again.";
    return NextResponse.json({ error: clean }, { status: 500 });
  }
}

// ── Fallback prompt builder (used if Gemini is unavailable) ───────────────────

function buildFallbackPrompt(
  content: { body?: string; hook?: string; platform?: string },
  brand: { name?: string; industry?: string } | null,
  userPrompt?: string
): string {
  if (userPrompt) return userPrompt;

  // Extract key concepts from post body
  const text = (content.hook ?? content.body ?? "").slice(0, 200);
  const platform = content.platform ?? "linkedin";

  const style = platform === "linkedin"
    ? "professional corporate illustration, clean design, B2B SaaS visual"
    : platform === "instagram"
    ? "vibrant professional photography style, strong focal point, brand lifestyle"
    : "bold graphic design, high contrast, social media optimized";

  return `${style} representing: ${text}. For ${brand?.industry ?? "technology"} brand. No text in image. High quality.`;
}
