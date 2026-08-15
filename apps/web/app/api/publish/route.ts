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

  // Load content using admin to bypass RLS
  const { data: content } = await admin
    .from("content")
    .select("*")
    .eq("id", content_id)
    .single();

  if (!content) return NextResponse.json({ error: "Content not found" }, { status: 404 });

  const results: Array<{ platform: string; status: string; post_id?: string; error?: string }> = [];

  for (const platform of platforms) {
    // Load social account using admin to bypass RLS
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
        postId = await postToTwitter(account.access_token, content.body);
      } else if (platform === "linkedin") {
        postId = await postToLinkedIn(account.access_token, account.account_id, content.body);
      }

      // Record in scheduled_posts
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

  // Update content status to published if all succeeded
  const allPublished = results.every((r) => r.status === "published");
  if (allPublished) {
    await admin.from("content").update({ status: "published" }).eq("id", content_id);
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

// ── LinkedIn Posts API (v2, current) ─────────────────────────────────────────
// Uses /rest/posts — the ugcPosts endpoint was deprecated in 2023

async function postToLinkedIn(
  accessToken: string,
  authorId: string,
  text: string
): Promise<string> {
  const res = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": "202504",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
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
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LinkedIn API error ${res.status}: ${err}`);
  }

  // Posts API returns the post URN in the header
  const postUrn = res.headers.get("x-restli-id") ?? res.headers.get("location") ?? "unknown";
  return postUrn;
}
