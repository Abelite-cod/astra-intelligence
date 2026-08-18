"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useBrands } from "@/hooks/use-brand";
import { useContentList } from "@/hooks/use-content";
import { useCampaigns } from "@/hooks/use-campaign";
import { useSocialAccounts, useScheduledPosts } from "@/hooks/use-publishing";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import {
  Brain, FileText, Zap, ArrowRight, Sparkles,
  Calendar, CheckCircle2, Clock, Twitter, Linkedin,
  TrendingUp, BarChart3, Bot, Send, Users, Plus,
  ChevronRight, Rocket, Star, Activity, AlertCircle,
  Play, Target
} from "lucide-react";

// ── Live stats hook ───────────────────────────────────────────────────────────

function useUser() {
  return useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });
}

function useAgentRuns(brandId: string) {
  return useQuery({
    queryKey: ["agent-runs-recent", brandId],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("agent_runs")
        .select("id, status, workflow_type, started_at, duration_ms, input")
        .eq("brand_id", brandId)
        .order("started_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
    enabled: !!brandId,
  });
}

// ── Greeting ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, color, bg, href
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  href?: string;
}) {
  const content = (
    <div className={cn(
      "bg-card border border-border rounded-2xl p-5 transition",
      href && "hover:border-astra-500/40 hover:shadow-sm cursor-pointer"
    )}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", bg)}>
          <Icon className={cn("w-4.5 h-4.5 w-[1.125rem] h-[1.125rem]", color)} />
        </div>
      </div>
      <p className="text-3xl font-black text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      {href && (
        <div className="flex items-center gap-1 text-xs text-astra-500 font-semibold mt-3">
          View <ChevronRight className="w-3.5 h-3.5" />
        </div>
      )}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

// ── Quick action ──────────────────────────────────────────────────────────────

function QuickAction({
  href, icon: Icon, title, desc, color, bg, badge
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  desc: string;
  color: string;
  bg: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-card border border-border rounded-2xl p-5 hover:border-astra-500/50 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", bg)}>
          <Icon className={cn("w-5 h-5", color)} />
        </div>
        {badge && (
          <span className="text-xs font-bold bg-astra-500/10 text-astra-600 px-2 py-0.5 rounded-full">{badge}</span>
        )}
      </div>
      <h3 className="font-bold text-foreground group-hover:text-astra-600 transition text-sm">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
      <div className="flex items-center gap-1 text-xs text-astra-500 font-semibold mt-3 opacity-0 group-hover:opacity-100 transition">
        Go <ArrowRight className="w-3.5 h-3.5" />
      </div>
    </Link>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: user } = useUser();
  const { data: brands = [], isLoading: brandsLoading } = useBrands();
  const activeBrandId = brands[0]?.id ?? "";

  const { data: contentList = [] } = useContentList(activeBrandId);
  const { data: campaigns = [] } = useCampaigns(activeBrandId);
  const { data: socialAccounts = [] } = useSocialAccounts(activeBrandId);
  const { data: scheduledPosts = [] } = useScheduledPosts(activeBrandId);
  const { data: agentRuns = [] } = useAgentRuns(activeBrandId);

  const displayName = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "there";
  const greeting = getGreeting();

  // Derived stats
  const stats = useMemo(() => ({
    totalContent: contentList.length,
    approvedContent: contentList.filter((c) => c.status === "approved").length,
    publishedContent: contentList.filter((c) => c.status === "published").length,
    draftContent: contentList.filter((c) => c.status === "draft").length,
    activeCampaigns: campaigns.filter((c) => c.status === "active").length,
    scheduledPosts: scheduledPosts.filter((p) => p.status === "scheduled").length,
    connectedAccounts: socialAccounts.length,
    recentAgentRuns: agentRuns.filter((r) => r.status === "completed").length,
  }), [contentList, campaigns, scheduledPosts, socialAccounts, agentRuns]);

  // Recent activity (merged content + agent runs)
  const recentActivity = useMemo(() => {
    const items: Array<{ type: string; label: string; sub: string; time: string; status?: string }> = [];

    contentList.slice(0, 5).forEach((c) => {
      items.push({
        type: "content",
        label: `${c.platform} post — ${c.status}`,
        sub: (c.body ?? "").slice(0, 60) + "…",
        time: c.created_at,
        status: c.status,
      });
    });

    agentRuns.slice(0, 3).forEach((r) => {
      items.push({
        type: "agent",
        label: `Agent pipeline — ${r.status}`,
        sub: (r.input as Record<string, string>)?.goal?.slice(0, 60) ?? "Multi-agent run",
        time: r.started_at,
        status: r.status,
      });
    });

    scheduledPosts
      .filter((p) => p.status === "published")
      .slice(0, 3)
      .forEach((p) => {
        items.push({
          type: "published",
          label: `Published to ${p.platform}`,
          sub: `Post went live on ${p.platform}`,
          time: p.published_at ?? p.scheduled_at,
          status: "published",
        });
      });

    return items
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 8);
  }, [contentList, agentRuns, scheduledPosts]);

  // Upcoming scheduled
  const upcoming = useMemo(() =>
    scheduledPosts
      .filter((p) => p.status === "scheduled")
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
      .slice(0, 4),
    [scheduledPosts]
  );

  if (brandsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-6 h-6 border-2 border-astra-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">

      {/* ── Hero greeting ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground">
            {greeting}, {displayName} 👋
          </h1>
          <p className="text-muted-foreground mt-1.5">
            {brands.length === 0
              ? "Let's get your AI marketing system set up."
              : `${brands[0]?.name ?? "Your brand"} · AI is ready to work.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/content"
            className="flex items-center gap-2 bg-gradient-to-r from-astra-500 to-purple-500 hover:from-astra-600 hover:to-purple-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-lg shadow-astra-500/20"
          >
            <Sparkles className="w-4 h-4" /> Generate content
          </Link>
        </div>
      </div>

      {/* ── Setup banner (shown when no brands) ──────────────────────────── */}
      {brands.length === 0 && (
        <div className="bg-gradient-to-br from-astra-500 via-astra-600 to-purple-600 rounded-3xl p-7 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
          <div className="relative">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                    <Brain className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-sm text-white/80">First step</span>
                </div>
                <h2 className="text-2xl font-black mb-2">Activate your Brand Brain</h2>
                <p className="text-white/80 max-w-lg leading-relaxed">
                  Train Claude on your company, products, and audience. Once set up, every piece of content will be perfectly on-brand — automatically.
                </p>
                <div className="flex items-center gap-5 mt-4 text-sm text-white/70">
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-white/60" /> On-brand content</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-white/60" /> Knows your audience</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-white/60" /> Never loses context</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Link
                  href="/onboarding"
                  className="flex items-center gap-2 bg-white text-astra-600 font-bold px-5 py-3 rounded-xl text-sm hover:bg-white/90 transition shadow-lg"
                >
                  <Rocket className="w-4 h-4" /> Start setup <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/brand"
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition text-center justify-center"
                >
                  Manual setup
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total content"
          value={stats.totalContent}
          sub={`${stats.approvedContent} approved · ${stats.publishedContent} published`}
          icon={FileText}
          color="text-blue-600"
          bg="bg-blue-500/10"
          href="/content"
        />
        <StatCard
          label="Campaigns"
          value={campaigns.length}
          sub={`${stats.activeCampaigns} active`}
          icon={Target}
          color="text-astra-600"
          bg="bg-astra-500/10"
          href="/campaigns"
        />
        <StatCard
          label="Scheduled posts"
          value={stats.scheduledPosts}
          sub="upcoming"
          icon={Clock}
          color="text-amber-600"
          bg="bg-amber-500/10"
          href="/publish"
        />
        <StatCard
          label="Agent runs"
          value={agentRuns.length}
          sub={`${stats.recentAgentRuns} completed`}
          icon={Bot}
          color="text-purple-600"
          bg="bg-purple-500/10"
          href="/agents"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left col: Quick actions + Platform status ──────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick actions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-foreground">Quick actions</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <QuickAction
                href="/content"
                icon={Sparkles}
                title="Generate content"
                desc="AI writes platform-optimised posts in seconds"
                color="text-astra-500"
                bg="bg-astra-500/10"
                badge={stats.draftContent > 0 ? `${stats.draftContent} drafts` : undefined}
              />
              <QuickAction
                href="/agents"
                icon={Bot}
                title="Run AI Agents"
                desc="4 agents build a complete campaign strategy"
                color="text-purple-600"
                bg="bg-purple-500/10"
              />
              <QuickAction
                href="/campaigns/new"
                icon={Calendar}
                title="New campaign"
                desc="AI plans your full 30-day content calendar"
                color="text-blue-600"
                bg="bg-blue-500/10"
              />
              <QuickAction
                href="/publish"
                icon={Send}
                title="Publish"
                desc="Publish now or schedule for later"
                color="text-emerald-600"
                bg="bg-emerald-500/10"
                badge={stats.approvedContent > 0 ? `${stats.approvedContent} ready` : undefined}
              />
              <QuickAction
                href="/brand"
                icon={Brain}
                title="Brand Brain"
                desc="Upload docs and manage your AI's knowledge"
                color="text-rose-600"
                bg="bg-rose-500/10"
              />
              <QuickAction
                href="/analytics"
                icon={BarChart3}
                title="Analytics"
                desc="Track content performance and engagement"
                color="text-orange-600"
                bg="bg-orange-500/10"
              />
            </div>
          </div>

          {/* Platform connections */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-foreground">Social platforms</h2>
              <Link href="/publish" className="text-xs text-astra-500 hover:text-astra-600 font-semibold transition flex items-center gap-1">
                Manage <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { platform: "twitter", label: "Twitter / X", icon: Twitter, color: "text-[#1DA1F2]", bg: "bg-[#1DA1F2]/10", connectHref: `/api/auth/twitter?brand_id=${activeBrandId}` },
                { platform: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-[#0077B5]", bg: "bg-[#0077B5]/10", connectHref: `/api/auth/linkedin?brand_id=${activeBrandId}` },
              ].map((p) => {
                const account = socialAccounts.find((a) => a.platform === p.platform);
                const Icon = p.icon;
                return (
                  <div key={p.platform} className={cn(
                    "flex items-center gap-3 p-4 rounded-2xl border transition",
                    account ? "border-emerald-500/20 bg-emerald-500/5" : "border-border bg-card"
                  )}>
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", p.bg)}>
                      <Icon className={cn("w-5 h-5", p.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{p.label}</p>
                      {account ? (
                        <p className="text-xs text-emerald-600 font-semibold">{account.account_name}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Not connected</p>
                      )}
                    </div>
                    {account ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <a
                        href={activeBrandId ? p.connectHref : "#"}
                        className={cn("text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition", p.color, "border-current hover:opacity-80")}
                      >
                        Connect
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right col: Activity + Upcoming ────────────────────────────── */}
        <div className="space-y-6">
          {/* Upcoming scheduled */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-foreground flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" /> Upcoming
              </h2>
              <Link href="/publish" className="text-xs text-astra-500 hover:text-astra-600 font-semibold transition flex items-center gap-1">
                All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {upcoming.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-border rounded-2xl text-muted-foreground">
                <Calendar className="w-6 h-6 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold">No scheduled posts</p>
                <Link href="/publish" className="text-xs text-astra-500 hover:text-astra-600 mt-1 inline-block font-medium transition">
                  Schedule one →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {upcoming.map((post) => {
                  const Icon = post.platform === "twitter" ? Twitter : Linkedin;
                  const color = post.platform === "twitter" ? "text-[#1DA1F2]" : "text-[#0077B5]";
                  const bg = post.platform === "twitter" ? "bg-[#1DA1F2]/10" : "bg-[#0077B5]/10";
                  return (
                    <div key={post.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", bg)}>
                        <Icon className={cn("w-3.5 h-3.5", color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground capitalize">{post.platform}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(post.scheduled_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent activity */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-foreground flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-astra-500" /> Recent activity
              </h2>
            </div>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-border rounded-2xl text-muted-foreground">
                <Zap className="w-6 h-6 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold">No activity yet</p>
                <p className="text-xs mt-0.5">Start by generating content</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((item, i) => {
                  const statusDot =
                    item.status === "approved" || item.status === "published" || item.status === "completed"
                      ? "bg-emerald-500"
                      : item.status === "rejected" || item.status === "failed"
                      ? "bg-red-500"
                      : "bg-amber-400";
                  const typeIcon = item.type === "agent"
                    ? Bot
                    : item.type === "published"
                    ? Send
                    : FileText;
                  const TypeIcon = typeIcon;
                  return (
                    <div key={i} className="flex items-start gap-3 p-3 bg-card border border-border rounded-xl">
                      <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <TypeIcon className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground capitalize line-clamp-1">{item.label}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.sub}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={cn("w-2 h-2 rounded-full", statusDot)} />
                        <span className="text-xs text-muted-foreground">{formatRelativeTime(item.time)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Brand overview strip ──────────────────────────────────────────── */}
      {brands.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-foreground">Brand workspaces</h2>
            <Link href="/brand" className="flex items-center gap-1.5 text-xs font-semibold text-astra-500 hover:text-astra-600 transition">
              <Plus className="w-3.5 h-3.5" /> New brand
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/brand/${brand.id}`}
                className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-2xl hover:border-astra-500/40 hover:shadow-sm transition group"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-astra-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {brand.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground group-hover:text-astra-600 transition">{brand.name}</p>
                  <p className="text-xs text-muted-foreground">{brand.industry || "No industry set"}</p>
                </div>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-semibold ml-2",
                  brand.onboarded ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                )}>
                  {brand.onboarded ? "Active" : "Setup needed"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
