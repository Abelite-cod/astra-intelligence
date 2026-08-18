// POST /api/stripe/portal
// Creates a Stripe Customer Portal session for managing subscriptions.
// Returns: { url: string }

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST(_request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

  try {
    // Find Stripe customer ID from organizations table
    const { data: orgData } = await supabase
      .from("organizations")
      .select("stripe_customer_id")
      .eq("created_by", user.id)
      .maybeSingle();

    const customerId = (orgData as { stripe_customer_id?: string } | null)?.stripe_customer_id;

    if (!customerId) {
      return NextResponse.json(
        { error: "No active subscription found. Please subscribe first." },
        { status: 400 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/settings?tab=billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[stripe/portal]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Portal session failed" },
      { status: 500 }
    );
  }
}
