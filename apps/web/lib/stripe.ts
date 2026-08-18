import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("[stripe] STRIPE_SECRET_KEY not set — billing features will not work");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2026-07-29.dahlia",
  typescript: true,
});

// ── Plan configuration ─────────────────────────────────────────────────────
// Set these price IDs from your Stripe dashboard.
// Add them as Railway environment variables:
//   STRIPE_STARTER_PRICE_ID
//   STRIPE_PRO_PRICE_ID
//   STRIPE_BUSINESS_PRICE_ID

export type PlanId = "free" | "starter" | "pro" | "business";

export interface PlanConfig {
  id: PlanId;
  name: string;
  price: string;
  priceId: string | null;
  period: string;
  description: string;
  maxBrands: number;
  maxSeats: number;
  features: string[];
  highlight: boolean;
}

export const PLANS: PlanConfig[] = [
  {
    id: "free",
    name: "Free Trial",
    price: "$0",
    priceId: null,
    period: "/mo",
    description: "Full access during trial",
    maxBrands: 1,
    maxSeats: 1,
    features: ["1 brand workspace", "All features", "No credit card required"],
    highlight: false,
  },
  {
    id: "starter",
    name: "Starter",
    price: "$39",
    priceId: process.env.STRIPE_STARTER_PRICE_ID ?? null,
    period: "/mo",
    description: "Perfect for solo marketers",
    maxBrands: 1,
    maxSeats: 1,
    features: [
      "1 brand workspace",
      "100K AI tokens/month",
      "LinkedIn + Twitter",
      "Brand Brain (10 docs)",
      "Content generation",
      "Email support",
    ],
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$149",
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? null,
    period: "/mo",
    description: "For growing marketing teams",
    features: [
      "3 brand workspaces",
      "5 team seats",
      "500K AI tokens/month",
      "All platforms",
      "Campaigns & calendar",
      "Analytics dashboard",
      "Priority support",
    ],
    maxBrands: 3,
    maxSeats: 5,
    highlight: true,
  },
  {
    id: "business",
    name: "Business",
    price: "$499",
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID ?? null,
    period: "/mo",
    description: "For agencies and enterprises",
    features: [
      "10 brand workspaces",
      "20 team seats",
      "2M AI tokens/month",
      "Multi-agent pipeline",
      "White-label reports",
      "CRM integration",
      "Dedicated support",
    ],
    maxBrands: 10,
    maxSeats: 20,
    highlight: false,
  },
];

export function getPlanById(id: PlanId): PlanConfig {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

export function getPlanByPriceId(priceId: string): PlanConfig | undefined {
  return PLANS.find((p) => p.priceId === priceId);
}
