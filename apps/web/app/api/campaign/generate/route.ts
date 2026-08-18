import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { claudeGenerate, BEDROCK_MODEL, friendlyBedrockError } from "@/lib/bedrock";
import type { CalendarDay } from "@/types/campaign";

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

  const { brand_id, goal, duration = 30, platforms = ["linkedin", "twitter"] } = await request.json();
  if (!brand_id || !goal) {
    return NextResponse.json({ error: "brand_id and goal required" }, { status: 400 });
  }

  const admin = getAdmin();
  const { data: brand } = await admin.from("brands").select("*").eq("id", brand_id).single();
  if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

  const brandContext = [
    brand.name && `Company: ${brand.name}`,
    brand.description && `Description: ${brand.description}`,
    brand.industry && `Industry: ${brand.industry}`,
    brand.tone_of_voice && `Tone: ${brand.tone_of_voice}`,
    brand.mission && `Mission: ${brand.mission}`,
  ].filter(Boolean).join("\n");

  const systemPrompt = `You are a senior marketing strategist. You create comprehensive ${duration}-day content calendars that build audience, drive engagement, and achieve specific business goals. You think in terms of content arcs, themes, and narrative progression.`;

  const userPrompt = `Create a ${duration}-day content calendar for this brand:

${brandContext}

CAMPAIGN GOAL: ${goal}
PLATFORMS: ${platforms.join(", ")}
DURATION: ${duration} days

Generate a strategic calendar with varied content types, platforms, and topics. Think about:
- Week 1: Awareness and problem identification
- Week 2: Education and value
- Week 3: Social proof and case studies
- Week 4: Conversion and calls to action

Return ONLY a raw JSON array (no markdown, no backticks, no explanation):
[
  {
    "day": 1,
    "date_offset": 0,
    "platform": "linkedin",
    "content_type": "post",
    "topic": "The problem we're solving",
    "goal": "Build awareness of the pain point",
    "hook": "Most companies are losing 40% of their marketing budget without knowing it."
  },
  ...
]

Generate exactly ${duration} entries, distributed across: ${platforms.join(", ")}.
Vary content types: post, thread, carousel, newsletter, article.
Make each hook genuinely interesting and platform-appropriate.`;

  try {
    const raw = await claudeGenerate(systemPrompt, userPrompt, 4096);

    let calendar: CalendarDay[];
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      calendar = JSON.parse(jsonMatch?.[0] ?? "[]");
    } catch {
      console.error("[campaign/generate] Parse error, raw:", raw.slice(0, 200));
      return NextResponse.json({ error: "Failed to parse AI calendar output. Please try again." }, { status: 500 });
    }

    if (!calendar.length) {
      return NextResponse.json({ error: "AI returned empty calendar. Please try again." }, { status: 500 });
    }

    return NextResponse.json({
      calendar,
      brand_name: brand.name,
      goal,
      duration,
      platforms,
      total_posts: calendar.length,
      model: BEDROCK_MODEL,
    });
  } catch (error) {
    console.error("[campaign/generate] Bedrock error:", error);
    return NextResponse.json(
      { error: friendlyBedrockError(error) },
      { status: 500 }
    );
  }
}
