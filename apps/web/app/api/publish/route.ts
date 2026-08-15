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

  const { content_id, brand_id, platforms } = await request.json();
  if (!content_id || !brand_id || !platforms?.length) {
    return NextResponse.json({ error: "content_id, brand_id, and platforms required" }, { status: 400 });
  }

  const admin = getAdmin();

  // Load content
  const { data: content } = await admin
    .from("content")
    .select("*")
    .eq("id", content_id)
    .single();
  if (!content) return NextResponse.json({ error: "Content not found" }, { status: 404 });

  // Load selected media (sorted by sort_order)
  const { data: selectedMedia } = await admin
    .from("content_media")
    .select("*")
    .eq("content_id", content_id)
    .eq("selected", true)
    .order("sort_order");

  const mediaList = selectedMedia ?? [];

  const results: Array<{ platform: string; status: string; post_id?: string; error?: string }> = [];

  for (const platform of platforms) {
    const { data: account } = await admin
      .from("social_accounts")
      .select("*")
      .eq("brand_id", brand_id)
      .eq("platform", platform)
      .eq("status", "active")
      .single();

    if (!account) {
      results.push({ platform, status: "failed", error: `No connected ${platform} account` });
      continue;
    }

    try {
      let postId: string | undefined;

      if (platform === "twitter") {
        postId = await postToTwitter(account.access_token, content.body, mediaList);
      } else if (platform === "linkedin") {
        postId = await postToLinkedIn(account.access_token, account.account_id, content.body, mediaList);
      }

      await admin.from("scheduled_posts").insert({
        content_id,
        brand_id,
        platform,
        platform_account_id: account.account_id,
        scheduled_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
        platform_post_id: postId,
        status: "published",
      });

      results.push({ platform, status: "published", post_id: postId });
    } catch (e) {
      await admin.from("scheduled_posts").insert({
        content_id,
        brand_id,
        platform,
        platform_account_id: account.account_id,
        scheduled_at: new Date().toISOString(),
        status: "failed",
        error_message: String(e),
      });
      results.push({ platform, status: "failed", error: String(e) });
    }
  }

  const allPublished = results.every((r) => r.status === "published");
  if (allPublished) {
    await admin.from("content").update({ status: "published" }).eq("id", content_id);
  }

  return NextResponse.json({ results, content_id });
}

// ── Twitter v2 API ────────────────────────────────────────────────────────────
// Twitter supports up to 4 images per tweet via media upload

async function postToTwitter(
  accessToken: string,
  text: string,
  media: Array<{ public_url: string }>
): Promise<string> {
  // Upload media first (max 4 images)
  const mediaIds: string[] = [];
  for (const m of media.slice(0, 4)) {
    try {
      const id = await uploadTwitterMedia(accessToken, m.public_url);
      mediaIds.push(id);
    } catch (e) {
      console.warn("[publish/twitter] Media upload failed, continuing text-only:", e);
    }
  }

  const body: Record<string, unknown> = { text: text.slice(0, 280) };
  if (mediaIds.length > 0) {
    body.media = { media_ids: mediaIds };
  }

  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
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
  // Download image bytes
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status}`);
  const imageBytes = await imgRes.arrayBuffer();
  const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";

  // Twitter v2 simple upload (images only, <5MB)
  const form = new FormData();
  form.append("media", new Blob([imageBytes], { type: contentType }));
  form.append("media_category", "tweet_image");

  const res = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Twitter media upload error ${res.status}: ${err}`);
  }

  const data = await res.json() as { media_id_string?: string };
  if (!data.media_id_string) throw new Error("No media_id returned");
  return data.media_id_string;
}

// ── LinkedIn Posts API (v2, current) ─────────────────────────────────────────
// LinkedIn supports multiple images via the Images API + multipleImages media category

async function postToLinkedIn(
  accessToken: string,
  authorId: string,
  text: string,
  media: Array<{ public_url: string }>
): Promise<string> {
  // Upload each image to LinkedIn Images API
  const imageUrns: string[] = [];
  for (const m of media.slice(0, 20)) { // LinkedIn allows up to 20 images
    try {
      const urn = await uploadLinkedInImage(accessToken, authorId, m.public_url);
      imageUrns.push(urn);
    } catch (e) {
      console.warn("[publish/linkedin] Image upload failed, continuing:", e);
    }
  }

  // Build post body
  const postBody: Record<string, unknown> = {
    author: `urn:li:person:${authorId}`,
    commentary: text,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };

  // Attach images if uploaded successfully
  if (imageUrns.length === 1) {
    postBody.content = {
      media: {
        title: "",
        id: imageUrns[0],
      },
    };
  } else if (imageUrns.length > 1) {
    postBody.content = {
      multiImage: {
        images: imageUrns.map((id) => ({ id, altText: "" })),
      },
    };
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

  const postUrn = res.headers.get("x-restli-id") ?? res.headers.get("location") ?? "unknown";
  return postUrn;
}

async function uploadLinkedInImage(
  accessToken: string,
  authorId: string,
  imageUrl: string
): Promise<string> {
  // Step 1: Initialize upload
  const initRes = await fetch("https://api.linkedin.com/rest/images?action=initializeUpload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": "202607",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      initializeUploadRequest: {
        owner: `urn:li:person:${authorId}`,
      },
    }),
  });

  if (!initRes.ok) {
    const err = await initRes.text();
    throw new Error(`LinkedIn init upload error ${initRes.status}: ${err}`);
  }

  const initData = await initRes.json() as {
    value?: { uploadUrl?: string; image?: string };
  };
  const uploadUrl = initData.value?.uploadUrl;
  const imageUrn = initData.value?.image;

  if (!uploadUrl || !imageUrn) throw new Error("LinkedIn did not return uploadUrl or image URN");

  // Step 2: Download image bytes
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status}`);
  const imageBytes = await imgRes.arrayBuffer();

  // Step 3: Upload bytes to LinkedIn's upload URL
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/octet-stream" },
    body: imageBytes,
  });

  if (!uploadRes.ok) {
    throw new Error(`LinkedIn image upload error ${uploadRes.status}`);
  }

  return imageUrn;
}
