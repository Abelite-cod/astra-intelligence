import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });
// Use a dedicated agents model env var; NEVER fall back to GOOGLE_AI_MODEL (may be a low-quota model).
// gemini-2.0-flash-lite has 1,500 req/day on the free tier vs 20 for gemini-3.7-flash.
const MODEL = process.env.AGENTS_AI_MODEL ?? "gemini-2.0-flash-lite";

function isRetryable(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message;
  return (
    msg.includes("503") || msg.includes("UNAVAILABLE") ||
    msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("overloaded")
  );
}

function friendlyAgentError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message;
    if (msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("overloaded")) {
      return "AI is experiencing high demand. Please try again in a moment.";
    }
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
      return "AI rate limit reached. Please wait a few seconds and try again.";
    }
    if (msg.includes("401") || msg.includes("API_KEY") || msg.includes("403")) {
      return "AI service configuration error. Please contact support.";
    }
  }
  return "Agent pipeline failed. Please try again.";
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callAgent(systemInstruction: string, prompt: string): Promise<string> {
  const MAX_RETRIES = 3;
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: { systemInstruction },
      });
      return response.text ?? "";
    } catch (err) {
      lastError = err;
      if (isRetryable(err) && attempt < MAX_RETRIES - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`[agents] attempt ${attempt + 1} failed (retryable), retrying in ${delay}ms…`);
        await sleep(delay);
        continue;
      }
      break;
    }
  }
  throw lastError;
}

async function researchAgent(brand: Record<string, unknown>, goal: string): Promise<string> {
  return callAgent(
    "You are a Research Agent. Identify key facts, insights, and audience pain points for marketing.",
    `Brand: ${brand.name}\nIndustry: ${brand.industry ?? "General"}\nGoal: ${goal}\n\nProvide:\n1. Main audience pain points\n2. 3-5 key messages\n3. Best angle/hook\n4. Proof points to include`
  );
}

async function trendAgent(brand: Record<string, unknown>, goal: string): Promise<string> {
  return callAgent(
    "You are a Trend Intelligence Agent. Identify trending topics, hashtags, and formats.",
    `Brand: ${brand.name}\nIndustry: ${brand.industry ?? "General"}\nGoal: ${goal}\n\nProvide:\n1. 3 trending angles\n2. 5 trending hashtags\n3. Best content format\n4. One viral hook`
  );
}

async function writerAgent(
  brand: Record<string, unknown>,
  goal: string,
  research: string,
  trends: string
): Promise<Record<string, { body: string; hook: string; hashtags: string[] }>> {
  const raw = await callAgent(
    `You are a Senior Marketing Copywriter for ${brand.name}. Tone: ${brand.tone_of_voice ?? "professional"}.`,
    `RESEARCH:\n${research}\n\nTREND DATA:\n${trends}\n\nGOAL: ${goal}\n\nReturn ONLY raw JSON:\n{"linkedin":{"body":"...","hook":"...","hashtags":["tag1"]},"twitter":{"body":"under 280 chars","hook":"...","hashtags":["tag1"]}}`
  );
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    return JSON.parse(match?.[0] ?? "{}");
  } catch {
    return { linkedin: { body: raw, hook: "", hashtags: [] }, twitter: { body: raw.slice(0, 280), hook: "", hashtags: [] } };
  }
}

async function reviewerAgent(
  brand: Record<string, unknown>,
  content: Record<string, { body: string; hook: string; hashtags: string[] }>
): Promise<{ scores: Record<string, number>; feedback: string; improved: typeof content }> {
  const raw = await callAgent(
    `You are a Content Quality Reviewer for ${brand.name}.`,
    `Review and improve:\n${JSON.stringify(content, null, 2)}\n\nReturn ONLY raw JSON:\n{"scores":{"brand_voice":8,"engagement":7,"clarity":9,"cta_strength":7},"feedback":"2 sentence summary","improved":{"linkedin":{"body":"...","hook":"...","hashtags":[]},"twitter":{"body":"...","hook":"...","hashtags":[]}}}`
  );
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    return JSON.parse(match?.[0] ?? "{}");
  } catch {
    return { scores: { brand_voice: 7, engagement: 7, clarity: 7, cta_strength: 7 }, feedback: "Content approved.", improved: content };
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brand_id, goal, campaign_id } = await request.json();
  if (!brand_id || !goal) return NextResponse.json({ error: "brand_id and goal required" }, { status: 400 });

  const { data: brand } = await supabase.from("brands").select("*").eq("id", brand_id).single();
  if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

  const { data: agentRun } = await supabase.from("agent_runs").insert({
    brand_id, campaign_id: campaign_id ?? null, triggered_by: user.id,
    workflow_type: "content_campaign", status: "running", input: { goal },
  }).select().single();

  const runId = agentRun?.id;
  const trace: Array<{ agent: string; status: string; output?: string; error?: string; duration_ms: number }> = [];
  const startTime = Date.now();

  try {
    const t1 = Date.now();
    let researchOutput = "";
    try {
      researchOutput = await researchAgent(brand, goal);
      trace.push({ agent: "Research Agent", status: "success", output: researchOutput.slice(0, 200) + "...", duration_ms: Date.now() - t1 });
    } catch (e) {
      trace.push({ agent: "Research Agent", status: "failed", error: String(e), duration_ms: Date.now() - t1 });
      researchOutput = `Research for ${goal}`;
    }

    const t2 = Date.now();
    let trendOutput = "";
    try {
      trendOutput = await trendAgent(brand, goal);
      trace.push({ agent: "Trend Agent", status: "success", output: trendOutput.slice(0, 200) + "...", duration_ms: Date.now() - t2 });
    } catch (e) {
      trace.push({ agent: "Trend Agent", status: "failed", error: String(e), duration_ms: Date.now() - t2 });
      trendOutput = "Focus on educational content and thought leadership.";
    }

    const t3 = Date.now();
    const writerOutput = await writerAgent(brand, goal, researchOutput, trendOutput);
    trace.push({ agent: "Writer Agent", status: "success", output: `Generated ${Object.keys(writerOutput).length} versions`, duration_ms: Date.now() - t3 });

    const t4 = Date.now();
    let reviewOutput: { scores: Record<string, number>; feedback: string; improved: typeof writerOutput };
    try {
      reviewOutput = await reviewerAgent(brand, writerOutput);
      trace.push({ agent: "Reviewer Agent", status: "success", output: `Avg: ${(Object.values(reviewOutput.scores).reduce((a, b) => a + b, 0) / 4).toFixed(1)}/10`, duration_ms: Date.now() - t4 });
    } catch (e) {
      trace.push({ agent: "Reviewer Agent", status: "failed", error: String(e), duration_ms: Date.now() - t4 });
      reviewOutput = { scores: { brand_voice: 7, engagement: 7, clarity: 7, cta_strength: 7 }, feedback: "Approved.", improved: writerOutput };
    }

    const savedContent = [];
    for (const [platform, content] of Object.entries(reviewOutput.improved)) {
      const { data: saved } = await supabase.from("content").insert({
        brand_id, campaign_id: campaign_id ?? null, platform,
        type: platform === "twitter" ? "thread" : "post",
        body: content.body, hook: content.hook, hashtags: content.hashtags,
        status: "draft",
        ai_metadata: { model: MODEL, goal, workflow: "multi_agent", agent_run_id: runId },
        quality_scores: reviewOutput.scores,
      }).select().single();
      if (saved) savedContent.push(saved);
    }

    if (runId) {
      await supabase.from("agent_runs").update({
        status: "completed", output: { content: reviewOutput.improved, review: reviewOutput },
        agent_trace: trace, completed_at: new Date().toISOString(), duration_ms: Date.now() - startTime,
      }).eq("id", runId);
    }

    return NextResponse.json({
      run_id: runId, status: "completed", agents_trace: trace,
      research: researchOutput, trends: trendOutput,
      content: reviewOutput.improved, review: reviewOutput,
      saved_content: savedContent, duration_ms: Date.now() - startTime,
    });
  } catch (error) {
    console.error("[agents/run] pipeline error:", error);
    if (runId) {
      await supabase.from("agent_runs").update({
        status: "failed", error_message: String(error), agent_trace: trace, completed_at: new Date().toISOString(),
      }).eq("id", runId);
    }
    const isOverload =
      error instanceof Error &&
      (error.message.includes("503") || error.message.includes("UNAVAILABLE") ||
       error.message.includes("429") || error.message.includes("RESOURCE_EXHAUSTED"));
    return NextResponse.json(
      { error: friendlyAgentError(error), trace },
      { status: isOverload ? 503 : 500 }
    );
  }
}
