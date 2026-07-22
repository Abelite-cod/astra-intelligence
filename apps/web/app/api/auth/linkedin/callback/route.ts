import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID!;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const REDIRECT_URI = `${APP_URL}/api/auth/linkedin/callback`;

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
  try {
    brandId = JSON.parse(atob(stateParam)).brandId;
  } catch {
    return NextResponse.redirect(`${APP_URL}/publish?error=invalid_state`);
  }

  // Exchange code for access token
  const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      client_id: LINKEDIN_CLIENT_ID,
      client_secret: LINKEDIN_CLIENT_SECRET,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${APP_URL}/publish?error=token_exchange_failed`);
  }

  const tokens = await tokenRes.json() as {
    access_token: string;
    expires_in?: number;
  };

  // Get LinkedIn user profile using OpenID Connect userinfo endpoint
  const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const profile = await profileRes.json() as {
    sub?: string;
    name?: string;
    email?: string;
  };

  if (!profile.sub) {
    return NextResponse.redirect(`${APP_URL}/publish?error=profile_fetch_failed`);
  }

  const supabase = createClient();
  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null;

  await supabase.from("social_accounts").upsert({
    brand_id: brandId,
    platform: "linkedin",
    account_id: profile.sub,
    account_name: profile.name ?? profile.email ?? "LinkedIn Account",
    account_url: `https://linkedin.com`,
    access_token: tokens.access_token,
    token_expires_at: expiresAt,
    scopes: ["openid", "profile", "email", "w_member_social"],
    status: "active",
  }, { onConflict: "brand_id,platform,account_id" });

  return NextResponse.redirect(`${APP_URL}/publish?connected=linkedin&brand_id=${brandId}`);
}
