import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID!;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const REDIRECT_URI = `${APP_URL}/api/auth/twitter/callback`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${APP_URL}/publish?error=${encodeURIComponent(error)}`);
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(`${APP_URL}/publish?error=missing_params`);
  }

  let brandId: string;
  let codeVerifier: string;
  try {
    const parsed = JSON.parse(atob(stateParam));
    brandId = parsed.brandId;
    codeVerifier = parsed.codeVerifier;
  } catch {
    return NextResponse.redirect(`${APP_URL}/publish?error=invalid_state`);
  }

  // Exchange code for tokens
  const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`)}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${APP_URL}/publish?error=token_exchange_failed`);
  }

  const tokens = await tokenRes.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  // Get Twitter user info
  const userRes = await fetch("https://api.twitter.com/2/users/me", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const userData = await userRes.json() as { data?: { id: string; username: string } };
  const twitterUser = userData.data;

  if (!twitterUser) {
    return NextResponse.redirect(`${APP_URL}/publish?error=user_fetch_failed`);
  }

  // Save to Supabase
  const supabase = createClient();
  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null;

  await supabase.from("social_accounts").upsert({
    brand_id: brandId,
    platform: "twitter",
    account_id: twitterUser.id,
    account_name: `@${twitterUser.username}`,
    account_url: `https://twitter.com/${twitterUser.username}`,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    token_expires_at: expiresAt,
    scopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
    status: "active",
  }, { onConflict: "brand_id,platform,account_id" });

  return NextResponse.redirect(`${APP_URL}/publish?connected=twitter&brand_id=${brandId}`);
}
