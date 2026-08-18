"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useBrands } from "@/hooks/use-brand";
import { useSocialAccounts } from "@/hooks/use-publishing";
import { useSubscription, useStartCheckout, useOpenBillingPortal } from "@/hooks/use-subscription";
import { PLANS } from "@/lib/stripe";
import { cn } from "@/lib/utils";
import {
  User, Key, Users, CreditCard, Save, Loader2,
  Copy, Check, Crown, Zap, Shield,
  Mail, UserPlus, ExternalLink, Bell,
  CheckCircle2, XCircle, AlertCircle, Lock,
  Brain, BarChart3, Calendar, Globe, Settings2,
  ChevronRight, Eye, EyeOff, Sparkles
} from "lucide-react";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "profile" | "integrations" | "team" | "billing" | "notifications";

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: "profile" as const, label: "Profile", icon: User },
  { id: "integrations" as const, label: "Integrations", icon: Key },
  { id: "team" as const, label: "Team", icon: Users },
  { id: "billing" as const, label: "Billing & Plans", icon: CreditCard },
  { id: "notifications" as const, label: "Notifications", icon: Bell },
];

// ── Helper components ─────────────────────────────────────────────────────────

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
      {label && <span>{copied ? "Copied" : label}</span>}
    </button>
  );
}

function StatusBadge({ configured }: { configured: boolean }) {
  return configured ? (
    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
      <CheckCircle2 className="w-3 h-3" /> Connected
    </span>
  ) : (
    <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground bg-muted border border-border px-2.5 py-1 rounded-full">
      <XCircle className="w-3 h-3" /> Not configured
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const { data: sub } = useSubscription();
  const checkout = useStartCheckout();
  const portal = useOpenBillingPortal();
  const currentPlanId = sub?.plan ?? "free";
  const hasStripeCustomer = !!sub?.stripe_customer_id;
  const [authUser, setAuthUser] = useState<{
    id: string;
    email?: string;
    user_metadata?: { full_name?: string; avatar_url?: string };
    created_at?: string;
  } | null>(null);
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [notifications, setNotifications] = useState({
    content_approved: true,
    agent_completed: true,
    post_published: true,
    weekly_summary: false,
  });

  const { data: brands = [] } = useBrands();
  const activeBrandId = brands[0]?.id ?? "";
  const { data: socialAccounts = [] } = useSocialAccounts(activeBrandId);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthUser(user);
      setFullName(user?.user_metadata?.full_name ?? "");
    });
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } });
    setSaving(false);
    error ? toast.error(error.message) : toast.success("Profile updated ✓");
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setChangingPassword(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) { toast.error(error.message); } else { toast.success("Password updated ✓"); setNewPassword(""); }
  }

  const initials = (fullName || authUser?.email || "A")[0].toUpperCase();
  const memberSince = authUser?.created_at
    ? new Date(authUser.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : "—";

  // Integration status
  const integrations = [
    {
      id: "bedrock",
      label: "Amazon Bedrock (Claude)",
      description: "AI text generation for all content",
      env: "AWS_BEARER_TOKEN_BEDROCK",
      configured: true, // always true if deployed
      icon: Brain,
      color: "text-amber-600",
      bg: "bg-amber-500/10",
      docs: "https://docs.aws.amazon.com/bedrock/latest/userguide/getting-started.html",
    },
    {
      id: "supabase",
      label: "Supabase",
      description: "Database, auth, and file storage",
      env: "NEXT_PUBLIC_SUPABASE_URL",
      configured: true,
      icon: Settings2,
      color: "text-emerald-600",
      bg: "bg-emerald-500/10",
      docs: "https://supabase.com/docs",
    },
    {
      id: "twitter",
      label: "Twitter / X OAuth",
      description: "Publish posts to Twitter",
      env: "TWITTER_CLIENT_ID",
      configured: socialAccounts.some((a) => a.platform === "twitter"),
      icon: Globe,
      color: "text-[#1DA1F2]",
      bg: "bg-[#1DA1F2]/10",
      connectHref: activeBrandId ? `/api/auth/twitter?brand_id=${activeBrandId}` : undefined,
    },
    {
      id: "linkedin",
      label: "LinkedIn OAuth",
      description: "Publish posts to LinkedIn",
      env: "LINKEDIN_CLIENT_ID",
      configured: socialAccounts.some((a) => a.platform === "linkedin"),
      icon: Globe,
      color: "text-[#0077B5]",
      bg: "bg-[#0077B5]/10",
      connectHref: activeBrandId ? `/api/auth/linkedin?brand_id=${activeBrandId}` : undefined,
    },
    {
      id: "pollinations",
      label: "Pollinations.ai",
      description: "AI image generation (free, no key required)",
      env: "No key required",
      configured: true,
      icon: Zap,
      color: "text-purple-600",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account, integrations, team, and billing preferences.
        </p>
      </div>

      <div className="flex gap-8">
        {/* ── Sidebar nav ─────────────────────────────────────────────────── */}
        <div className="w-52 shrink-0">
          <nav className="space-y-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition text-left",
                  activeTab === id
                    ? "bg-astra-500/10 text-astra-600 border border-astra-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
                {activeTab === id && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
              </button>
            ))}
          </nav>

          {/* Account summary card */}
          <div className="mt-6 p-4 bg-card border border-border rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-astra-500 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{fullName || "My Account"}</p>
                <p className="text-xs text-muted-foreground truncate">{authUser?.email}</p>
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Plan</span>
                <span className="font-semibold text-foreground">Free Trial</span>
              </div>
              <div className="flex justify-between">
                <span>Brands</span>
                <span className="font-semibold text-foreground">{brands.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Member since</span>
                <span className="font-semibold text-foreground">{memberSince}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Content ──────────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* ════ PROFILE ════ */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">Profile</h2>
                <p className="text-sm text-muted-foreground">Your personal account information.</p>
              </div>

              {/* Avatar + name form */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-astra-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold shrink-0 w-[4.5rem] h-[4.5rem]">
                    {initials}
                  </div>
                  <div>
                    <p className="text-base font-bold text-foreground">{fullName || "No name set"}</p>
                    <p className="text-sm text-muted-foreground">{authUser?.email}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Member since {memberSince}</p>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Full name</label>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-astra-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Email address</label>
                    <input
                      value={authUser?.email ?? ""}
                      disabled
                      className="w-full px-4 py-2.5 rounded-xl border border-input bg-muted text-sm text-muted-foreground cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Email changes require contacting support.</p>
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 bg-astra-500 hover:bg-astra-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition disabled:opacity-50 shadow-lg shadow-astra-500/20"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save profile
                  </button>
                </form>
              </div>

              {/* Password change */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-bold text-foreground">Change password</h3>
                </div>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">New password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        className="w-full px-4 py-2.5 pr-10 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-astra-500/40"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={changingPassword || newPassword.length < 8}
                    className="flex items-center gap-2 border border-border bg-background hover:bg-accent text-sm font-semibold px-5 py-2.5 rounded-xl transition disabled:opacity-50"
                  >
                    {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    Update password
                  </button>
                </form>
              </div>

              {/* Danger zone */}
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-red-600 mb-2">Danger zone</h3>
                <p className="text-xs text-muted-foreground mb-3">Permanently delete your account and all associated data. This cannot be undone.</p>
                <button className="text-sm text-red-600 font-semibold hover:text-red-700 border border-red-500/30 hover:border-red-500/60 px-4 py-2 rounded-xl transition">
                  Delete account
                </button>
              </div>
            </div>
          )}

          {/* ════ INTEGRATIONS ════ */}
          {activeTab === "integrations" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">Integrations</h2>
                <p className="text-sm text-muted-foreground">
                  Services connected to Astra. API keys are stored as environment variables in Railway.
                </p>
              </div>

              <div className="space-y-3">
                {integrations.map((integration) => {
                  const Icon = integration.icon;
                  return (
                    <div key={integration.id} className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl border transition",
                      integration.configured ? "border-border bg-card hover:border-border/80" : "border-border bg-card opacity-70"
                    )}>
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", integration.bg)}>
                        <Icon className={cn("w-5 h-5", integration.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{integration.label}</p>
                        <p className="text-xs text-muted-foreground">{integration.description}</p>
                        <p className="text-xs font-mono text-muted-foreground mt-0.5">{integration.env}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <StatusBadge configured={integration.configured} />
                        {integration.docs && (
                          <a
                            href={integration.docs}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition"
                            title="View docs"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {integration.connectHref && !integration.configured && (
                          <a
                            href={integration.connectHref}
                            className="text-xs font-semibold text-astra-500 hover:text-astra-600 border border-astra-500/30 hover:border-astra-500 px-3 py-1.5 rounded-lg transition"
                          >
                            Connect
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Updating API keys on Railway</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Go to <strong>Railway → your web service → Variables</strong> and add or update environment variables. Railway automatically redeploys when variables change.
                  </p>
                  <a
                    href="https://railway.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 mt-2 transition"
                  >
                    Open Railway dashboard <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ════ TEAM ════ */}
          {activeTab === "team" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">Team</h2>
                <p className="text-sm text-muted-foreground">Manage workspace members and access.</p>
              </div>

              <div className="bg-astra-500/5 border border-astra-500/20 rounded-2xl p-4 flex items-center gap-3">
                <Shield className="w-5 h-5 text-astra-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Free Trial — 1 seat</p>
                  <p className="text-xs text-muted-foreground">Upgrade to Pro for 5 seats, or Business for 20.</p>
                </div>
                <button
                  onClick={() => setActiveTab("billing")}
                  className="flex items-center gap-1 text-xs font-semibold text-astra-500 hover:text-astra-600 border border-astra-500/30 hover:border-astra-500 px-3 py-1.5 rounded-lg transition"
                >
                  Upgrade <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Members (1/1)</p>
                <div className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-astra-500 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{fullName || authUser?.email}</p>
                    <p className="text-xs text-muted-foreground">{authUser?.email}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs bg-astra-500/10 text-astra-600 border border-astra-500/20 px-2.5 py-1 rounded-full font-semibold">
                    <Crown className="w-3 h-3" /> Owner
                  </div>
                </div>
              </div>

              <div className="opacity-60 pointer-events-none">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Invite team member</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@company.com"
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm"
                    />
                  </div>
                  <button disabled className="flex items-center gap-2 bg-astra-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl opacity-50 cursor-not-allowed">
                    <UserPlus className="w-4 h-4" /> Invite
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Team invites are available on Pro and Business plans.</p>
              </div>
            </div>
          )}

          {/* ════ BILLING ════ */}
          {activeTab === "billing" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">Billing & Plans</h2>
                <p className="text-sm text-muted-foreground">Choose the plan that fits your team's needs.</p>
              </div>

              {/* Current plan banner */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                <div>
                  <p className="text-sm font-bold text-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Current plan: Free Trial
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Full access · No credit card required · Unlimited use on Railway</p>
                </div>
                <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-3 py-1.5 rounded-full">Active</span>
              </div>

              {/* Usage stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Brands", used: brands.length, limit: 1, icon: Brain, color: "text-astra-500", bg: "bg-astra-500/10" },
                  { label: "Team seats", used: 1, limit: 1, icon: Users, color: "text-purple-600", bg: "bg-purple-500/10" },
                  { label: "Campaigns", used: 0, limit: 3, icon: Calendar, color: "text-blue-600", bg: "bg-blue-500/10" },
                ].map((s) => (
                  <div key={s.label} className="bg-card border border-border rounded-xl p-3.5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", s.bg)}>
                        <s.icon className={cn("w-3.5 h-3.5", s.color)} />
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground">{s.label}</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">{s.used}<span className="text-sm font-normal text-muted-foreground">/{s.limit}</span></p>
                    <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", s.used >= s.limit ? "bg-red-500" : "bg-astra-500")} style={{ width: `${Math.min(100, (s.used / s.limit) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Manage subscription (if subscribed) */}
              {hasStripeCustomer && (
                <button
                  onClick={() => toast.promise(portal.mutateAsync(), {
                    loading: "Opening billing portal…",
                    success: "Redirecting…",
                    error: (e) => e.message,
                  })}
                  disabled={portal.isPending}
                  className="flex items-center gap-2 text-sm font-semibold border border-border hover:bg-accent px-4 py-2.5 rounded-xl transition disabled:opacity-50"
                >
                  {portal.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                  Manage subscription in Stripe
                </button>
              )}

              {/* Plan cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PLANS.filter((p) => p.id !== "free").map((plan) => {
                  const isCurrent = plan.id === currentPlanId;
                  const isCheckoutPending = checkout.isPending;
                  return (
                    <div
                      key={plan.id}
                      className={cn(
                        "rounded-2xl border p-5 flex flex-col transition",
                        isCurrent
                          ? "border-emerald-500 bg-emerald-500/5"
                          : plan.highlight
                          ? "border-astra-500 bg-gradient-to-br from-astra-500/5 to-purple-500/5 shadow-lg shadow-astra-500/10"
                          : "border-border bg-card"
                      )}
                    >
                      {isCurrent && (
                        <span className="text-xs bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold w-fit mb-3 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Current plan
                        </span>
                      )}
                      {!isCurrent && plan.highlight && (
                        <span className="text-xs bg-gradient-to-r from-astra-500 to-purple-500 text-white px-2.5 py-1 rounded-full font-bold w-fit mb-3">Most Popular</span>
                      )}
                      <h3 className="font-bold text-foreground text-base">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 mb-3">{plan.description}</p>
                      <div className="flex items-baseline gap-0.5 mb-4">
                        <span className="text-3xl font-black text-foreground">{plan.price}</span>
                        <span className="text-muted-foreground text-sm">{plan.period}</span>
                      </div>
                      <ul className="space-y-2 flex-1 mb-5">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      {isCurrent ? (
                        <button disabled className="w-full py-2.5 rounded-xl text-sm font-semibold bg-muted text-muted-foreground cursor-default">
                          Current plan
                        </button>
                      ) : !plan.priceId ? (
                        <button disabled className="w-full py-2.5 rounded-xl text-sm font-semibold border border-border text-muted-foreground cursor-not-allowed opacity-60">
                          Coming soon
                        </button>
                      ) : (
                        <button
                          onClick={() => toast.promise(checkout.mutateAsync(plan.id), {
                            loading: "Opening Stripe checkout…",
                            success: "Redirecting to checkout…",
                            error: (e) => e.message,
                          })}
                          disabled={isCheckoutPending}
                          className={cn(
                            "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50",
                            plan.highlight
                              ? "bg-gradient-to-r from-astra-500 to-purple-500 hover:from-astra-600 hover:to-purple-600 text-white shadow-lg shadow-astra-500/20"
                              : "border border-border hover:bg-accent text-foreground"
                          )}
                        >
                          {isCheckoutPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                          Upgrade to {plan.name}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card border border-border rounded-xl p-3.5">
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                Billing is managed through Stripe. All plans include a 14-day free trial. Cancel anytime.
              </div>
            </div>
          )}

          {/* ════ NOTIFICATIONS ════ */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">Notifications</h2>
                <p className="text-sm text-muted-foreground">Choose what Astra notifies you about.</p>
              </div>

              <div className="bg-card border border-border rounded-2xl divide-y divide-border">
                {[
                  { key: "content_approved" as const, label: "Content approved", description: "When a team member approves content for publishing" },
                  { key: "agent_completed" as const, label: "Agent pipeline complete", description: "When the multi-agent pipeline finishes running" },
                  { key: "post_published" as const, label: "Post published", description: "Confirmation when a post goes live on social media" },
                  { key: "weekly_summary" as const, label: "Weekly summary", description: "A weekly digest of content performance and activity" },
                ].map(({ key, label, description }) => (
                  <div key={key} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                    <button
                      onClick={() => setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))}
                      className={cn(
                        "relative w-10 h-5.5 rounded-full transition-colors shrink-0",
                        notifications[key] ? "bg-astra-500" : "bg-muted"
                      )}
                      style={{ width: "2.5rem", height: "1.375rem" }}
                    >
                      <span className={cn(
                        "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                        notifications[key] ? "translate-x-5" : "translate-x-0.5"
                      )} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 flex gap-3">
                <Bell className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  Email notifications will be sent to <strong>{authUser?.email}</strong>. In-app toasts are always enabled.
                </p>
              </div>

              <button
                onClick={() => toast.success("Notification preferences saved ✓")}
                className="flex items-center gap-2 bg-astra-500 hover:bg-astra-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow-lg shadow-astra-500/20"
              >
                <Save className="w-4 h-4" /> Save preferences
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
