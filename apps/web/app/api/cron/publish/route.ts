// ── Cron: Process due scheduled posts ────────────────────────────────────────
// Called by Railway cron every minute (or any external cron service).
// Protected by CRON_SECRET header to prevent unauthorized triggers.
//
// Railway cron setup:
//   Service → Settings → Cron → Add: * * * * *
//   Command: curl -X GET https://your-app.up.railway.app/api/cron/publish \
//            -H "Authorization: Bearer $CRON_SECRET"
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  // Authenticate cron request
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const admin = getAdmin();
  const now = new Date().toISOString();

  // Find all posts due for publishing
  const { data: duePosts, error } = await admin
    .from("scheduled_posts")
    .select("*, content(id, brand_id, body, hook, hashtags, platform, status)")
    .eq("status", "scheduled")
    .lte("scheduled_at", now)
    .limit(20); // process max 20 per run to stay within timeout

  if (error) {
    console.error("[cron/publish] DB error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!duePosts || duePosts.length === 0) {
    return NextResponse.json({ processed: 0, message: "No posts due" });
  }

  console.log(`[cron/publish] Processing ${duePosts.length} due posts`);
  const results: Array<{ id: string; platform: string; status: string; error?: string }> = [];

  for (const post of duePosts) {
    const content = post.content as {
      id: string; brand_id: string; body: string;
      hook?: string; hashtags?: string[]; platform: string; status: string;
    } | null;

    if (!content) {
      await admin.from("scheduled_posts")
        .update({ status: "failed", error_message: "Content not found" })
        .eq("id", post.id);
      results.push({ id: post.id, platform: post.platform, status: "failed", error: "Content not found" });
      continue;
    }

    // Get the social account for this brand + platform
    const { data: account } = await admin
      .from("social_accounts")
      .select("*")
      .eq("brand_id", post.brand_id)
      .eq("platform", post.platform)
      .eq("status", "active")
      .single();

    if (!account) {
      await admin.from("scheduled_posts")
        .update({ status: "failed", error_message: `No connected ${post.platform} account` })
        .eq("id", post.id);
      results.push({ id: post.id, platform: post.platform, status: "failed", error: "No connected account" });
      continue;
    }

    // Get selected media
    const { data: selectedMedia } = await admin
      .from("content_media")
      .select("public_url")
      .eq("content_id", content.id)
      .eq("selected", true)
      .order("sort_order");

    const mediaList = (selectedMedia ?? []) as Array<{ public_url: string }>;

    try {
      let platformPostId: string | undefined;

      if (post.platform === "twitter") {
        platformPostId = await postToTwitter(account.access_token, content.body, mediaList);
      } else if (post.platform === "linkedin") {
        platformPostId = await postToLinkedIn(account.access_token, account.account_id, content.body, mediaList);
      }

      await admin.from("scheduled_posts").update({
        status: "published",
        published_at: new Date().toISOString(),
        platform_post_id: platformPostId,
        platform_account_id: account.account_id,
      }).eq("id", post.id);

      // Mark content as published
      await admin.from("content")
        .update({ status: "published" })
        .eq("id", content.id);

      results.push({ id: post.id, platform: post.platform, status: "published" });
      console.log(`[cron/publish] Published post ${post.id} to ${post.platform}`);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      await admin.from("scheduled_posts").update({
        status: "failed",
        error_message: errMsg,
        retry_count: (post.retry_count ?? 0) + 1,
      }).eq("id", post.id);
      results.push({ id: post.id, platform: post.platform, status: "failed", error: errMsg });
      console.error(`[cron/publish] Failed post ${post.id}:`, errMsg);
    }
  }

  // ── Poll TikTok processing posts ──────────────────────────────────────────
  const { data: processingTikTok } = await admin
    .from("scheduled_posts")
    .select("id, brand_id, tiktok_publish_id")
    .eq("platform", "tiktok")
    .eq("status", "processing")
    .not("tiktok_publish_id", "is", null)
    .limit(10);

  const tiktokPolled: Array<{ id: string; status: string }> = [];
  if (processingTikTok?.length) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    for (const sp of processingTikTok) {
      try {
        const statusRes = await fetch(`${appUrl}/api/tiktok/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publish_id: sp.tiktok_publish_id,
            brand_id: sp.brand_id,
            scheduled_post_id: sp.id,
          }),
        });
        const statusData = await statusRes.json();
        tiktokPolled.push({ id: sp.id, status: statusData.status ?? "unknown" });
      } catch (e) {
        console.warn(`[cron] TikTok status poll failed for ${sp.id}:`, e);
      }
    }
  }

  return NextResponse.json({
    processed: results.length,
    published: results.filter((r) => r.status === "published").length,
    failed: results.filter((r) => r.status === "failed").length,
    results,
    tiktok_polled: tiktokPolled.length,
  });
}

// ── Twitter v2 ────────────────────────────────────────────────────────────────

async function postToTwitter(
  accessToken: string,
  text: string,
  media: Array<{ public_url: string }>
): Promise<string> {
  const mediaIds: string[] = [];
  for (const m of media.slice(0, 4)) {
    try {
      const id = await uploadTwitterMedia(accessToken, m.public_url);
      mediaIds.push(id);
    } catch (e) {
      console.warn("[cron/twitter] media upload failed:", e);
    }
  }

  const body: Record<string, unknown> = { text: text.slice(0, 280) };
  if (mediaIds.length > 0) body.media = { media_ids: mediaIds };

  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? `Twitter API error ${res.status}`);
  }

  const data = await res.json() as { data?: { id: string } };
  return data.data?.id ?? "unknown";
}

async function uploadTwitterMedia(accessToken: string, imageUrl: string): Promise<string> {
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status}`);
  const imageBytes = await imgRes.arrayBuffer();
  const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";

  const form = new FormData();
  form.append("media", new Blob([imageBytes], { type: contentType }));
  form.append("media_category", "tweet_image");

  const res = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });

  if (!res.ok) throw new Error(`Twitter media upload error ${res.status}`);
  const data = await res.json() as { media_id_string?: string };
  if (!data.media_id_string) throw new Error("No media_id returned");
  return data.media_id_string;
}

// ── LinkedIn Posts API ────────────────────────────────────────────────────────

async function postToLinkedIn(
  accessToken: string,
  authorId: string,
  text: string,
  media: Array<{ public_url: string }>
): Promise<string> {
  const imageUrns: string[] = [];
  for (const m of media.slice(0, 20)) {
    try {
      const urn = await uploadLinkedInImage(accessToken, authorId, m.public_url);
      imageUrns.push(urn);
    } catch (e) {
      console.warn("[cron/linkedin] image upload failed:", e);
    }
  }

  const postBody: Record<string, unknown> = {
    author: `urn:li:person:${authorId}`,
    commentary: text,
    visibility: "PUBLIC",
    distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };

  if (imageUrns.length === 1) {
    postBody.content = { media: { title: "", id: imageUrns[0] } };
  } else if (imageUrns.length > 1) {
    postBody.content = { multiImage: { images: imageUrns.map((id) => ({ id, altText: "" })) } };
  }

  const res = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": "202607",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(postBody),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LinkedIn API error ${res.status}: ${err}`);
  }

  return res.headers.get("x-restli-id") ?? res.headers.get("location") ?? "unknown";
}

async function uploadLinkedInImage(
  accessToken: string,
  authorId: string,
  imageUrl: string
): Promise<string> {
  const initRes = await fetch("https://api.linkedin.com/rest/images?action=initializeUpload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": "202607",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({ initializeUploadRequest: { owner: `urn:li:person:${authorId}` } }),
  });

  if (!initRes.ok) throw new Error(`LinkedIn init upload error ${initRes.status}`);

  const initData = await initRes.json() as { value?: { uploadUrl?: string; image?: string } };
  const uploadUrl = initData.value?.uploadUrl;
  const imageUrn = initData.value?.image;
  if (!uploadUrl || !imageUrn) throw new Error("LinkedIn did not return uploadUrl or image URN");

  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status}`);
  const imageBytes = await imgRes.arrayBuffer();

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/octet-stream" },
    body: imageBytes,
  });

  if (!uploadRes.ok) throw new Error(`LinkedIn image upload error ${uploadRes.status}`);
  return imageUrn;
}
