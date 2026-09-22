"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useBrands } from "@/hooks/use-brand";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { cn } from "@/lib/utils";
import {
  FileText, Zap, Bot, BarChart3, Brain, ChevronDown,
  TrendingUp, Star, CheckCircle2, Clock
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
  linkedin:  "#0077B5",
  twitter:   "#1DA1F2",
  instagram: "#E1306C",
  email:     "#C8843A",
  blog:      "#3D7A5A",
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1F1B17] border border-[#2A2520] rounded-sm px-3 py-2 text-sm">
        <p className="text-[#6E6860]">{label}</p>
        <p className="font-medium text-[#F5F2EE]">{payload[0].value} posts</p>
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

  // Filter last 14 days for the chart
  const chartData = analytics?.content_timeline.slice(-14) ?? [];

  return (
    <div className="p-8 max-w-6xl">
      {/* Page header */}
      <div className="mb-8 pb-6 border-b border-[#2A2520] flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#F5F2EE] tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-[#928C83]">
            Performance overview for your brand's ASTRA-generated content.
          </p>
        </div>
        {brands.length > 1 && (
          <div className="relative">
            <select
              value={activeBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="appearance-none h-9 pl-3 pr-8 bg-[#161310] border border-[#3A3530] rounded-sm text-sm text-[#F5F2EE] focus:border-[#C8843A] focus:outline-none"
            >
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6E6860] pointer-events-none" />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-5 h-5 border-2 border-[#C8843A] border-t-transparent rounded-full" />
        </div>
      ) : !ov ? (
        <div className="border border-[#2A2520] border-dashed rounded-sm p-16 text-center">
          <p className="text-sm font-medium text-[#6E6860]">No data yet</p>
          <p className="text-xs text-[#524D47] mt-1">Create content and run agents to see analytics here.</p>
        </div>
      ) : (
        <div className="space-y-8">

          {/* ── Primary stats grid ───────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#2A2520] border border-[#2A2520] rounded-sm">
            <div className="p-6">
              <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-1">Total content</p>
              <p className="text-3xl font-semibold text-[#F5F2EE] tracking-tight">{ov.total_content}</p>
              <p className="text-xs text-[#6E6860] mt-1">{ov.approved_content} approved · {ov.published_content} published</p>
            </div>
            <div className="p-6">
              <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-1">Avg quality score</p>
              <p className="text-3xl font-semibold text-[#F5F2EE] tracking-tight">
                {ov.avg_quality_score > 0 ? `${ov.avg_quality_score}/10` : "—"}
              </p>
              <p className="text-xs text-[#6E6860] mt-1">From AI reviewer agent</p>
            </div>
            <div className="p-6">
              <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-1">Agent runs</p>
              <p className="text-3xl font-semibold text-[#F5F2EE] tracking-tight">{ov.total_agent_runs}</p>
              <p className="text-xs text-[#3D7A5A] mt-1">{ov.completed_agent_runs} completed · avg {ov.avg_agent_duration_sec}s</p>
            </div>
            <div className="p-6">
              <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-1">Knowledge base</p>
              <p className="text-3xl font-semibold text-[#F5F2EE] tracking-tight">{ov.indexed_documents}</p>
              <p className="text-xs text-[#6E6860] mt-1">{ov.total_chunks} chunks · {Math.round(ov.total_tokens / 1000)}K tokens</p>
            </div>
          </div>

          {/* ── Secondary stats grid ─────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#2A2520] border border-[#2A2520] rounded-sm">
            <div className="p-6">
              <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-1">Campaigns</p>
              <p className="text-3xl font-semibold text-[#F5F2EE] tracking-tight">{ov.total_campaigns}</p>
              <p className="text-xs text-[#3D7A5A] mt-1">{ov.active_campaigns} active</p>
            </div>
            <div className="p-6">
              <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-1">Draft content</p>
              <p className="text-3xl font-semibold text-[#F5F2EE] tracking-tight">{ov.draft_content}</p>
              <p className="text-xs text-[#6E6860] mt-1">Awaiting approval</p>
            </div>
            <div className="p-6">
              <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-1">Published</p>
              <p className="text-3xl font-semibold text-[#F5F2EE] tracking-tight">{ov.published_content}</p>
              <p className="text-xs text-[#6E6860] mt-1">Live on social</p>
            </div>
            <div className="p-6">
              <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-1">Approval rate</p>
              <p className="text-3xl font-semibold text-[#F5F2EE] tracking-tight">
                {ov.total_content > 0 ? `${Math.round((ov.approved_content + ov.published_content) / ov.total_content * 100)}%` : "—"}
              </p>
              <p className="text-xs text-[#6E6860] mt-1">Approved or published</p>
            </div>
          </div>

          {/* ── Content activity chart ───────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-medium text-[#F5F2EE]">Content created — last 14 days</h2>
            </div>
            <div className="border border-[#2A2520] rounded-sm p-5">
              {chartData.some((d) => d.count > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C8843A" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#C8843A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2520" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#6E6860" }}
                      axisLine={false}
                      tickLine={false}
                      interval={2}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#6E6860" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#C8843A"
                      strokeWidth={1.5}
                      fill="url(#amberGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-sm text-[#6E6860]">
                  No content created in the last 14 days.
                </div>
              )}
            </div>
          </div>

          {/* ── Platform breakdown + Top content ────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Platform chart */}
            <div>
              <h2 className="text-base font-medium text-[#F5F2EE] mb-4">Content by platform</h2>
              <div className="border border-[#2A2520] rounded-sm p-5">
                {analytics?.platform_breakdown.length ? (
                  <div className="space-y-4">
                    {analytics.platform_breakdown
                      .sort((a, b) => b.count - a.count)
                      .map((p) => {
                        const max = Math.max(...analytics.platform_breakdown.map((x) => x.count));
                        const pct = max > 0 ? (p.count / max) * 100 : 0;
                        const color = PLATFORM_COLORS[p.platform] ?? "#C8843A";
                        return (
                          <div key={p.platform}>
                            <div className="flex items-center justify-between text-sm mb-1.5">
                              <span className="capitalize text-[#B8B2A9]">{p.platform}</span>
                              <span className="text-[#6E6860]">{p.count} posts</span>
                            </div>
                            <div className="h-1 bg-[#1F1B17] rounded-full overflow-hidden">
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
                  <div className="h-40 flex items-center justify-center text-sm text-[#6E6860]">
                    Generate content to see platform distribution.
                  </div>
                )}
              </div>
            </div>

            {/* Top content */}
            <div>
              <h2 className="text-base font-medium text-[#F5F2EE] mb-4">Top quality content</h2>
              <div className="border border-[#2A2520] rounded-sm divide-y divide-[#1F1B17]">
                {analytics?.top_content.length ? (
                  analytics.top_content.map((c, i) => (
                    <div key={c.id} className="flex items-start gap-3 px-4 py-3">
                      <span className="text-xs font-medium text-[#524D47] w-5 shrink-0 pt-0.5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#F5F2EE] line-clamp-2 leading-snug">
                          {c.title || (c.body ?? "").slice(0, 80)}
                        </p>
                        <p className="text-xs text-[#6E6860] mt-0.5 capitalize">{c.platform}</p>
                      </div>
                      <span className={cn(
                        "shrink-0 inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em] rounded-sm border",
                        c.avg_score >= 8 ? "bg-[#0E2A1A] text-[#4D9A6A] border-[#1E4D30]" :
                        c.avg_score >= 6 ? "bg-[#2A1E08] text-[#C8943A] border-[#4D3810]" :
                        "bg-[#2A0E0E] text-[#D97070] border-[#5A2020]"
                      )}>
                        {c.avg_score}/10
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-sm text-[#6E6860]">No scored content yet.</p>
                    <p className="text-xs text-[#524D47] mt-1">Run the agent pipeline to score content.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
