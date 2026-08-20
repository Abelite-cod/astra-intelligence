// POST /api/tiktok/analyze
// Analyzes historical TikTok posts and extracts reusable brand patterns.
// Stores patterns in tiktok_memory table.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { claudeGenerate, friendlyBedrockError } from "@/lib/bedrock";

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

  const { brand_id, posts, import_method } = await request.json();
  if (!brand_id || !posts?.length) {
    return NextResponse.json({ error: "brand_id and posts are required" }, { status: 400 });
  }

  const admin = getAdmin();
  const { data: brand } = await admin.from("brands").select("name, industry, tone_of_voice").eq("id", brand_id).single();

  // Format posts for Claude
  const postsText = posts.map((p: Record<string, unknown>, i: number) => {
    const parts = [`Post ${i + 1}:`];
    if (p.caption) parts.push(`Caption: ${p.caption}`);
    if (p.views) parts.push(`Views: ${p.views}`);
    if (p.likes) parts.push(`Likes: ${p.likes}`);
    if (p.comments) parts.push(`Comments: ${p.comments}`);
    if (p.shares) parts.push(`Shares: ${p.shares}`);
    return parts.join("\n");
  }).join("\n\n---\n\n");

  const systemPrompt = `You are a TikTok content strategist analyzing TikTok posts for ${brand?.name ?? "a brand"} (${brand?.industry ?? "technology"} industry, ${brand?.tone_of_voice ?? "professional"} tone).

Extract reusable patterns that will help generate better TikTok content for this brand in the future.
Focus on WHAT WORKS, not just describing the posts.
Return ONLY raw JSON — no markdown, no explanation.`;

  const userPrompt = `Analyze these TikTok posts and extract reusable content patterns:

${postsText}

Return ONLY this raw JSON structure:
{
  "hook_patterns": [
    {
      "label": "Pattern name (e.g., 'Controversial statement hook')",
      "template": "Reusable template: '[X] everyone says is true. They're wrong.'",
      "examples": ["Example 1 from the posts", "Example 2"],
      "best_for_topics": ["topic1", "topic2"],
      "why_it_works": "Brief explanation of psychological mechanism",
      "avg_performance": "high/medium/low based on provided metrics"
    }
  ],
  "format_patterns": [
    {
      "label": "Format name (e.g., '3-point listicle with text overlays')",
      "structure": ["step1", "step2", "step3"],
      "duration_range": "30-45s",
      "visual_style": "description",
      "best_topics": ["topic1"],
      "avg_completion_rate": "estimated based on metrics"
    }
  ],
  "topic_clusters": [
    {
      "label": "Topic cluster name",
      "core_tension": "The underlying tension or debate this topic exploits",
      "proven_angles": ["angle1", "angle2"],
      "avg_views": 0,
      "avg_engagement_rate": 0.05
    }
  ],
  "cta_styles": [
    {
      "label": "CTA style name",
      "examples": ["cta example 1", "cta example 2"],
      "conversion_strength": "high/medium/low",
      "why": "Why this works for this audience"
    }
  ],
  "duration_insight": {
    "label": "Duration insight",
    "optimal_seconds": 30,
    "evidence": "Based on the posts analyzed",
    "exception_topics": ["topic that needs more time"]
  },
  "audience_signal": {
    "label": "Audience profile",
    "who_engages": "Description of who responds to this content",
    "language_level": "casual/semi-technical/technical",
    "pain_points": ["pain1", "pain2"],
    "aspirations": ["aspiration1"],
    "repels": ["what turns them off"]
  }
}`;

  try {
    const raw = await claudeGenerate(systemPrompt, userPrompt, 3000);

    let analysis: Record<string, unknown>;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      analysis = JSON.parse(jsonMatch?.[0] ?? "{}");
    } catch {
      return NextResponse.json({ error: "Failed to parse analysis. Please try again." }, { status: 500 });
    }

    const patternsToInsert: Record<string, unknown>[] = [];

    // Convert analysis into tiktok_memory rows
    const hookPatterns = (analysis.hook_patterns as Record<string, unknown>[]) ?? [];
    const formatPatterns = (analysis.format_patterns as Record<string, unknown>[]) ?? [];
    const topicClusters = (analysis.topic_clusters as Record<string, unknown>[]) ?? [];
    const ctaStyles = (analysis.cta_styles as Record<string, unknown>[]) ?? [];

    hookPatterns.forEach((p) => patternsToInsert.push({
      brand_id, pattern_type: "hook_style", pattern_label: p.label, pattern_data: p,
      confidence: p.avg_performance === "high" ? 0.85 : p.avg_performance === "medium" ? 0.65 : 0.45,
      source: import_method === "manual" ? "manual" : "imported",
      post_count: posts.length,
    }));

    formatPatterns.forEach((p) => patternsToInsert.push({
      brand_id, pattern_type: "format", pattern_label: p.label, pattern_data: p,
      confidence: 0.7, source: import_method === "manual" ? "manual" : "imported", post_count: posts.length,
    }));

    topicClusters.forEach((p) => patternsToInsert.push({
      brand_id, pattern_type: "topic_cluster", pattern_label: p.label as string, pattern_data: p,
      confidence: 0.8, source: import_method === "manual" ? "manual" : "imported", post_count: posts.length,
      avg_views: (p.avg_views as number) > 0 ? p.avg_views as number : null,
      avg_engagement: (p.avg_engagement_rate as number) > 0 ? p.avg_engagement_rate as number : null,
    }));

    ctaStyles.forEach((p) => patternsToInsert.push({
      brand_id, pattern_type: "cta_style", pattern_label: p.label as string, pattern_data: p,
      confidence: p.conversion_strength === "high" ? 0.85 : 0.65,
      source: import_method === "manual" ? "manual" : "imported", post_count: posts.length,
    }));

    if (analysis.duration_insight) {
      const d = analysis.duration_insight as Record<string, unknown>;
      patternsToInsert.push({
        brand_id, pattern_type: "duration", pattern_label: d.label as string, pattern_data: d,
        confidence: 0.8, source: import_method === "manual" ? "manual" : "imported", post_count: posts.length,
      });
    }

    if (analysis.audience_signal) {
      const a = analysis.audience_signal as Record<string, unknown>;
      patternsToInsert.push({
        brand_id, pattern_type: "audience_signal", pattern_label: a.label as string, pattern_data: a,
        confidence: 0.75, source: import_method === "manual" ? "manual" : "imported", post_count: posts.length,
      });
    }

    // Insert patterns
    const { data: inserted, error: insertError } = await admin
      .from("tiktok_memory")
      .insert(patternsToInsert)
      .select();

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

    return NextResponse.json({
      patterns_created: inserted?.length ?? 0,
      patterns: inserted,
      analysis_summary: {
        hook_patterns: hookPatterns.length,
        format_patterns: formatPatterns.length,
        topic_clusters: topicClusters.length,
        cta_styles: ctaStyles.length,
      },
    });
  } catch (error) {
    console.error("[tiktok/analyze]", error);
    return NextResponse.json({ error: friendlyBedrockError(error) }, { status: 500 });
  }
}
