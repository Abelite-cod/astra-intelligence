// POST /api/tiktok/analytics
// Fetches TikTok video performance metrics and updates post_analytics + tiktok_memory confidence.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

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

  const { brand_id } = await request.json();
  if (!brand_id) return NextResponse.json({ error: "brand_id required" }, { status: 400 });

  const admin = getAdmin();

  // Get TikTok access token
  const { data: accountData } = await admin
    .from("social_accounts")
    .select("access_token")
    .eq("brand_id", brand_id)
    .eq("platform", "tiktok")
    .eq("status", "active")
    .maybeSingle();

  const account = accountData as { access_token: string } | null;
  if (!account) return NextResponse.json({ error: "No TikTok account connected" }, { status: 400 });

  // Get published TikTok posts with tiktok_video_id
  const { data: posts } = await admin
    .from("scheduled_posts")
    .select("id, content_id, tiktok_video_id, published_at")
    .eq("brand_id", brand_id)
    .eq("platform", "tiktok")
    .eq("status", "published")
    .not("tiktok_video_id", "is", null)
    .limit(20);

  if (!posts?.length) {
    return NextResponse.json({ synced: 0, message: "No published TikTok videos to sync" });
  }

  const videoIds = posts.map((p) => p.tiktok_video_id).filter(Boolean) as string[];
  const batches: string[][] = [];
  for (let i = 0; i < videoIds.length; i += 20) {
    batches.push(videoIds.slice(i, i + 20));
  }

  let totalSynced = 0;
  const allVideos: Record<string, unknown>[] = [];

  for (const batch of batches) {
    try {
      const res = await fetch("https://open.tiktokapis.com/v2/video/query/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${account.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filters: { video_ids: batch },
          fields: ["id", "title", "create_time", "cover_image_url", "share_url",
                   "duration", "view_count", "like_count", "comment_count", "share_count"],
        }),
      });

      if (!res.ok) continue;
      const data = await res.json() as { data?: { videos?: Record<string, unknown>[] } };
      if (data.data?.videos) allVideos.push(...data.data.videos);
    } catch (e) {
      console.warn("[tiktok/analytics] batch fetch error:", e);
    }
  }

  // Calculate brand average for confidence updates
  const totalViews = allVideos.reduce((s, v) => s + ((v.view_count as number) ?? 0), 0);
  const brandAvgViews = allVideos.length > 0 ? totalViews / allVideos.length : 0;

  for (const video of allVideos) {
    const post = posts.find((p) => p.tiktok_video_id === video.id);
    if (!post) continue;

    const views = (video.view_count as number) ?? 0;
    const likes = (video.like_count as number) ?? 0;
    const comments = (video.comment_count as number) ?? 0;
    const shares = (video.share_count as number) ?? 0;
    const engagementRate = views > 0 ? (likes + comments + shares) / views : 0;
    const viralityScore = views > 0 ? (shares * 3 + comments * 2 + likes) / views : 0;

    // Upsert post_analytics
    await admin.from("post_analytics").upsert({
      scheduled_post_id: post.id,
      brand_id,
      platform: "tiktok",
      fetched_at: new Date().toISOString(),
      impressions: views,
      likes,
      comments,
      shares,
      engagement_rate: engagementRate,
      raw_data: video,
    }, { onConflict: "scheduled_post_id" });

    // Update tiktok_memory confidence based on performance
    const { data: script } = await admin
      .from("tiktok_scripts")
      .select("pattern_match")
      .eq("content_id", post.content_id)
      .maybeSingle();

    if (script?.pattern_match?.length && brandAvgViews > 0) {
      const confidenceDelta = views > brandAvgViews * 1.5
        ? 0.1
        : views < brandAvgViews * 0.5
        ? -0.1
        : 0;

      if (confidenceDelta !== 0) {
        for (const patternId of script.pattern_match) {
          const { data: pattern } = await admin
            .from("tiktok_memory")
            .select("confidence, avg_views")
            .eq("id", patternId)
            .maybeSingle();

          if (pattern) {
            const newConfidence = Math.max(0.1, Math.min(1.0, pattern.confidence + confidenceDelta));
            const newAvgViews = pattern.avg_views
              ? Math.round((pattern.avg_views + views) / 2)
              : views;

            await admin.from("tiktok_memory").update({
              confidence: newConfidence,
              avg_views: newAvgViews,
              last_feedback_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }).eq("id", patternId);
          }
        }
      }
    }

    totalSynced++;
  }

  return NextResponse.json({ synced: totalSynced, videos_found: allVideos.length });
}
