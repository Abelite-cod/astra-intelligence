// GET /api/auth/tiktok/callback?code=xxx&state=xxx
// Exchanges auth code for TikTok access/refresh tokens,
// fetches user info, and stores in social_accounts table.

import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY!;
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const REDIRECT_URI = `${APP_URL}/api/auth/tiktok/callback`;
const SCOPES = "user.info.basic,video.upload,video.list";

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // User denied permission
  if (error) {
    console.error("[tiktok/callback] OAuth error:", error, errorDescription);
    return NextResponse.redirect(`${APP_URL}/publish?error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${APP_URL}/publish?error=missing_code_or_state`);
  }

  // Decode state
  let brandId: string;
  try {
    const parsed = JSON.parse(atob(state));
    brandId = parsed.brandId;
    if (!brandId) throw new Error("No brandId in state");
  } catch {
    return NextResponse.redirect(`${APP_URL}/publish?error=invalid_state`);
  }

  try {
    // ── Step 1: Exchange code for tokens ────────────────────────────────────
    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: CLIENT_KEY,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("[tiktok/callback] Token exchange failed:", err);
      return NextResponse.redirect(`${APP_URL}/publish?error=token_exchange_failed`);
    }

    const tokenData = await tokenRes.json() as {
      access_token: string;
      refresh_token?: string;
      open_id: string;
      scope: string;
      expires_in?: number;
      refresh_expires_in?: number;
      token_type: string;
      error?: string;
      error_description?: string;
    };

    if (tokenData.error) {
      console.error("[tiktok/callback] Token error:", tokenData.error, tokenData.error_description);
      return NextResponse.redirect(`${APP_URL}/publish?error=${encodeURIComponent(tokenData.error)}`);
    }

    // ── Step 2: Fetch TikTok user info ───────────────────────────────────────
    // Sandbox mode: only use basic fields (profile_deep_link may not be available)
    const userRes = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    const userData = await userRes.json() as {
      data?: {
        user?: {
          open_id?: string;
          display_name?: string;
          avatar_url?: string;
        };
      };
      error?: { code: string; message: string; log_id?: string };
    };

    console.log("[tiktok/callback] User info response:", JSON.stringify(userData));

    // In sandbox, open_id may come from token response directly
    const tiktokUser = userData.data?.user;
    const openId = tiktokUser?.open_id ?? tokenData.open_id;
    const displayName = tiktokUser?.display_name ?? `TikTok User (${openId?.slice(0, 8)})`;

    if (!openId) {
      console.error("[tiktok/callback] Failed to get user info:", userData.error);
      return NextResponse.redirect(`${APP_URL}/publish?error=user_info_failed`);
    }

    // ── Step 3: Store in social_accounts ────────────────────────────────────
    const admin = getAdmin();

    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

    const { error: dbError } = await admin.from("social_accounts").upsert(
      {
        brand_id: brandId,
        platform: "tiktok",
        account_id: openId,
        account_name: displayName,
        account_url: null,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token ?? null,
        token_expires_at: expiresAt,
        scopes: SCOPES.split(","),
        status: "active",
      },
      { onConflict: "brand_id,platform,account_id" }
    );

    if (dbError) {
      console.error("[tiktok/callback] DB error:", dbError);
      return NextResponse.redirect(`${APP_URL}/publish?error=db_error`);
    }

    console.log(`[tiktok/callback] Connected TikTok account "${displayName}" for brand ${brandId}`);
    return NextResponse.redirect(`${APP_URL}/publish?connected=tiktok`);

  } catch (err) {
    console.error("[tiktok/callback] Unexpected error:", err);
    return NextResponse.redirect(`${APP_URL}/publish?error=unexpected`);
  }
}
