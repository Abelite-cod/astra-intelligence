// POST /api/stripe/checkout
// Creates a Stripe Checkout Session for a subscription plan.
// Body: { plan_id: "starter" | "pro" | "business" }
// Returns: { url: string } — redirect the user to this URL

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, PLANS } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan_id } = await request.json();
  const plan = PLANS.find((p) => p.id === plan_id);

  if (!plan || !plan.priceId) {
    return NextResponse.json(
      { error: "Invalid plan or Stripe price ID not configured. Add STRIPE_*_PRICE_ID to Railway variables." },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

  try {
    // Look up or create Stripe customer
    const { data: orgData } = await supabase
      .from("organizations")
      .select("stripe_customer_id")
      .eq("created_by", user.id)
      .maybeSingle();

    let customerId: string | undefined = (orgData as { stripe_customer_id?: string } | null)?.stripe_customer_id ?? undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: plan.priceId, quantity: 1 }],
      success_url: `${appUrl}/settings?tab=billing&checkout=success`,
      cancel_url: `${appUrl}/settings?tab=billing&checkout=cancelled`,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { user_id: user.id, plan_id: plan.id },
        trial_period_days: 14,
      },
      metadata: { user_id: user.id, plan_id: plan.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[stripe/checkout]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
