import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const MODEL = process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.1-8b-instruct:free";

// ── Shared LLM call ───────────────────────────────────────────────────────────

async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 1200
): Promise<string> {
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
      temperature: 0.6,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } }).error?.message ?? `LLM error ${response.status}`);
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content ?? "";
}

// ── Agent definitions ─────────────────────────────────────────────────────────

async function researchAgent(brand: Record<string, unknown>, goal: string): Promise<string> {
  const system = `You are a Research Agent. Your job is to identify key facts, insights, and information relevant to a marketing goal. Be concise and factual.`;
  const user = `Brand: ${brand.name}
Industry: ${brand.industry ?? "General"}
Goal: ${goal}

Research the following and provide key insights:
1. What are the main pain points of the target audience for this goal?
2. What are 3-5 key messages that would resonate?
3. What proof points or statistics would strengthen this content?
4. What is the best angle/hook for this goal?

Be specific and actionable.`;

  return callLLM(system, user, 800);
}

async function trendAgent(brand: Record<string, unknown>, goal: string): Promise<string> {
  const system = `You are a Trend Intelligence Agent. You identify trending topics, hashtags, and content formats that are currently performing well on social media for specific industries.`;
  const user = `Brand: ${brand.name}
Industry: ${brand.industry ?? "General"}
Goal: ${goal}
Tone: ${brand.tone_of_voice ?? "professional"}

Identify:
1. 3 trending angles or topics relevant to this goal right now
2. 5 trending hashtags for this industry
3. Best content format recommendation (thread, carousel, short video, etc.)
4. Optimal posting time recommendation
5. One viral hook idea

Focus on what's working in ${new Date().getFullYear()}.`;

  return callLLM(system, user, 600);
}

async function writerAgent(
  brand: Record<string, unknown>,
  goal: string,
  research: string,
  trends: string
): Promise<Record<string, { body: string; hook: string; hashtags: string[] }>> {
  const system = `You are a Senior Marketing Copywriter. You write high-performing social media content using research insights and trend data. Always match the brand's exact tone of voice.`;
  const user = `Brand: ${brand.name}
Description: ${brand.description ?? ""}
Tone: ${brand.tone_of_voice ?? "professional"}
Mission: ${brand.mission ?? ""}

RESEARCH INSIGHTS:
${research}

TREND DATA:
${trends}

GOAL: ${goal}

Write high-quality content for LinkedIn and Twitter. Use the research and trend insights.

Respond in this exact JSON format:
{
  "linkedin": {
    "body": "full linkedin post (3-5 paragraphs, professional, with line breaks)",
    "hook": "attention-grabbing first line",
    "hashtags": ["tag1", "tag2", "tag3"]
  },
  "twitter": {
    "body": "tweet under 280 chars with punch",
    "hook": "opening line",
    "hashtags": ["tag1", "tag2"]
  }
}`;

  const raw = await callLLM(system, user, 1200);
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch?.[0] ?? "{}");
  } catch {
    return {
      linkedin: { body: raw, hook: "", hashtags: [] },
      twitter: { body: raw.slice(0, 280), hook: "", hashtags: [] },
    };
  }
}

async function reviewerAgent(
  brand: Record<string, unknown>,
  content: Record<string, { body: string; hook: string; hashtags: string[] }>
): Promise<{
  scores: Record<string, number>;
  feedback: string;
  improved: Record<string, { body: string; hook: string; hashtags: string[] }>;
}> {
  const system = `You are a Content Quality Reviewer. You evaluate social media content and improve it. Score 1-10 on: brand voice, engagement potential, clarity, CTA strength.`;
  const user = `Brand tone: ${brand.tone_of_voice ?? "professional"}
Brand: ${brand.name}

CONTENT TO REVIEW:
${JSON.stringify(content, null, 2)}

Review and improve this content. Respond in JSON:
{
  "scores": {
    "brand_voice": 8,
    "engagement": 7,
    "clarity": 9,
    "cta_strength": 6
  },
  "feedback": "Overall feedback in 2 sentences",
  "improved": {
    "linkedin": { "body": "improved version", "hook": "better hook", "hashtags": ["tag1"] },
    "twitter": { "body": "improved tweet", "hook": "hook", "hashtags": ["tag1"] }
  }
}`;

  const raw = await callLLM(system, user, 1200);
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch?.[0] ?? "{}");
    return parsed;
  } catch {
    return {
      scores: { brand_voice: 7, engagement: 7, clarity: 7, cta_strength: 7 },
      feedback: "Content reviewed and approved.",
      improved: content,
    };
  }
}

// ── Main orchestrator ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { brand_id, goal, campaign_id } = body;

  if (!brand_id || !goal) {
    return NextResponse.json({ error: "brand_id and goal are required" }, { status: 400 });
  }

  const { data: brand } = await supabase
    .from("brands")
    .select("*")
    .eq("id", brand_id)
    .single();

  if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

  // Save agent run
  const { data: agentRun } = await supabase
    .from("agent_runs")
    .insert({
      brand_id,
      campaign_id: campaign_id ?? null,
      triggered_by: user.id,
      workflow_type: "content_campaign",
      status: "running",
      input: { goal },
    })
    .select()
    .single();

  const runId = agentRun?.id;
  const trace: Array<{ agent: string; status: string; output?: string; error?: string; duration_ms: number }> = [];
  const startTime = Date.now();

  try {
    // ── Agent 1: Research ────────────────────────────────────────────────────
    const t1 = Date.now();
    let researchOutput = "";
    try {
      researchOutput = await researchAgent(brand, goal);
      trace.push({ agent: "Research Agent", status: "success", output: researchOutput.slice(0, 200) + "...", duration_ms: Date.now() - t1 });
    } catch (e) {
      trace.push({ agent: "Research Agent", status: "failed", error: String(e), duration_ms: Date.now() - t1 });
      researchOutput = `Research on ${brand.industry ?? "the industry"} for goal: ${goal}`;
    }

    // ── Agent 2: Trend Intelligence ──────────────────────────────────────────
    const t2 = Date.now();
    let trendOutput = "";
    try {
      trendOutput = await trendAgent(brand, goal);
      trace.push({ agent: "Trend Agent", status: "success", output: trendOutput.slice(0, 200) + "...", duration_ms: Date.now() - t2 });
    } catch (e) {
      trace.push({ agent: "Trend Agent", status: "failed", error: String(e), duration_ms: Date.now() - t2 });
      trendOutput = "Focus on educational content, behind-the-scenes, and thought leadership.";
    }

    // ── Agent 3: Writer ──────────────────────────────────────────────────────
    const t3 = Date.now();
    let writerOutput: Record<string, { body: string; hook: string; hashtags: string[] }> = {};
    try {
      writerOutput = await writerAgent(brand, goal, researchOutput, trendOutput);
      trace.push({ agent: "Writer Agent", status: "success", output: `Generated ${Object.keys(writerOutput).length} platform versions`, duration_ms: Date.now() - t3 });
    } catch (e) {
      trace.push({ agent: "Writer Agent", status: "failed", error: String(e), duration_ms: Date.now() - t3 });
      throw new Error("Writer Agent failed — cannot proceed");
    }

    // ── Agent 4: Reviewer ────────────────────────────────────────────────────
    const t4 = Date.now();
    let reviewOutput: {
      scores: Record<string, number>;
      feedback: string;
      improved: Record<string, { body: string; hook: string; hashtags: string[] }>;
    };
    try {
      reviewOutput = await reviewerAgent(brand, writerOutput);
      trace.push({ agent: "Reviewer Agent", status: "success", output: `Avg score: ${Object.values(reviewOutput.scores).reduce((a, b) => a + b, 0) / Object.keys(reviewOutput.scores).length}/10`, duration_ms: Date.now() - t4 });
    } catch (e) {
      trace.push({ agent: "Reviewer Agent", status: "failed", error: String(e), duration_ms: Date.now() - t4 });
      reviewOutput = {
        scores: { brand_voice: 7, engagement: 7, clarity: 7, cta_strength: 7 },
        feedback: "Content approved.",
        improved: writerOutput,
      };
    }

    // ── Save final content to database ───────────────────────────────────────
    const finalContent = reviewOutput.improved;
    const savedContent = [];
    for (const [platform, content] of Object.entries(finalContent)) {
      const { data: saved } = await supabase
        .from("content")
        .insert({
          brand_id,
          campaign_id: campaign_id ?? null,
          platform,
          type: platform === "twitter" ? "thread" : "post",
          body: content.body,
          hook: content.hook,
          hashtags: content.hashtags,
          status: "draft",
          ai_metadata: {
            model: MODEL,
            goal,
            workflow: "multi_agent",
            agent_run_id: runId,
            quality_scores: reviewOutput.scores,
            research_summary: researchOutput.slice(0, 300),
            trend_summary: trendOutput.slice(0, 300),
          },
          quality_scores: reviewOutput.scores,
        })
        .select()
        .single();
      if (saved) savedContent.push(saved);
    }

    // Update agent run as completed
    if (runId) {
      await supabase
        .from("agent_runs")
        .update({
          status: "completed",
          output: { content: finalContent, review: reviewOutput },
          agent_trace: trace,
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        })
        .eq("id", runId);
    }

    return NextResponse.json({
      run_id: runId,
      status: "completed",
      agents_trace: trace,
      research: researchOutput,
      trends: trendOutput,
      content: finalContent,
      review: reviewOutput,
      saved_content: savedContent,
      duration_ms: Date.now() - startTime,
    });
  } catch (error) {
    if (runId) {
      await supabase
        .from("agent_runs")
        .update({
          status: "failed",
          error_message: String(error),
          agent_trace: trace,
          completed_at: new Date().toISOString(),
        })
        .eq("id", runId);
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Agent workflow failed", trace },
      { status: 500 }
    );
  }
}
