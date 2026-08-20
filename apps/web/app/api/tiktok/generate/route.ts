// POST /api/tiktok/generate
// Generates a complete TikTok-native script using Claude on Bedrock.
// Uses Brand Brain context + TikTok memory patterns for brand-specific output.
// Returns content row + tiktok_scripts row.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { claudeGenerate, BEDROCK_MODEL, friendlyBedrockError } from "@/lib/bedrock";

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Extract TikTok video ID from URL
function extractVideoId(url: string): string | null {
  const match = url.match(/\/video\/(\d+)/);
  return match?.[1] ?? null;
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    brand_id,
    brief,
    campaign_id,
    // Duet/Stitch mode
    response_type,    // 'duet' | 'stitch' | undefined
    original_url,     // TikTok URL to respond to
    original_caption, // Caption of original (user-provided or extracted)
    response_angle,   // agree_and_add | respectful_counter | problem_solution | expert_expansion
    user_context,     // optional extra context
    // Override defaults
    format,
    duration_sec,
    narrative_arc,
  } = body;

  if (!brand_id || !brief) {
    return NextResponse.json({ error: "brand_id and brief are required" }, { status: 400 });
  }

  const admin = getAdmin();

  // Load brand
  const { data: brand } = await admin.from("brands").select("*").eq("id", brand_id).single();
  if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

  // Load TikTok memory patterns (top 5 by confidence)
  const { data: memoryPatterns } = await admin
    .from("tiktok_memory")
    .select("pattern_type, pattern_label, pattern_data, confidence")
    .eq("brand_id", brand_id)
    .eq("is_active", true)
    .order("confidence", { ascending: false })
    .limit(5);

  // Build memory context block
  const memoryBlock = memoryPatterns?.length
    ? `\nBRAND TIKTOK MEMORY — USE THESE TO STAY TRUE TO THIS BRAND'S VOICE:\n${
        memoryPatterns.map((p) =>
          `${p.pattern_type.toUpperCase()} (${p.pattern_label}, confidence ${Math.round(p.confidence * 100)}%):\n${JSON.stringify(p.pattern_data, null, 2)}`
        ).join("\n\n")
      }\n`
    : "";

  // Brand context
  const brandContext = [
    brand.name && `Brand: ${brand.name}`,
    brand.industry && `Industry: ${brand.industry}`,
    brand.tone_of_voice && `Brand voice: ${brand.tone_of_voice}`,
    brand.description && `About: ${brand.description}`,
    brand.mission && `Mission: ${brand.mission}`,
  ].filter(Boolean).join("\n");

  const isDuetStitch = !!response_type && !!original_url;
  const originalVideoId = original_url ? extractVideoId(original_url) : null;

  const systemPrompt = `You are a TikTok-native content strategist and scriptwriter for ${brand.name}.

${brandContext}
${memoryBlock}
GOLDEN RULES — NEVER BREAK THESE:
1. TikTok content must be CONVERSATIONAL, not corporate
2. NEVER repurpose LinkedIn posts — TikTok requires different structure, pace, and language
3. The hook must create pattern interrupt in the first 0-3 seconds
4. Script must feel like a real person talking, not a marketing department
5. Short sentences. Natural pauses. No jargon.
6. Always return raw JSON only — no markdown, no backticks, no explanation`;

  let userPrompt: string;

  if (isDuetStitch) {
    const responseAngleInstructions = {
      agree_and_add: "Validate what's correct in the original, then add your unique layer of expertise that the original missed",
      respectful_counter: "Respectfully disagree with a key point, backed by your brand's expertise — never attack the creator",
      problem_solution: "The original video describes a problem. Position your brand as the solution without being salesy",
      expert_expansion: "The original touches on something you know deeply — expand it with your expert take",
    }[response_angle as string] ?? "Add value to the original video's topic";

    userPrompt = `Generate a TikTok ${response_type} script to respond to this video:

ORIGINAL VIDEO URL: ${original_url}
ORIGINAL CREATOR: ${original_url.match(/@([^/]+)/)?.[1] ?? "Unknown"}
ORIGINAL CAPTION: ${original_caption ?? "Not provided"}
RESPONSE ANGLE: ${responseAngleInstructions}
${user_context ? `ADDITIONAL CONTEXT: ${user_context}` : ""}

Your brief: "${brief}"

Return ONLY this raw JSON:
{
  "hook": "opening line that hooks viewers in 0-3 seconds",
  "hook_type": "statement",
  "concept": "one sentence describing the video",
  "narrative_arc": "problem_solution",
  "full_script": "complete word-for-word script",
  "voiceover_text": "what is said out loud",
  "on_screen_text": ["text overlay 1", "text overlay 2"],
  "scenes": [
    {
      "order": 1,
      "duration_sec": 4,
      "visual_direction": "describe what camera shows",
      "action": "what the presenter does",
      "voiceover": "what is said",
      "text_overlay": "on-screen text",
      "transition": "cut"
    }
  ],
  "duration_sec": 30,
  "format": "talking_head",
  "visual_style": "clean background, direct eye contact",
  "music_suggestion": "trending lo-fi beat, instrumental",
  "caption": "TikTok caption (max 2200 chars)",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "cta": "call to action text",
  "response_type": "${response_type}",
  "original_creator": "${original_url.match(/@([^/]+)/)?.[1] ?? ""}",
  "original_claim": "what the original video claims in one sentence",
  "stitch_clip_start_sec": ${response_type === 'stitch' ? '0' : 'null'},
  "stitch_clip_end_sec": ${response_type === 'stitch' ? '4' : 'null'},
  "estimated_hook_score": 0.8,
  "pattern_match": []
}`;
  } else {
    userPrompt = `Generate a complete TikTok script for this brief: "${brief}"

Platform: TikTok
Format preference: ${format ?? "talking_head (or suggest best format)"}
Duration: ${duration_sec ?? "30"} seconds
Narrative arc: ${narrative_arc ?? "problem_solution (or suggest best)"}

Return ONLY this raw JSON:
{
  "hook": "opening line that hooks viewers in 0-3 seconds",
  "hook_type": "statement",
  "concept": "one sentence describing the video",
  "narrative_arc": "problem_solution",
  "full_script": "complete word-for-word script",
  "voiceover_text": "what is said out loud",
  "on_screen_text": ["text overlay 1", "text overlay 2", "text overlay 3"],
  "scenes": [
    {
      "order": 1,
      "duration_sec": 3,
      "visual_direction": "describe what camera shows",
      "action": "what the presenter does",
      "voiceover": "what is said in this scene",
      "text_overlay": "on-screen text for this scene",
      "transition": "cut"
    }
  ],
  "duration_sec": 30,
  "format": "talking_head",
  "visual_style": "clean background, direct eye contact, expressive",
  "music_suggestion": "trending lo-fi beat, 120 BPM, instrumental",
  "caption": "TikTok caption text (max 2200 chars, conversational)",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "cta": "call to action",
  "estimated_hook_score": 0.8,
  "pattern_match": []
}`;
  }

  try {
    const raw = await claudeGenerate(systemPrompt, userPrompt, 4096);

    let script: Record<string, unknown>;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      script = JSON.parse(jsonMatch?.[0] ?? "{}");
    } catch {
      console.error("[tiktok/generate] Parse error, raw:", raw.slice(0, 300));
      return NextResponse.json({ error: "Failed to parse AI script. Please try again." }, { status: 500 });
    }

    // Create content row
    const { data: content, error: contentError } = await admin.from("content").insert({
      brand_id,
      campaign_id: campaign_id ?? null,
      platform: "tiktok",
      type: "video",
      body: (script.caption as string) ?? brief,
      hook: (script.hook as string) ?? "",
      hashtags: (script.hashtags as string[]) ?? [],
      status: "draft",
      ai_metadata: {
        model: BEDROCK_MODEL,
        brief,
        concept: script.concept,
        format: script.format,
        duration_sec: script.duration_sec,
        response_type: response_type ?? null,
        original_url: original_url ?? null,
      },
    }).select().single();

    if (contentError) return NextResponse.json({ error: contentError.message }, { status: 500 });

    // Create tiktok_scripts row
    const { data: tiktokScript, error: scriptError } = await admin.from("tiktok_scripts").insert({
      content_id: content.id,
      brand_id,
      hook: (script.hook as string) ?? "",
      hook_type: (script.hook_type as string) ?? "statement",
      concept: (script.concept as string) ?? brief,
      narrative_arc: (script.narrative_arc as string) ?? "problem_solution",
      full_script: (script.full_script as string) ?? "",
      voiceover_text: (script.voiceover_text as string) ?? "",
      on_screen_text: (script.on_screen_text as string[]) ?? [],
      scenes: script.scenes ?? [],
      duration_sec: (script.duration_sec as number) ?? 30,
      format: (script.format as string) ?? "talking_head",
      visual_style: (script.visual_style as string) ?? "",
      music_suggestion: (script.music_suggestion as string) ?? "",
      caption: (script.caption as string) ?? "",
      hashtags: (script.hashtags as string[]) ?? [],
      cta: (script.cta as string) ?? "",
      // Duet/stitch fields
      response_type: response_type ?? null,
      original_video_url: original_url ?? null,
      original_creator: (script.original_creator as string) ?? null,
      original_claim: (script.original_claim as string) ?? null,
      response_angle: response_angle ?? null,
      stitch_clip_start_sec: (script.stitch_clip_start_sec as number) ?? null,
      stitch_clip_end_sec: (script.stitch_clip_end_sec as number) ?? null,
      upload_status: "pending_script",
      estimated_hook_score: (script.estimated_hook_score as number) ?? null,
      pattern_match: (script.pattern_match as string[]) ?? [],
    }).select().single();

    if (scriptError) return NextResponse.json({ error: scriptError.message }, { status: 500 });

    // If this was a duet/stitch, update respond queue if entry exists
    if (isDuetStitch) {
      await admin.from("tiktok_respond_queue")
        .update({ content_id: content.id, status: "draft" })
        .eq("brand_id", brand_id)
        .eq("original_url", original_url)
        .eq("status", "generating");
    }

    return NextResponse.json({
      content,
      script: tiktokScript,
      model: BEDROCK_MODEL,
    });
  } catch (error) {
    console.error("[tiktok/generate] Bedrock error:", error);
    return NextResponse.json(
      { error: friendlyBedrockError(error) },
      { status: 500 }
    );
  }
}
