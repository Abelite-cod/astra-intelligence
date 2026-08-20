// POST /api/tiktok/status
// Polls TikTok's publish status endpoint for a given publish_id.
// Updates scheduled_posts and tiktok_scripts accordingly.

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

  const { publish_id, brand_id, scheduled_post_id } = await request.json();
  if (!publish_id || !brand_id) {
    return NextResponse.json({ error: "publish_id and brand_id are required" }, { status: 400 });
  }

  const admin = getAdmin();

  // Get access token
  const { data: accountData } = await admin
    .from("social_accounts")
    .select("access_token")
    .eq("brand_id", brand_id)
    .eq("platform", "tiktok")
    .single();

  const account = accountData as { access_token: string } | null;
  if (!account) {
    return NextResponse.json({ error: "No TikTok account found" }, { status: 404 });
  }

  try {
    const statusRes = await fetch("https://open.tiktokapis.com/v2/post/publish/status/fetch/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${account.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ publish_id }),
    });

    if (!statusRes.ok) {
      const err = await statusRes.text();
      return NextResponse.json({ error: `TikTok status check failed: ${err}` }, { status: 500 });
    }

    const statusData = await statusRes.json() as {
      data?: {
        status: string;          // PROCESSING_DOWNLOAD | PROCESSING_UPLOAD | SEND_TO_USER_INBOX | PUBLISH_COMPLETE | FAILED
        fail_reason?: string;
        uploaded_bytes?: number;
        total_bytes?: number;
        publicaly_available_post_id?: string[];
      };
      error?: { code: string; message: string };
    };

    const tiktokStatus = statusData.data?.status ?? "UNKNOWN";
    const failReason = statusData.data?.fail_reason;
    const videoIds = statusData.data?.publicaly_available_post_id;
    const tiktokVideoId = videoIds?.[0];

    // Map TikTok status to our internal status
    let internalStatus: string;
    switch (tiktokStatus) {
      case "PROCESSING_DOWNLOAD":
      case "PROCESSING_UPLOAD":
        internalStatus = "processing";
        break;
      case "SEND_TO_USER_INBOX":
        internalStatus = "inbox";
        break;
      case "PUBLISH_COMPLETE":
        internalStatus = "published";
        break;
      case "FAILED":
        internalStatus = "failed";
        break;
      default:
        internalStatus = "processing";
    }

    // Update scheduled_posts
    if (scheduled_post_id) {
      const updateData: Record<string, unknown> = { status: internalStatus };
      if (internalStatus === "published") {
        updateData.published_at = new Date().toISOString();
        if (tiktokVideoId) updateData.tiktok_video_id = tiktokVideoId;
      }
      if (internalStatus === "failed") {
        updateData.error_message = failReason ?? "TikTok processing failed";
      }
      await admin.from("scheduled_posts").update(updateData).eq("id", scheduled_post_id);
    }

    // Update tiktok_scripts
    await admin.from("tiktok_scripts")
      .update({
        upload_status: internalStatus,
        tiktok_video_id: tiktokVideoId ?? null,
        upload_error: failReason ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("tiktok_upload_id", publish_id);

    // If published, update content status
    if (internalStatus === "published") {
      const { data: sp } = await admin
        .from("scheduled_posts")
        .select("content_id")
        .eq("id", scheduled_post_id ?? "")
        .maybeSingle();
      if (sp?.content_id) {
        await admin.from("content").update({ status: "published" }).eq("id", sp.content_id);
      }
    }

    return NextResponse.json({
      status: internalStatus,
      tiktok_status: tiktokStatus,
      tiktok_video_id: tiktokVideoId,
      fail_reason: failReason,
    });
  } catch (error) {
    console.error("[tiktok/status]", error);
    return NextResponse.json({ error: "Status check failed" }, { status: 500 });
  }
}
