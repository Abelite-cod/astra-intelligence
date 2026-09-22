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
      "rounded-sm border border-[#2A2520] bg-[#161310] p-6 text-center",
      className
    )}>
      <div className="w-10 h-10 rounded-sm bg-[#1F1B17] border border-[#2A2520] flex items-center justify-center mx-auto mb-4">
        <Lock className="w-5 h-5 text-[#6E6860]" />
      </div>
      <h3 className="font-semibold text-[#F5F2EE] text-base mb-1">
        {feature} requires {PLAN_LABELS[requiredPlan]}
      </h3>
      <p className="text-sm text-[#6E6860] mb-5">
        Upgrade your plan to unlock {feature} and all {PLAN_LABELS[requiredPlan]} features.
      </p>
      <button
        onClick={handleUpgrade}
        disabled={checkout.isPending}
        className="inline-flex items-center gap-2 bg-[#C8843A] hover:bg-[#DE913A] text-[#0D0B09] text-sm font-medium px-5 py-2.5 rounded-sm transition-colors disabled:opacity-50"
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
      <div className="pointer-events-none select-none blur-sm opacity-30 overflow-hidden max-h-48">
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
    <div className="flex items-center gap-3 p-3.5 rounded-sm border border-[#2A2520] bg-[#161310]">
      <Lock className="w-4 h-4 text-[#524D47] shrink-0" />
      <p className="text-sm text-[#6E6860] flex-1">
        <span className="font-medium text-[#B8B2A9]">{feature}</span> requires the {PLAN_LABELS[requiredPlan]} plan
      </p>
      <button
        onClick={handleUpgrade}
        disabled={checkout.isPending}
        className="flex items-center gap-1.5 text-xs font-medium text-[#C8843A] hover:text-[#DE913A] border border-[#C8843A]/30 hover:border-[#C8843A] px-3 py-1.5 rounded-sm transition-colors disabled:opacity-50 shrink-0"
      >
        {checkout.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
        Upgrade
      </button>
    </div>
  );
}
