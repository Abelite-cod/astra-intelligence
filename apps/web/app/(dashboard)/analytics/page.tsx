"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useBrands } from "@/hooks/use-brand";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { cn } from "@/lib/utils";
import {
  FileText, Zap, Bot, BarChart3, Brain, ChevronDown,
  TrendingUp, Star, CheckCircle2, Clock, Loader2
} from "lucide-react";

interface AnalyticsData {
  overview: {
    total_content: number;
    approved_content: number;
    published_content: number;
    draft_content: number;
    total_campaigns: number;
    active_campaigns: number;
    total_agent_runs: number;
    completed_agent_runs: number;
    avg_agent_duration_sec: number;
    avg_quality_score: number;
    total_documents: number;
    indexed_documents: number;
    total_chunks: number;
    total_tokens: number;
  };
  platform_breakdown: Array<{ platform: string; count: number }>;
  content_timeline: Array<{ date: string; label: string; count: number }>;
  top_content: Array<{ id: string; platform: string; title?: string; body: string; avg_score: number }>;
}

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: "#0077B5",
  twitter: "#1DA1F2",
  instagram: "#E1306C",
  email: "#F59E0B",
  blog: "#10B981",
};

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color = "text-astra-500",
  bg = "bg-astra-500/10",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color?: string;
  bg?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", bg)}>
          <Icon className={cn("w-4 h-4", color)} />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-sm">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-semibold text-foreground">{payload[0].value} posts</p>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const { data: brands = [] } = useBrands();
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const activeBrandId = selectedBrandId || brands[0]?.id || "";

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics", activeBrandId],
    queryFn: async () => {
      const res = await fetch(`/api/analytics?brand_id=${activeBrandId}`);
      if (!res.ok) throw new Error("Failed to load analytics");
      return res.json() as Promise<AnalyticsData>;
    },
    enabled: !!activeBrandId,
  });

  const ov = analytics?.overview;

  // Filter last 14 days for the chart (less cluttered)
  const chartData = analytics?.content_timeline.slice(-14) ?? [];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Performance overview for your brand's AI-generated content.
          </p>
        </div>
        {brands.length > 1 && (
          <div className="relative">
            <select
              value={activeBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : !ov ? (
        <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl text-muted-foreground">
          <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="font-semibold">No data yet</p>
          <p className="text-sm mt-1">Create content and run agents to see analytics here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Stat cards ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total content"
              value={ov.total_content}
              sub={`${ov.approved_content} approved · ${ov.published_content} published`}
              icon={FileText}
            />
            <StatCard
              label="Avg quality score"
              value={ov.avg_quality_score > 0 ? `${ov.avg_quality_score}/10` : "—"}
              sub="From AI reviewer agent"
              icon={Star}
              color="text-yellow-500"
              bg="bg-yellow-500/10"
            />
            <StatCard
              label="Agent runs"
              value={ov.total_agent_runs}
              sub={`${ov.completed_agent_runs} completed · avg ${ov.avg_agent_duration_sec}s`}
              icon={Bot}
              color="text-purple-500"
              bg="bg-purple-500/10"
            />
            <StatCard
              label="Knowledge base"
              value={ov.indexed_documents}
              sub={`${ov.total_chunks} chunks · ${Math.round(ov.total_tokens / 1000)}K tokens`}
              icon={Brain}
              color="text-green-500"
              bg="bg-green-500/10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              label="Campaigns"
              value={ov.total_campaigns}
              sub={`${ov.active_campaigns} active`}
              icon={Zap}
              color="text-blue-500"
              bg="bg-blue-500/10"
            />
            <StatCard
              label="Draft content"
              value={ov.draft_content}
              sub="Awaiting approval"
              icon={Clock}
              color="text-orange-500"
              bg="bg-orange-500/10"
            />
            <StatCard
              label="Published"
              value={ov.published_content}
              sub="Live on social"
              icon={CheckCircle2}
              color="text-green-500"
              bg="bg-green-500/10"
            />
            <StatCard
              label="Approval rate"
              value={ov.total_content > 0 ? `${Math.round((ov.approved_content + ov.published_content) / ov.total_content * 100)}%` : "—"}
              sub="Approved or published"
              icon={TrendingUp}
            />
          </div>

          {/* ── Content activity chart ───────────────────────────────────── */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Content created — last 14 days</h2>
            {chartData.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="contentGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    interval={2}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#contentGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                No content created in the last 14 days.
              </div>
            )}
          </div>

          {/* ── Platform breakdown + Top content ────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Platform chart */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">Content by platform</h2>
              {analytics?.platform_breakdown.length ? (
                <div className="space-y-3">
                  {analytics.platform_breakdown
                    .sort((a, b) => b.count - a.count)
                    .map((p) => {
                      const max = Math.max(...analytics.platform_breakdown.map((x) => x.count));
                      const pct = max > 0 ? (p.count / max) * 100 : 0;
                      const color = PLATFORM_COLORS[p.platform] ?? "#6366f1";
                      return (
                        <div key={p.platform}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="capitalize text-foreground font-medium">{p.platform}</span>
                            <span className="text-muted-foreground">{p.count} posts</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, backgroundColor: color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                  Generate content to see platform distribution.
                </div>
              )}
            </div>

            {/* Top content */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">Top quality content</h2>
              {analytics?.top_content.length ? (
                <div className="space-y-3">
                  {analytics.top_content.map((c, i) => (
                    <div key={c.id} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-astra-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-astra-500">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground line-clamp-2 leading-snug">
                          {c.title || (c.body ?? "").slice(0, 80)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 capitalize">{c.platform}</p>
                      </div>
                      <div className={cn(
                        "shrink-0 text-xs font-bold px-2 py-0.5 rounded-full",
                        c.avg_score >= 8 ? "bg-green-500/10 text-green-600" :
                        c.avg_score >= 6 ? "bg-yellow-500/10 text-yellow-600" :
                        "bg-red-500/10 text-red-500"
                      )}>
                        {c.avg_score}/10
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                  No scored content yet. Run the agent pipeline to score content.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
