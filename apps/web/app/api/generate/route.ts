import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { claudeGenerate, BEDROCK_MODEL, friendlyBedrockError } from "@/lib/bedrock";

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
  const { brand_id, brief, platforms = ["linkedin", "twitter", "instagram"] } = body;

  if (!brand_id || !brief) {
    return NextResponse.json({ error: "brand_id and brief are required" }, { status: 400 });
  }

  const admin = getAdmin();
  const { data: brand } = await admin
    .from("brands").select("*").eq("id", brand_id).single();
  if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

  const brandContext = [
    brand.name && `Company: ${brand.name}`,
    brand.description && `Description: ${brand.description}`,
    brand.mission && `Mission: ${brand.mission}`,
    brand.tone_of_voice && `Tone of voice: ${brand.tone_of_voice}`,
    brand.industry && `Industry: ${brand.industry}`,
    brand.keywords?.length && `Keywords: ${brand.keywords.join(", ")}`,
    brand.hashtags?.length && `Brand hashtags: ${brand.hashtags.join(" ")}`,
  ].filter(Boolean).join("\n");

  const systemPrompt = `You are an expert marketing content writer for ${brand.name}.
BRAND CONTEXT:\n${brandContext}
RULES: Match brand tone exactly. No invented statistics. Always include a call to action.`;

  const userPrompt = `Create marketing content for: "${brief}"
Platforms: ${platforms.join(", ")}
Return ONLY raw JSON (no markdown):
{
  "linkedin": {"body": "full post", "hook": "first line", "cta": "cta", "hashtags": ["tag1"]},
  "twitter": {"body": "under 280 chars", "hook": "opener", "cta": "cta", "hashtags": ["tag1"]},
  "instagram": {"body": "caption", "hook": "hook", "cta": "cta", "hashtags": ["tag1","tag2","tag3"]}
}
Only include: ${platforms.join(", ")}.`;

  try {
    const rawContent = await claudeGenerate(systemPrompt, userPrompt, 2048);
    let generated: Record<string, { body: string; hook: string; cta: string; hashtags: string[] }>;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      generated = JSON.parse(jsonMatch?.[0] ?? "{}");
    } catch {
      generated = { linkedin: { body: rawContent, hook: "", cta: "", hashtags: [] } };
    }

    const savedContent = [];
    for (const [platform, content] of Object.entries(generated)) {
      const { data: saved } = await admin.from("content").insert({
        brand_id, platform, type: platform === "twitter" ? "thread" : "post",
        body: content.body, hook: content.hook, cta: content.cta,
        hashtags: content.hashtags, status: "draft",
        ai_metadata: { model: BEDROCK_MODEL, brief },
      }).select().single();
      if (saved) savedContent.push(saved);
    }
    return NextResponse.json({ generated, saved_content: savedContent, model: BEDROCK_MODEL });
  } catch (error) {
    const rawMsg = error instanceof Error ? error.message : String(error);
    console.error("[generate] Bedrock error:", rawMsg);
    // In debug mode expose raw error so we can diagnose; otherwise show friendly message
    const debugMode = process.env.AI_DEBUG === "true";
    const isOverload =
      error instanceof Error &&
      (rawMsg.includes("ThrottlingException") ||
        rawMsg.includes("503") ||
        rawMsg.includes("ServiceUnavailable"));
    return NextResponse.json(
      { error: debugMode ? rawMsg : friendlyBedrockError(error) },
      { status: isOverload ? 503 : 500 }
    );
  }
}
