import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID!;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const REDIRECT_URI = `${APP_URL}/api/auth/twitter/callback`;

const SCOPES = ["tweet.read", "tweet.write", "users.read", "offline.access"].join(" ");

// ── Step 1: Redirect user to Twitter OAuth ───────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const brandId = searchParams.get("brand_id");
  if (!brandId) return NextResponse.json({ error: "brand_id required" }, { status: 400 });

  // Generate PKCE code verifier + challenge
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = btoa(JSON.stringify({ brandId, codeVerifier }));

  const params = new URLSearchParams({
    response_type: "code",
    client_id: TWITTER_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return NextResponse.redirect(`https://twitter.com/i/oauth2/authorize?${params}`);
}

// ── Step 2: Handle callback ───────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  // This endpoint handles the token exchange
  const { code, state: stateParam } = await request.json();

  let brandId: string;
  let codeVerifier: string;
  try {
    const parsed = JSON.parse(atob(stateParam));
    brandId = parsed.brandId;
    codeVerifier = parsed.codeVerifier;
  } catch {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
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
    const err = await tokenRes.json();
    return NextResponse.json({ error: err.error_description ?? "Token exchange failed" }, { status: 400 });
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
  const userData = await userRes.json() as { data?: { id: string; name: string; username: string } };
  const twitterUser = userData.data;

  if (!twitterUser) {
    return NextResponse.json({ error: "Failed to get Twitter user" }, { status: 400 });
  }

  // Save to Supabase
  const supabase = createClient();
  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null;

  const { error } = await supabase.from("social_accounts").upsert({
    brand_id: brandId,
    platform: "twitter",
    account_id: twitterUser.id,
    account_name: `@${twitterUser.username}`,
    account_url: `https://twitter.com/${twitterUser.username}`,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    token_expires_at: expiresAt,
    scopes: SCOPES.split(" "),
    status: "active",
  }, { onConflict: "brand_id,platform,account_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    connected: true,
    account_name: `@${twitterUser.username}`,
    platform: "twitter",
  });
}

// ── PKCE helpers ─────────────────────────────────────────────────────────────

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}
