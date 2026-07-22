import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content_id, brand_id, platforms } = await request.json();
  if (!content_id || !brand_id || !platforms?.length) {
    return NextResponse.json({ error: "content_id, brand_id, and platforms required" }, { status: 400 });
  }

  // Load content
  const { data: content } = await supabase
    .from("content")
    .select("*")
    .eq("id", content_id)
    .single();

  if (!content) return NextResponse.json({ error: "Content not found" }, { status: 404 });

  const results: Array<{ platform: string; status: string; post_id?: string; error?: string }> = [];

  for (const platform of platforms) {
    // Load social account for this brand + platform
    const { data: account } = await supabase
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
        postId = await postToTwitter(account.access_token, content.body);
      } else if (platform === "linkedin") {
        postId = await postToLinkedIn(account.access_token, account.account_id, content.body);
      }

      // Record in scheduled_posts
      await supabase.from("scheduled_posts").insert({
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
      // Record failure
      await supabase.from("scheduled_posts").insert({
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

  // Update content status to published if all succeeded
  const allPublished = results.every((r) => r.status === "published");
  if (allPublished) {
    await supabase.from("content").update({ status: "published" }).eq("id", content_id);
  }

  return NextResponse.json({ results, content_id });
}

// ── Twitter v2 API ────────────────────────────────────────────────────────────

async function postToTwitter(accessToken: string, text: string): Promise<string> {
  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: text.slice(0, 280) }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? `Twitter API error ${res.status}`);
  }

  const data = await res.json() as { data?: { id: string } };
  return data.data?.id ?? "unknown";
}

// ── LinkedIn API ──────────────────────────────────────────────────────────────

async function postToLinkedIn(
  accessToken: string,
  authorId: string,
  text: string
): Promise<string> {
  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: `urn:li:person:${authorId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LinkedIn API error ${res.status}: ${err}`);
  }

  const postId = res.headers.get("x-restli-id") ?? "unknown";
  return postId;
}
