import { useQuery, useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { PlanId } from "@/lib/stripe";
import { PLANS } from "@/lib/stripe";

export interface Subscription {
  plan: PlanId;
  status: "trialing" | "active" | "past_due" | "cancelled" | "free";
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}

function supabase() {
  return createClient();
}

// ── Read current subscription ─────────────────────────────────────────────────

export function useSubscription() {
  return useQuery({
    queryKey: ["subscription"],
    queryFn: async (): Promise<Subscription> => {
      const { data: { user } } = await supabase().auth.getUser();
      if (!user) return { plan: "free", status: "free" };

      const { data } = await supabase()
        .from("organizations")
        .select("plan, subscription_status, stripe_customer_id, stripe_subscription_id")
        .eq("created_by", user.id)
        .maybeSingle();

      if (!data) return { plan: "free", status: "free" };

      return {
        plan: (data.plan as PlanId) ?? "free",
        status: (data.subscription_status as Subscription["status"]) ?? "free",
        stripe_customer_id: data.stripe_customer_id,
        stripe_subscription_id: data.stripe_subscription_id,
      };
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

// ── Start checkout ────────────────────────────────────────────────────────────

export function useStartCheckout() {
  return useMutation({
    mutationFn: async (planId: PlanId) => {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: planId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Checkout failed");
      }
      const { url } = await res.json();
      if (url) window.location.href = url;
    },
  });
}

// ── Open billing portal ───────────────────────────────────────────────────────

export function useOpenBillingPortal() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Portal failed");
      }
      const { url } = await res.json();
      if (url) window.location.href = url;
    },
  });
}

// ── Plan limits helpers ───────────────────────────────────────────────────────

export function usePlanLimits() {
  const { data: sub } = useSubscription();
  const plan = PLANS.find((p) => p.id === (sub?.plan ?? "free")) ?? PLANS[0];
  return {
    maxBrands: plan.maxBrands,
    maxSeats: plan.maxSeats,
    planId: plan.id,
    planName: plan.name,
    isActive: sub?.status === "active" || sub?.status === "trialing",
  };
}
