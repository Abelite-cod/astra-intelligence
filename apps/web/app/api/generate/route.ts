import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
const MODEL_NAME = process.env.GOOGLE_AI_MODEL ?? "gemini-1.5-flash";

async function generate(systemPrompt: string, userPrompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: systemPrompt,
  });
  const result = await model.generateContent(userPrompt);
  return result.response.text();
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
  ].filter(Boolean).join("\n");

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
    "body": "full linkedin post",
    "hook": "first sentence",
    "cta": "call to action",
    "hashtags": ["tag1", "tag2"]
  },
  "twitter": {
    "body": "tweet under 280 chars",
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
    const rawContent = await generate(systemPrompt, userPrompt);

    let generated: Record<string, { body: string; hook: string; cta: string; hashtags: string[] }>;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      generated = JSON.parse(jsonMatch?.[0] ?? "{}");
    } catch {
      generated = {
        linkedin: { body: rawContent, hook: "", cta: "", hashtags: [] },
      };
    }

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
          ai_metadata: { model: MODEL_NAME, brief },
        })
        .select()
        .single();
      if (saved) savedContent.push(saved);
    }

    return NextResponse.json({ generated, saved_content: savedContent, model: MODEL_NAME });
  } catch (error) {
    console.error("Gemini error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
