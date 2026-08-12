import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Use NEXT_PUBLIC_APP_URL as the base to avoid Railway's internal localhost:8080
  // being exposed via requestUrl.origin (proxy strips the real host)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? requestUrl.origin;
  return NextResponse.redirect(`${appUrl}${next}`);
}
