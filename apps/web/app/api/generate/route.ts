import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import https from "node:https";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const MODEL = process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.1-8b-instruct:free";

// Custom HTTPS agent to handle TLS negotiation issues with some networks
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  secureOptions: 0,
  minVersion: "TLSv1.2",
});

async function openRouterFetch(body: object) {
  return fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://astra-intelligence.com",
      "X-Title": "Astra Intelligence",
    },
    body: JSON.stringify(body),
    // @ts-expect-error Node.js fetch agent
    agent: httpsAgent,
  });
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

  const { data: brand } = await supabase
    .from("brands")
    .select("*")
    .eq("id", brand_id)
    .single();

  if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

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
- Use the brand's hashtags where appropriate`;

  const userPrompt = `Create marketing content for the following brief:

"${brief}"

Generate content for these platforms: ${platforms.join(", ")}

Respond in this exact JSON format (no markdown, no backticks, just raw JSON):
{
  "linkedin": {
    "body": "full post text",
    "hook": "first sentence",
    "cta": "call to action",
    "hashtags": ["tag1", "tag2"]
  },
  "twitter": {
    "body": "tweet text under 280 chars",
    "hook": "opening line",
    "cta": "cta",
    "hashtags": ["tag1"]
  },
  "instagram": {
    "body": "caption text",
    "hook": "opening hook",
    "cta": "cta",
    "hashtags": ["tag1", "tag2", "tag3"]
  }
}

Only include the platforms requested: ${platforms.join(", ")}.`;

  try {
    const response = await openRouterFetch({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: (err as { error?: { message?: string } }).error?.message ?? `OpenRouter error: ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { total_tokens?: number };
    };
    const rawContent = data.choices?.[0]?.message?.content ?? "";

    let generated: Record<string, { body: string; hook: string; cta: string; hashtags: string[] }>;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      generated = JSON.parse(jsonMatch?.[0] ?? "{}");
    } catch {
      generated = {
        linkedin: { body: rawContent, hook: "", cta: "", hashtags: [] },
      };
    }

    // Save to database
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
    console.error("OpenRouter error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
