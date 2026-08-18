// POST /api/stripe/webhook
// Handles Stripe webhook events to sync subscription status to Supabase.
// Set the webhook endpoint in Stripe Dashboard:
//   https://your-app.up.railway.app/api/stripe/webhook
// Events to enable:
//   checkout.session.completed
//   customer.subscription.updated
//   customer.subscription.deleted
//   invoice.payment_failed

import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { stripe, getPlanByPriceId } from "@/lib/stripe";
import Stripe from "stripe";

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn("[stripe/webhook] STRIPE_WEBHOOK_SECRET not set — skipping signature verification");
  }

  let event: Stripe.Event;

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      // No secret configured — parse raw body (dev only)
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err) {
    console.error("[stripe/webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  const admin = getAdmin();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const userId = session.metadata?.user_id;
        const planId = session.metadata?.plan_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!userId) break;

        // Upsert organization with stripe info
        const { data: existingOrg } = await admin
          .from("organizations")
          .select("id")
          .eq("created_by", userId)
          .maybeSingle();

        if (existingOrg) {
          await admin.from("organizations").update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: "active",
            plan: planId ?? "starter",
            updated_at: new Date().toISOString(),
          }).eq("id", existingOrg.id);
        } else {
          await admin.from("organizations").insert({
            created_by: userId,
            name: "My Organization",
            slug: `org-${userId.slice(0, 8)}`,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: "active",
            plan: planId ?? "starter",
          });
        }

        console.log(`[stripe/webhook] Subscription activated for user ${userId}, plan ${planId}`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price.id;
        const plan = priceId ? getPlanByPriceId(priceId) : undefined;

        await admin.from("organizations")
          .update({
            subscription_status: subscription.status,
            plan: plan?.id ?? "starter",
            stripe_subscription_id: subscription.id,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        console.log(`[stripe/webhook] Subscription updated for customer ${customerId}: ${subscription.status}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await admin.from("organizations")
          .update({
            subscription_status: "cancelled",
            plan: "free",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        console.log(`[stripe/webhook] Subscription cancelled for customer ${customerId}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await admin.from("organizations")
          .update({
            subscription_status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        console.log(`[stripe/webhook] Payment failed for customer ${customerId}`);
        break;
      }

      default:
        // Unhandled event — log and ignore
        console.log(`[stripe/webhook] Unhandled event: ${event.type}`);
    }
  } catch (err) {
    console.error("[stripe/webhook] Handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
