// GET /api/auth/tiktok?brand_id=xxx
// Redirects user to TikTok OAuth authorization page.
// TikTok uses standard Authorization Code flow (not PKCE like Twitter).

import { NextRequest, NextResponse } from "next/server";

const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const REDIRECT_URI = `${APP_URL}/api/auth/tiktok/callback`;

// Scopes required:
//   user.info.basic   — display name + avatar
//   video.upload      — send video to inbox (MVP, no audit required)
//   video.list        — read published videos for memory/analytics
const SCOPES = "user.info.basic,video.upload,video.list";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const brandId = searchParams.get("brand_id");
  if (!brandId) return NextResponse.json({ error: "brand_id required" }, { status: 400 });

  if (!CLIENT_KEY) {
    return NextResponse.json(
      { error: "TIKTOK_CLIENT_KEY not configured. Add it to Railway environment variables." },
      { status: 500 }
    );
  }

  // Encode brandId in state parameter
  const state = btoa(JSON.stringify({ brandId, ts: Date.now() }));

  const params = new URLSearchParams({
    client_key: CLIENT_KEY,
    scope: SCOPES,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    state,
  });

  const authUrl = `https://www.tiktok.com/v2/auth/authorize/?${params}`;
  return NextResponse.redirect(authUrl);
}
