// POST /api/tiktok/upload
// Sends a video file to TikTok's Content Posting API (Inbox mode).
// The video must already be uploaded to Supabase Storage (content-media bucket).
// TikTok pulls the video from the Supabase CDN URL — no chunked upload needed.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface SocialAccount {
  id: string;
  access_token: string;
  refresh_token?: string;
  token_expires_at?: string;
}

// Get valid access token — refresh if near expiry
async function getValidToken(brandId: string): Promise<string> {
  const admin = getAdmin();
  const { data } = await admin
    .from("social_accounts")
    .select("id, access_token, refresh_token, token_expires_at")
    .eq("brand_id", brandId)
    .eq("platform", "tiktok")
    .eq("status", "active")
    .single();

  const account = data as SocialAccount | null;
  if (!account) throw new Error("No connected TikTok account. Connect TikTok in the Publish page.");

  // Refresh if within 5 minutes of expiry
  if (account.token_expires_at) {
    const expiresAt = new Date(account.token_expires_at).getTime();
    if (Date.now() > expiresAt - 5 * 60 * 1000) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const res = await fetch(`${appUrl}/api/tiktok/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_id: account.id }),
      });
      if (!res.ok) throw new Error("TikTok token expired. Please reconnect your TikTok account.");
      const refreshed = await res.json();
      return refreshed.access_token as string;
    }
  }

  return account.access_token;
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content_id, brand_id, scheduled_post_id } = await request.json();
  if (!content_id || !brand_id) {
    return NextResponse.json({ error: "content_id and brand_id are required" }, { status: 400 });
  }

  const admin = getAdmin();

  try {
    // Load access token
    const accessToken = await getValidToken(brand_id);

    // Load tiktok_scripts for caption + settings
    const { data: script } = await admin
      .from("tiktok_scripts")
      .select("*")
      .eq("content_id", content_id)
      .maybeSingle();

    // Load video from content_media (first selected video)
    const { data: mediaList } = await admin
      .from("content_media")
      .select("*")
      .eq("content_id", content_id)
      .eq("selected", true)
      .order("sort_order")
      .limit(10);

    // Find a video file
    const videoMedia = mediaList?.find((m) =>
      m.public_url?.match(/\.(mp4|webm|mov)(\?|$)/i)
    ) ?? mediaList?.[0];

    if (!videoMedia) {
      return NextResponse.json(
        { error: "No video found for this content. Upload a video file first." },
        { status: 400 }
      );
    }

    // Build TikTok post caption (max 2200 chars)
    const caption = script?.caption ?? "";
    const hashtags = (script?.hashtags ?? []).join(" ");
    const fullCaption = [caption, hashtags].filter(Boolean).join("\n").slice(0, 2200);

    // ── Call TikTok Content Posting API ────────────────────────────────────
    const tiktokPayload: Record<string, unknown> = {
      post_info: {
        title: fullCaption || "Posted via Astra Intelligence",
        privacy_level: script?.privacy_level ?? "SELF_ONLY",
        disable_duet: !script?.allow_duet,
        disable_stitch: !script?.allow_stitch,
        disable_comment: !script?.allow_comment,
      },
      source_info: {
        source: "PULL_FROM_URL",
        video_url: videoMedia.public_url,
        video_cover_timestamp_ms: 1000,
      },
    };

    // Add duet/stitch metadata if applicable
    if (script?.response_type === "duet" && script?.original_video_url) {
      const videoId = script.original_video_url.match(/\/video\/(\d+)/)?.[1];
      if (videoId) (tiktokPayload.post_info as Record<string, unknown>).duet_id = videoId;
    } else if (script?.response_type === "stitch" && script?.original_video_url) {
      const videoId = script.original_video_url.match(/\/video\/(\d+)/)?.[1];
      if (videoId) {
        (tiktokPayload.post_info as Record<string, unknown>).stitch_video_id = videoId;
        if (script.stitch_clip_start_sec != null) {
          (tiktokPayload.post_info as Record<string, unknown>).stitch_start_ms = script.stitch_clip_start_sec * 1000;
        }
        if (script.stitch_clip_end_sec != null) {
          (tiktokPayload.post_info as Record<string, unknown>).stitch_end_ms = script.stitch_clip_end_sec * 1000;
        }
      }
    }

    const uploadRes = await fetch("https://open.tiktokapis.com/v2/post/publish/inbox/video/init/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tiktokPayload),
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      console.error("[tiktok/upload] TikTok API error:", err);
      return NextResponse.json({ error: `TikTok upload failed: ${err}` }, { status: 500 });
    }

    const uploadData = await uploadRes.json() as {
      data?: { publish_id: string };
      error?: { code: string; message: string };
    };

    if (uploadData.error?.code && uploadData.error.code !== "ok") {
      return NextResponse.json({ error: uploadData.error.message }, { status: 500 });
    }

    const publishId = uploadData.data?.publish_id;
    if (!publishId) {
      return NextResponse.json({ error: "No publish_id returned from TikTok" }, { status: 500 });
    }

    // ── Update tracking records ────────────────────────────────────────────

    // Update tiktok_scripts
    if (script) {
      await admin.from("tiktok_scripts")
        .update({ tiktok_upload_id: publishId, upload_status: "uploading", updated_at: new Date().toISOString() })
        .eq("id", script.id);
    }

    // Update or create scheduled_posts row
    if (scheduled_post_id) {
      await admin.from("scheduled_posts")
        .update({ tiktok_publish_id: publishId, status: "processing" })
        .eq("id", scheduled_post_id);
    } else {
      await admin.from("scheduled_posts").insert({
        content_id,
        brand_id,
        platform: "tiktok",
        scheduled_at: new Date().toISOString(),
        status: "processing",
        tiktok_publish_id: publishId,
      });
    }

    console.log(`[tiktok/upload] Video sent to TikTok inbox. publish_id: ${publishId}`);

    return NextResponse.json({
      publish_id: publishId,
      status: "uploading",
      message: "Video sent to TikTok. Check your TikTok app → Drafts to edit and publish.",
    });
  } catch (error) {
    console.error("[tiktok/upload]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
