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
        <div className="animate-spin w-5 h-5 border-2 border-[#C8843A] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="mb-8 pb-6 border-b border-[#2A2520] flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#F5F2EE] tracking-tight">
            {greeting}, {displayName}
          </h1>
          <p className="mt-1 text-sm text-[#928C83]">
            {brands.length === 0
              ? "Let's get your ASTRA marketing system set up."
              : `${brands[0]?.name ?? "Your brand"} · ASTRA is ready to work.`}
          </p>
        </div>
        <Link
          href="/content"
          className="flex items-center gap-2 bg-[#C8843A] text-[#0D0B09] px-4 py-2 text-sm font-medium rounded-sm hover:bg-[#DE913A] transition-colors"
        >
          <Sparkles className="w-4 h-4" /> Generate content
        </Link>
      </div>

      {/* ── Setup banner (shown when no brands) ──────────────────────────── */}
      {brands.length === 0 && (
        <div className="border-l-4 border-[#C8843A] bg-[#1F1B17] p-6 rounded-sm mb-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-[#C8843A]" />
                <span className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em]">First step</span>
              </div>
              <h2 className="text-base font-semibold text-[#F5F2EE] mb-2">Activate your Brand Brain</h2>
              <p className="text-sm text-[#928C83] max-w-lg leading-relaxed">
                Train ASTRA on your company, products, and audience. Once set up, every piece of content will be perfectly on-brand — automatically.
              </p>
              <div className="flex items-center gap-5 mt-4 text-xs text-[#6E6860]">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#3D7A5A]" /> On-brand content</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#3D7A5A]" /> Knows your audience</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#3D7A5A]" /> Never loses context</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Link
                href="/onboarding"
                className="flex items-center gap-2 bg-[#C8843A] text-[#0D0B09] font-medium px-4 py-2 rounded-sm text-sm hover:bg-[#DE913A] transition-colors"
              >
                <Rocket className="w-4 h-4" /> Start setup <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/brand"
                className="flex items-center gap-2 border border-[#3A3530] text-[#B8B2A9] px-4 py-2 text-sm font-medium rounded-sm hover:border-[#524D47] hover:text-[#F5F2EE] bg-transparent transition-colors justify-center"
              >
                Manual setup
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#2A2520] border border-[#2A2520] rounded-sm mb-8">
        <Link href="/content" className="p-6 hover:bg-[#161310] transition-colors">
          <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-1">Total content</p>
          <p className="text-3xl font-semibold text-[#F5F2EE] tracking-tight">{stats.totalContent}</p>
          <p className="text-xs text-[#6E6860] mt-1">{stats.approvedContent} approved · {stats.publishedContent} published</p>
        </Link>
        <Link href="/campaigns" className="p-6 hover:bg-[#161310] transition-colors">
          <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-1">Campaigns</p>
          <p className="text-3xl font-semibold text-[#F5F2EE] tracking-tight">{campaigns.length}</p>
          <p className="text-xs text-[#3D7A5A] mt-1">{stats.activeCampaigns} active</p>
        </Link>
        <Link href="/publish" className="p-6 hover:bg-[#161310] transition-colors">
          <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-1">Scheduled posts</p>
          <p className="text-3xl font-semibold text-[#F5F2EE] tracking-tight">{stats.scheduledPosts}</p>
          <p className="text-xs text-[#6E6860] mt-1">upcoming</p>
        </Link>
        <Link href="/agents" className="p-6 hover:bg-[#161310] transition-colors">
          <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-1">Agent runs</p>
          <p className="text-3xl font-semibold text-[#F5F2EE] tracking-tight">{agentRuns.length}</p>
          <p className="text-xs text-[#3D7A5A] mt-1">{stats.recentAgentRuns} completed</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left col: Quick actions + Platform status ──────────────────── */}
        <div className="lg:col-span-2 space-y-8">

          {/* Quick actions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-medium text-[#F5F2EE]">Quick actions</h2>
            </div>
            <div className="border border-[#2A2520] rounded-sm divide-y divide-[#1F1B17]">
              {[
                { href: "/content", icon: Sparkles, title: "Generate content", desc: "ASTRA writes platform-optimised posts in seconds", badge: stats.draftContent > 0 ? `${stats.draftContent} drafts` : undefined },
                { href: "/agents", icon: Bot, title: "Run ASTRA Agents", desc: "4 agents build a complete campaign strategy", badge: undefined },
                { href: "/campaigns/new", icon: Calendar, title: "New campaign", desc: "AI plans your full 30-day content calendar", badge: undefined },
                { href: "/publish", icon: Send, title: "Publish", desc: "Publish now or schedule for later", badge: stats.approvedContent > 0 ? `${stats.approvedContent} ready` : undefined },
                { href: "/brand", icon: Brain, title: "Brand Brain", desc: "Upload docs and manage your AI's knowledge", badge: undefined },
                { href: "/analytics", icon: BarChart3, title: "Analytics", desc: "Track content performance and engagement", badge: undefined },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center justify-between px-4 py-3 hover:bg-[#161310] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-sm bg-[#1F1B17] flex items-center justify-center">
                      <action.icon className="w-4 h-4 text-[#6E6860]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#F5F2EE]">{action.title}</p>
                      <p className="text-xs text-[#6E6860]">{action.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {action.badge && (
                      <span className="text-xs text-[#C8843A] font-medium">{action.badge}</span>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-[#3A3530]" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Platform connections */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-medium text-[#F5F2EE]">Social platforms</h2>
              <Link href="/publish" className="text-xs text-[#6E6860] hover:text-[#B8B2A9] transition-colors flex items-center gap-1">
                Manage <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="border border-[#2A2520] rounded-sm divide-y divide-[#1F1B17]">
              {[
                { platform: "twitter", label: "Twitter / X", icon: Twitter, color: "text-[#1DA1F2]", connectHref: `/api/auth/twitter?brand_id=${activeBrandId}` },
                { platform: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-[#0077B5]", connectHref: `/api/auth/linkedin?brand_id=${activeBrandId}` },
                { platform: "tiktok", label: "TikTok", icon: null, color: "text-[#EE1D52]", connectHref: `/api/auth/tiktok?brand_id=${activeBrandId}` },
              ].map((p) => {
                const account = socialAccounts.find((a) => a.platform === p.platform);
                const Icon = p.icon;
                return (
                  <div key={p.platform} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-sm bg-[#1F1B17] flex items-center justify-center shrink-0">
                      {Icon ? (
                        <Icon className={cn("w-4 h-4", p.color)} />
                      ) : (
                        <span className="text-sm">🎵</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#F5F2EE]">{p.label}</p>
                      {account ? (
                        <p className="text-xs text-[#3D7A5A]">{account.account_name}</p>
                      ) : (
                        <p className="text-xs text-[#6E6860]">Not connected</p>
                      )}
                    </div>
                    {account ? (
                      <CheckCircle2 className="w-4 h-4 text-[#3D7A5A] shrink-0" />
                    ) : (
                      <a
                        href={activeBrandId ? p.connectHref : "#"}
                        className="text-xs font-medium px-3 py-1.5 rounded-sm border border-[#3A3530] text-[#B8B2A9] hover:border-[#524D47] hover:text-[#F5F2EE] transition-colors"
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

        {/* ── Right col: Upcoming + Activity ────────────────────────────── */}
        <div className="space-y-8">

          {/* Upcoming scheduled */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-medium text-[#F5F2EE]">Upcoming</h2>
              <Link href="/publish" className="text-xs text-[#6E6860] hover:text-[#B8B2A9] transition-colors flex items-center gap-1">
                All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {upcoming.length === 0 ? (
              <div className="border border-[#2A2520] border-dashed rounded-sm p-8 text-center">
                <p className="text-sm font-medium text-[#6E6860]">No scheduled posts</p>
                <Link href="/publish" className="text-xs text-[#C8843A] hover:text-[#DE913A] mt-2 inline-block transition-colors">
                  Schedule one →
                </Link>
              </div>
            ) : (
              <div className="border border-[#2A2520] rounded-sm divide-y divide-[#1F1B17]">
                {upcoming.map((post) => {
                  const Icon = post.platform === "twitter" ? Twitter : Linkedin;
                  const color = post.platform === "twitter" ? "text-[#1DA1F2]" : "text-[#0077B5]";
                  return (
                    <div key={post.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-7 h-7 rounded-sm bg-[#1F1B17] flex items-center justify-center shrink-0">
                        <Icon className={cn("w-3.5 h-3.5", color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#F5F2EE] capitalize">{post.platform}</p>
                        <p className="text-xs text-[#6E6860]">
                          {new Date(post.scheduled_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C8843A] shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent activity */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-medium text-[#F5F2EE]">Recent activity</h2>
            </div>
            {recentActivity.length === 0 ? (
              <div className="border border-[#2A2520] border-dashed rounded-sm p-8 text-center">
                <p className="text-sm font-medium text-[#6E6860]">No activity yet</p>
                <p className="text-xs text-[#524D47] mt-1">Start by generating content</p>
              </div>
            ) : (
              <div className="border border-[#2A2520] rounded-sm divide-y divide-[#1F1B17]">
                {recentActivity.map((item, i) => {
                  const statusColor =
                    item.status === "approved" || item.status === "published" || item.status === "completed"
                      ? "bg-[#3D7A5A]"
                      : item.status === "rejected" || item.status === "failed"
                      ? "bg-[#8A3030]"
                      : "bg-[#C8843A]";
                  const typeIcon = item.type === "agent"
                    ? Bot
                    : item.type === "published"
                    ? Send
                    : FileText;
                  const TypeIcon = typeIcon;
                  return (
                    <div key={i} className="flex items-start gap-3 px-4 py-3">
                      <div className="w-7 h-7 rounded-sm bg-[#1F1B17] flex items-center justify-center shrink-0 mt-0.5">
                        <TypeIcon className="w-3 h-3 text-[#6E6860]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#F5F2EE] capitalize line-clamp-1">{item.label}</p>
                        <p className="text-xs text-[#6E6860] line-clamp-1 mt-0.5">{item.sub}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={cn("w-1.5 h-1.5 rounded-full", statusColor)} />
                        <span className="text-xs text-[#6E6860]">{formatRelativeTime(item.time)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Brand workspaces ──────────────────────────────────────────────── */}
      {brands.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium text-[#F5F2EE]">Brand workspaces</h2>
            <Link href="/brand" className="flex items-center gap-1.5 text-xs text-[#6E6860] hover:text-[#B8B2A9] transition-colors">
              <Plus className="w-3.5 h-3.5" /> New brand
            </Link>
          </div>
          <div className="border border-[#2A2520] rounded-sm divide-y divide-[#1F1B17]">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/brand/${brand.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-[#161310] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-sm bg-[#1F1B17] border border-[#2A2520] flex items-center justify-center text-[#B8B2A9] font-medium text-sm shrink-0">
                    {brand.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#F5F2EE]">{brand.name}</p>
                    <p className="text-xs text-[#6E6860]">{brand.industry || "No industry set"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em] rounded-sm border",
                    brand.onboarded
                      ? "bg-[#0E2A1A] text-[#4D9A6A] border-[#1E4D30]"
                      : "bg-[#2A1E08] text-[#C8943A] border-[#4D3810]"
                  )}>
                    {brand.onboarded ? "Active" : "Setup needed"}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#3A3530]" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
