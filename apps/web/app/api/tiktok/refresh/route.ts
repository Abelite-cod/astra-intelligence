// POST /api/tiktok/refresh
// Refreshes an expired TikTok access token using the stored refresh_token.
// Called automatically before TikTok API requests when token is near expiry.

import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY!;
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET!;

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const { account_id } = await request.json();
  if (!account_id) return NextResponse.json({ error: "account_id required" }, { status: 400 });

  const admin = getAdmin();
  const { data: account } = await admin
    .from("social_accounts")
    .select("*")
    .eq("id", account_id)
    .eq("platform", "tiktok")
    .single();

  if (!account || !account.refresh_token) {
    return NextResponse.json({ error: "No refresh token found. User must reconnect TikTok." }, { status: 400 });
  }

  try {
    const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: CLIENT_KEY,
        client_secret: CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: account.refresh_token,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[tiktok/refresh] Token refresh failed:", err);
      await admin.from("social_accounts").update({ status: "expired" }).eq("id", account_id);
      return NextResponse.json({ error: "Token refresh failed. User must reconnect TikTok." }, { status: 401 });
    }

    const data = await res.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      error?: string;
    };

    if (data.error) {
      await admin.from("social_accounts").update({ status: "expired" }).eq("id", account_id);
      return NextResponse.json({ error: data.error }, { status: 401 });
    }

    const expiresAt = data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000).toISOString()
      : null;

    await admin.from("social_accounts").update({
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? account.refresh_token,
      token_expires_at: expiresAt,
      status: "active",
    }).eq("id", account_id);

    return NextResponse.json({ access_token: data.access_token, expires_at: expiresAt });
  } catch (error) {
    console.error("[tiktok/refresh]", error);
    return NextResponse.json({ error: "Token refresh failed" }, { status: 500 });
  }
}
