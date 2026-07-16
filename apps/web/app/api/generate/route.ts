import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const MODEL = process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.1-8b-instruct:free";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { brand_id, brief, platforms = ["linkedin", "twitter", "instagram"] } = body;

  if (!brand_id || !brief) {
    return NextResponse.json({ error: "brand_id and brief are required" }, { status: 400 });
  }

  // Load brand context
  const { data: brand } = await supabase
    .from("brands")
    .select("*")
    .eq("id", brand_id)
    .single();

  if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

  // Build brand context string
  const brandContext = [
    brand.name && `Company: ${brand.name}`,
    brand.description && `Description: ${brand.description}`,
    brand.mission && `Mission: ${brand.mission}`,
    brand.tone_of_voice && `Tone of voice: ${brand.tone_of_voice}`,
    brand.industry && `Industry: ${brand.industry}`,
    brand.keywords?.length && `Keywords: ${brand.keywords.join(", ")}`,
    brand.hashtags?.length && `Brand hashtags: ${brand.hashtags.join(" ")}`,
  ]
    .filter(Boolean)
    .join("\n");

  const systemPrompt = `You are an expert marketing content writer for ${brand.name}.

BRAND CONTEXT:
${brandContext}

RULES:
- Always match the brand's tone of voice exactly
- Never make up statistics or claims not in the brief
- Always end with a call to action
- Use the brand's hashtags where appropriate
- Keep each platform post within its character limit`;

  const userPrompt = `Create marketing content for the following brief:

"${brief}"

Generate content for these platforms: ${platforms.join(", ")}

Respond in this exact JSON format:
{
  "linkedin": {
    "body": "full post text",
    "hook": "first sentence/attention grabber",
    "cta": "call to action",
    "hashtags": ["tag1", "tag2"]
  },
  "twitter": {
    "body": "tweet text (max 280 chars)",
    "hook": "opening line",
    "cta": "call to action",
    "hashtags": ["tag1", "tag2"]
  },
  "instagram": {
    "body": "caption text",
    "hook": "opening hook",
    "cta": "call to action",
    "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
  }
}

Only include platforms that were requested. Make each platform version feel native to that platform.`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://astra-intelligence.com",
        "X-Title": "Astra Intelligence",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json({ error: err.error?.message ?? "AI generation failed" }, { status: 500 });
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content ?? "";

    // Parse JSON from response
    let generated: Record<string, { body: string; hook: string; cta: string; hashtags: string[] }>;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      generated = JSON.parse(jsonMatch?.[0] ?? "{}");
    } catch {
      // Fallback: return raw content as linkedin post
      generated = {
        linkedin: { body: rawContent, hook: "", cta: "", hashtags: [] },
      };
    }

    // Save each platform's content to database
    const savedContent = [];
    for (const [platform, content] of Object.entries(generated)) {
      const { data: saved } = await supabase
        .from("content")
        .insert({
          brand_id,
          platform,
          type: platform === "twitter" ? "thread" : "post",
          body: content.body,
          hook: content.hook,
          cta: content.cta,
          hashtags: content.hashtags,
          status: "draft",
          ai_metadata: {
            model: MODEL,
            brief,
            tokens: data.usage?.total_tokens ?? 0,
          },
        })
        .select()
        .single();
      if (saved) savedContent.push(saved);
    }

    return NextResponse.json({
      generated,
      saved_content: savedContent,
      model: MODEL,
      tokens_used: data.usage?.total_tokens ?? 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
