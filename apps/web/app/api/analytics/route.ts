import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const brand_id = searchParams.get("brand_id");
  if (!brand_id) return NextResponse.json({ error: "brand_id required" }, { status: 400 });

  const admin = getAdmin();

  // ── Content stats ────────────────────────────────────────────────────────
  const { data: contents } = await admin
    .from("content")
    .select("id, platform, status, created_at, quality_scores, ai_metadata")
    .eq("brand_id", brand_id)
    .order("created_at", { ascending: false });

  const totalContent = contents?.length ?? 0;
  const approvedContent = contents?.filter((c) => c.status === "approved").length ?? 0;
  const publishedContent = contents?.filter((c) => c.status === "published").length ?? 0;
  const draftContent = contents?.filter((c) => c.status === "draft").length ?? 0;

  // Platform breakdown
  const platformBreakdown: Record<string, number> = {};
  contents?.forEach((c) => {
    platformBreakdown[c.platform] = (platformBreakdown[c.platform] ?? 0) + 1;
  });

  // Content over time (last 30 days)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const contentByDay: Record<string, number> = {};
  contents?.forEach((c) => {
    const date = new Date(c.created_at);
    if (date >= thirtyDaysAgo) {
      const day = date.toISOString().split("T")[0];
      contentByDay[day] = (contentByDay[day] ?? 0) + 1;
    }
  });

  // Build 30-day array
  const contentTimeline = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split("T")[0];
    return {
      date: key,
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count: contentByDay[key] ?? 0,
    };
  });

  // ── Campaign stats ───────────────────────────────────────────────────────
  const { data: campaigns } = await admin
    .from("campaigns")
    .select("id, name, status, platforms, created_at")
    .eq("brand_id", brand_id);

  const totalCampaigns = campaigns?.length ?? 0;
  const activeCampaigns = campaigns?.filter((c) => c.status === "active").length ?? 0;

  // ── Agent run stats ──────────────────────────────────────────────────────
  const { data: agentRuns } = await admin
    .from("agent_runs")
    .select("id, status, duration_ms, started_at, output")
    .eq("brand_id", brand_id)
    .order("started_at", { ascending: false })
    .limit(50);

  const totalRuns = agentRuns?.length ?? 0;
  const completedRuns = agentRuns?.filter((r) => r.status === "completed").length ?? 0;
  const avgDuration = agentRuns?.length
    ? Math.round(
        agentRuns
          .filter((r) => r.duration_ms)
          .reduce((s, r) => s + (r.duration_ms ?? 0), 0) /
          Math.max(agentRuns.filter((r) => r.duration_ms).length, 1) / 1000
      )
    : 0;

  // ── Quality scores ───────────────────────────────────────────────────────
  const scoredContent = contents?.filter((c) => c.quality_scores && Object.keys(c.quality_scores).length > 0) ?? [];
  const avgQuality = scoredContent.length
    ? Math.round(
        scoredContent.reduce((sum, c) => {
          const scores = Object.values(c.quality_scores as Record<string, number>);
          return sum + scores.reduce((a, b) => a + b, 0) / scores.length;
        }, 0) / scoredContent.length * 10
      ) / 10
    : 0;

  // ── Knowledge stats ──────────────────────────────────────────────────────
  const { data: docs } = await admin
    .from("knowledge_documents")
    .select("id, status, chunk_count, token_count")
    .eq("brand_id", brand_id);

  const totalDocs = docs?.length ?? 0;
  const indexedDocs = docs?.filter((d) => d.status === "indexed").length ?? 0;
  const totalChunks = docs?.reduce((s, d) => s + (d.chunk_count ?? 0), 0) ?? 0;
  const totalTokens = docs?.reduce((s, d) => s + (d.token_count ?? 0), 0) ?? 0;

  // ── Top content by quality score ─────────────────────────────────────────
  const topContent = scoredContent
    .map((c) => {
      const scores = c.quality_scores as Record<string, number>;
      const avg = Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length;
      return { ...c, avg_score: Math.round(avg * 10) / 10 };
    })
    .sort((a, b) => b.avg_score - a.avg_score)
    .slice(0, 5);

  return NextResponse.json({
    overview: {
      total_content: totalContent,
      approved_content: approvedContent,
      published_content: publishedContent,
      draft_content: draftContent,
      total_campaigns: totalCampaigns,
      active_campaigns: activeCampaigns,
      total_agent_runs: totalRuns,
      completed_agent_runs: completedRuns,
      avg_agent_duration_sec: avgDuration,
      avg_quality_score: avgQuality,
      total_documents: totalDocs,
      indexed_documents: indexedDocs,
      total_chunks: totalChunks,
      total_tokens: totalTokens,
    },
    platform_breakdown: Object.entries(platformBreakdown).map(([platform, count]) => ({
      platform,
      count,
    })),
    content_timeline: contentTimeline,
    top_content: topContent,
  });
}
