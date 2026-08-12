"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  User, Key, Users, CreditCard, Save, Loader2,
  Eye, EyeOff, Copy, Check, Crown, Zap, Shield,
  Mail, UserPlus, Trash2, ExternalLink
} from "lucide-react";
import { toast } from "sonner";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "api-keys", label: "API Keys", icon: Key },
  { id: "team", label: "Team", icon: Users },
  { id: "billing", label: "Billing", icon: CreditCard },
] as const;

type Tab = typeof TABS[number]["id"];

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "$39",
    period: "/mo",
    features: ["1 brand", "100K AI tokens/mo", "3 platforms", "Brand Brain"],
    current: true,
    color: "border-border",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$149",
    period: "/mo",
    features: ["3 brands", "5 seats", "500K AI tokens/mo", "All platforms", "Campaigns", "Analytics"],
    current: false,
    color: "border-astra-500",
    highlight: true,
  },
  {
    id: "business",
    name: "Business",
    price: "$499",
    period: "/mo",
    features: ["10 brands", "20 seats", "2M AI tokens/mo", "Multi-agent", "CRM integration", "Priority support"],
    current: false,
    color: "border-border",
  },
];

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="text-muted-foreground hover:text-foreground transition"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: { full_name?: string; avatar_url?: string } } | null>(null);
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [inviteEmail, setInviteEmail] = useState("");

  // API keys config (from env — redacted for display)
  const apiKeys = [
    { id: "google", label: "Google AI Studio", key: process.env.NEXT_PUBLIC_APP_URL ? "configured" : "", configured: true, env: "GOOGLE_AI_API_KEY" },
    { id: "supabase", label: "Supabase", key: "configured", configured: true, env: "NEXT_PUBLIC_SUPABASE_URL" },
    { id: "twitter", label: "Twitter / X OAuth", key: "", configured: false, env: "TWITTER_CLIENT_ID" },
    { id: "linkedin", label: "LinkedIn OAuth", key: "", configured: false, env: "LINKEDIN_CLIENT_ID" },
  ];

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setFullName(user?.user_metadata?.full_name ?? "");
    });
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName },
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Profile updated");
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account, API keys, team, and billing.</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-48 shrink-0">
          <nav className="space-y-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition text-left",
                  activeTab === id
                    ? "bg-astra-500/10 text-astra-600"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* ── Profile ─────────────────────────────────────────────────── */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">Profile</h2>
                <p className="text-sm text-muted-foreground">Your personal account information.</p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-astra-500 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                    {(fullName || user?.email || "A")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{fullName || "No name set"}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Full name</label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                  <input
                    value={user?.email ?? ""}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-muted text-sm text-muted-foreground cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Email cannot be changed here. Contact support.</p>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-astra-500 hover:bg-astra-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save changes
                </button>
              </form>

              <div className="border-t border-border pt-6">
                <h3 className="text-sm font-semibold text-destructive mb-3">Danger zone</h3>
                <button className="text-sm text-destructive hover:underline">
                  Delete account
                </button>
              </div>
            </div>
          )}

          {/* ── API Keys ─────────────────────────────────────────────────── */}
          {activeTab === "api-keys" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">API Keys</h2>
                <p className="text-sm text-muted-foreground">
                  Keys are stored in your local <code className="text-xs bg-muted px-1.5 py-0.5 rounded">.env.local</code> file. Never commit them to git.
                </p>
              </div>

              <div className="space-y-3">
                {apiKeys.map((k) => (
                  <div key={k.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      k.configured ? "bg-green-500/10" : "bg-muted"
                    )}>
                      <Key className={cn("w-4 h-4", k.configured ? "text-green-600" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{k.label}</p>
                      <p className="text-xs text-muted-foreground font-mono">{k.env}</p>
                    </div>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                      k.configured ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"
                    )}>
                      {k.configured ? "Configured" : "Not set"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <p className="font-semibold mb-1">To update API keys:</p>
                <p>Edit <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">astra-intelligence/apps/web/.env.local</code> in VS Code, then restart the server.</p>
              </div>
            </div>
          )}

          {/* ── Team ─────────────────────────────────────────────────────── */}
          {activeTab === "team" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">Team</h2>
                <p className="text-sm text-muted-foreground">Manage team members and their access.</p>
              </div>

              {/* Current plan note */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-astra-500/5 border border-astra-500/20">
                <Shield className="w-5 h-5 text-astra-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Starter plan — 1 seat</p>
                  <p className="text-xs text-muted-foreground">Upgrade to Pro for 5 seats, or Business for 20 seats.</p>
                </div>
                <button
                  onClick={() => setActiveTab("billing")}
                  className="text-xs text-astra-500 hover:underline shrink-0"
                >
                  Upgrade
                </button>
              </div>

              {/* Current member */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">MEMBERS (1/1)</p>
                <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card">
                  <div className="w-8 h-8 rounded-full bg-astra-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {(fullName || user?.email || "A")[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{fullName || user?.email}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs bg-astra-500/10 text-astra-600 px-2 py-0.5 rounded-full font-medium">
                    <Crown className="w-3 h-3" /> Owner
                  </div>
                </div>
              </div>

              {/* Invite form (disabled on free plan) */}
              <div className="opacity-60">
                <p className="text-xs font-semibold text-muted-foreground mb-2">INVITE TEAM MEMBER</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@company.com"
                      disabled
                      className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none disabled:cursor-not-allowed"
                    />
                  </div>
                  <button
                    disabled
                    className="flex items-center gap-2 bg-astra-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg opacity-50 cursor-not-allowed"
                  >
                    <UserPlus className="w-4 h-4" /> Invite
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Available on Pro and Business plans.</p>
              </div>
            </div>
          )}

          {/* ── Billing ───────────────────────────────────────────────────── */}
          {activeTab === "billing" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">Billing</h2>
                <p className="text-sm text-muted-foreground">Manage your subscription and usage.</p>
              </div>

              {/* Current plan */}
              <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Current plan: Free Trial</p>
                    <p className="text-xs text-muted-foreground mt-0.5">No credit card required · Unlimited local use</p>
                  </div>
                  <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded-full font-medium">Active</span>
                </div>
              </div>

              {/* Plans */}
              <div className="grid grid-cols-3 gap-4">
                {PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    className={cn(
                      "rounded-xl border p-4 flex flex-col",
                      plan.highlight ? "border-astra-500 bg-astra-500/5" : "border-border bg-card"
                    )}
                  >
                    {plan.highlight && (
                      <span className="text-xs bg-astra-500 text-white px-2 py-0.5 rounded-full font-medium w-fit mb-2">Popular</span>
                    )}
                    <h3 className="font-bold text-foreground">{plan.name}</h3>
                    <div className="flex items-baseline gap-0.5 mt-1 mb-3">
                      <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-muted-foreground text-sm">{plan.period}</span>
                    </div>
                    <ul className="space-y-1.5 flex-1 mb-4">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Zap className="w-3 h-3 text-astra-500 shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      className={cn(
                        "w-full py-2 rounded-lg text-sm font-medium transition",
                        plan.current
                          ? "bg-muted text-muted-foreground cursor-default"
                          : plan.highlight
                          ? "bg-astra-500 hover:bg-astra-600 text-white"
                          : "border border-border hover:bg-accent text-foreground"
                      )}
                      disabled={plan.current}
                    >
                      {plan.current ? "Current plan" : "Upgrade"}
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Billing is powered by Stripe. All plans include a 14-day free trial.</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
