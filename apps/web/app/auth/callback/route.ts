import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  // Use NEXT_PUBLIC_APP_URL as the base to avoid Railway's internal localhost:8080
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? requestUrl.origin;

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);

    // If a specific `next` was requested (e.g. OAuth social connect callbacks), honour it
    if (next) {
      return NextResponse.redirect(`${appUrl}${next}`);
    }

    // Detect new vs returning user: check if they have any brands yet
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      try {
        const admin = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const { data: brands } = await admin
          .from("brands")
          .select("id")
          .limit(1);

        // New user — no brands yet → send to onboarding
        if (!brands || brands.length === 0) {
          return NextResponse.redirect(`${appUrl}/onboarding`);
        }
      } catch {
        // If check fails, fall through to default redirect
      }
    }
  }

  // Default: returning user → brand page
  return NextResponse.redirect(`${appUrl}${next ?? "/brand"}`);
}
