"use client";

import { cn } from "@/lib/utils";
import { useStartCheckout } from "@/hooks/use-subscription";
import { Lock, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import type { PlanId } from "@/lib/stripe";
import { toast } from "sonner";

interface UpgradeGateProps {
  /** Minimum plan required to access this feature */
  requiredPlan: PlanId;
  /** Current user's plan */
  currentPlan: PlanId;
  /** Feature name to show in the gate message */
  feature: string;
  /** Content to render when access is granted */
  children: React.ReactNode;
  /** How to show the gate: "blur" wraps content, "replace" hides it entirely */
  variant?: "blur" | "replace";
  /** Optional className for the gate wrapper */
  className?: string;
}

const PLAN_ORDER: PlanId[] = ["free", "starter", "pro", "business"];

function hasAccess(current: PlanId, required: PlanId): boolean {
  return PLAN_ORDER.indexOf(current) >= PLAN_ORDER.indexOf(required);
}

const PLAN_LABELS: Record<PlanId, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  business: "Business",
};

export function UpgradeGate({
  requiredPlan,
  currentPlan,
  feature,
  children,
  variant = "blur",
  className,
}: UpgradeGateProps) {
  const checkout = useStartCheckout();

  // Has access — render children normally
  if (hasAccess(currentPlan, requiredPlan)) {
    return <>{children}</>;
  }

  function handleUpgrade() {
    toast.promise(
      checkout.mutateAsync(requiredPlan),
      {
        loading: "Opening Stripe checkout…",
        success: "Redirecting to checkout…",
        error: (e) => e.message,
      }
    );
  }

  const gate = (
    <div className={cn(
      "rounded-2xl border border-astra-500/20 bg-gradient-to-br from-astra-500/5 to-purple-500/5 p-6 text-center",
      className
    )}>
      <div className="w-12 h-12 rounded-2xl bg-astra-500/10 flex items-center justify-center mx-auto mb-4">
        <Lock className="w-6 h-6 text-astra-500" />
      </div>
      <h3 className="font-bold text-foreground text-base mb-1">
        {feature} requires {PLAN_LABELS[requiredPlan]}
      </h3>
      <p className="text-sm text-muted-foreground mb-5">
        Upgrade your plan to unlock {feature} and all {PLAN_LABELS[requiredPlan]} features.
      </p>
      <button
        onClick={handleUpgrade}
        disabled={checkout.isPending}
        className="inline-flex items-center gap-2 bg-gradient-to-r from-astra-500 to-purple-500 hover:from-astra-600 hover:to-purple-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow-lg shadow-astra-500/20 disabled:opacity-50"
      >
        {checkout.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        Upgrade to {PLAN_LABELS[requiredPlan]}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );

  if (variant === "replace") {
    return gate;
  }

  // Blur variant: show content underneath but blur it
  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-sm opacity-40 overflow-hidden max-h-48">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        {gate}
      </div>
    </div>
  );
}

// ── Inline upgrade banner (smaller, inline) ───────────────────────────────────

export function UpgradeBanner({
  requiredPlan,
  feature,
}: {
  requiredPlan: PlanId;
  feature: string;
}) {
  const checkout = useStartCheckout();

  function handleUpgrade() {
    toast.promise(
      checkout.mutateAsync(requiredPlan),
      {
        loading: "Opening Stripe checkout…",
        success: "Redirecting to checkout…",
        error: (e) => e.message,
      }
    );
  }

  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl border border-astra-500/20 bg-astra-500/5">
      <Lock className="w-4 h-4 text-astra-500 shrink-0" />
      <p className="text-sm text-muted-foreground flex-1">
        <span className="font-semibold text-foreground">{feature}</span> requires the {PLAN_LABELS[requiredPlan]} plan
      </p>
      <button
        onClick={handleUpgrade}
        disabled={checkout.isPending}
        className="flex items-center gap-1.5 text-xs font-semibold text-astra-500 hover:text-astra-600 border border-astra-500/30 hover:border-astra-500 px-3 py-1.5 rounded-lg transition disabled:opacity-50 shrink-0"
      >
        {checkout.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
        Upgrade
      </button>
    </div>
  );
}
