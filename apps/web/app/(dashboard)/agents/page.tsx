"use client";

import { useState } from "react";
import { useBrands } from "@/hooks/use-brand";
import { useRunAgents, useAgentRuns, type AgentRunResult } from "@/hooks/use-agents";
import { PlatformPreview } from "@/components/content/platform-preview";
import { cn } from "@/lib/utils";
import {
  Bot, Sparkles, CheckCircle2, XCircle,
  ChevronDown, Clock, Brain, Search, TrendingUp,
  PenLine, Star, ArrowRight, Play
} from "lucide-react";
import { toast } from "sonner";
import { formatRelativeTime } from "@/lib/utils";

const AGENTS = [
  { id: "research", icon: Search, label: "Research Agent", desc: "Finds key insights and audience pain points" },
  { id: "trend", icon: TrendingUp, label: "Trend Agent", desc: "Identifies trending topics and hashtags" },
  { id: "writer", icon: PenLine, label: "Writer Agent", desc: "Creates on-brand content for all platforms" },
  { id: "reviewer", icon: Star, label: "Reviewer Agent", desc: "Scores quality and improves the content" },
];

const GOAL_SUGGESTIONS = [
  "Launch our new AI feature to B2B founders",
  "Increase brand awareness in the healthcare industry",
  "Generate leads from CTOs and engineering managers",
  "Build thought leadership content about AI automation",
  "Announce a partnership or milestone",
  "Educate our audience about our product's core value",
];

const STATUS_BADGE: Record<string, string> = {
  completed: "bg-[#0E2A1A] text-[#4D9A6A] border-[#1E4D30]",
  failed:    "bg-[#2A0E0E] text-[#D97070] border-[#5A2020]",
  running:   "bg-[#2A1E08] text-[#C8943A] border-[#4D3810]",
};

export default function AgentsPage() {
  const { data: brands = [] } = useBrands();
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [goal, setGoal] = useState("");
  const [result, setResult] = useState<AgentRunResult | null>(null);
  const [activeAgentStep, setActiveAgentStep] = useState(-1);

  const activeBrandId = selectedBrandId || brands[0]?.id || "";
  const runAgents = useRunAgents(activeBrandId);
  const { data: runs = [] } = useAgentRuns(activeBrandId);

  async function handleRun(e: React.FormEvent) {
    e.preventDefault();
    if (!goal.trim() || !activeBrandId) return;

    setResult(null);
    setActiveAgentStep(0);

    // Simulate agent step progression
    const stepInterval = setInterval(() => {
      setActiveAgentStep((prev) => {
        if (prev >= AGENTS.length - 1) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 2500);

    toast.promise(
      runAgents.mutateAsync({ goal }).then((res) => {
        clearInterval(stepInterval);
        setActiveAgentStep(AGENTS.length);
        setResult(res);
        return res;
      }),
      {
        loading: "Agents are working…",
        success: "Multi-agent workflow complete!",
        error: (e) => {
          clearInterval(stepInterval);
          setActiveAgentStep(-1);
          const raw = e instanceof Error ? e.message : String(e);
          // Guard against raw JSON leaking through
          if (raw.trim().startsWith("{") || raw.trim().startsWith("[")) {
            try {
              const parsed = JSON.parse(raw);
              const msg = parsed?.error?.message ?? parsed?.error ?? parsed?.message ?? null;
              if (typeof msg === "string") return msg;
            } catch { /* fall through */ }
            return "Agent pipeline failed. Please try again.";
          }
          return raw || "Agent pipeline failed. Please try again.";
        },
      }
    );
  }

  if (brands.length === 0) {
    return (
      <div className="p-8 max-w-2xl">
        <div className="border border-[#2A2520] border-dashed rounded-sm p-16 text-center">
          <p className="text-sm font-medium text-[#6E6860]">Brand Brain required</p>
          <p className="text-xs text-[#524D47] mt-1 mb-4">Agents need your brand context to work.</p>
          <a
            href="/brand"
            className="inline-flex items-center gap-2 bg-[#C8843A] text-[#0D0B09] px-4 py-2 text-sm font-medium rounded-sm hover:bg-[#DE913A] transition-colors"
          >
            Set up Brand Brain <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl">
      {/* Page header */}
      <div className="mb-8 pb-6 border-b border-[#2A2520] flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#F5F2EE] tracking-tight">ASTRA Agents</h1>
          <p className="mt-1 text-sm text-[#928C83]">
            A team of specialized agents that coordinate to create high-quality campaigns.
          </p>
        </div>
        {brands.length > 1 && (
          <div className="relative">
            <select
              value={activeBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="appearance-none h-9 pl-3 pr-8 bg-[#161310] border border-[#3A3530] rounded-sm text-sm text-[#F5F2EE] focus:border-[#C8843A] focus:outline-none"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6E6860] pointer-events-none" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: pipeline + goal input */}
        <div className="lg:col-span-2 space-y-6">

          {/* Agent pipeline visualization */}
          <div>
            <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-3">Agent pipeline</p>
            <div className="border border-[#2A2520] rounded-sm divide-y divide-[#1F1B17]">
              {AGENTS.map((agent, i) => {
                const isActive = runAgents.isPending && activeAgentStep === i;
                const isDone = activeAgentStep > i || (!runAgents.isPending && result);
                return (
                  <div key={agent.id} className="flex items-center gap-3 px-4 py-3">
                    <div className={cn(
                      "w-7 h-7 rounded-sm flex items-center justify-center shrink-0 border transition-colors",
                      isActive
                        ? "border-[#C8843A] bg-transparent"
                        : isDone
                        ? "border-[#1E4D30] bg-[#0E2A1A]"
                        : "border-[#2A2520] bg-[#1F1B17]"
                    )}>
                      {isActive ? (
                        <div className="w-3 h-3 border-2 border-[#C8843A] border-t-transparent rounded-full animate-spin" />
                      ) : isDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#4D9A6A]" />
                      ) : (
                        <agent.icon className="w-3.5 h-3.5 text-[#6E6860]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium",
                        isActive ? "text-[#C8843A]" : isDone ? "text-[#4D9A6A]" : "text-[#B8B2A9]"
                      )}>{agent.label}</p>
                      <p className="text-xs text-[#6E6860] truncate">{agent.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Goal form */}
          <form onSubmit={handleRun} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-2">
                Campaign goal
              </label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={3}
                placeholder="What is the marketing goal? Be specific about the outcome you want…"
                className="w-full px-3 py-2 bg-[#161310] border border-[#3A3530] rounded-sm text-sm text-[#F5F2EE] placeholder:text-[#524D47] focus:border-[#C8843A] focus:outline-none resize-none"
              />
              <div className="mt-3 flex flex-wrap gap-1.5">
                {GOAL_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setGoal(s)}
                    className="text-xs px-2.5 py-1 rounded-sm border border-[#2A2520] text-[#6E6860] hover:border-[#3A3530] hover:text-[#B8B2A9] bg-transparent transition-colors"
                  >
                    {s.length > 40 ? s.slice(0, 40) + "…" : s}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={runAgents.isPending || !goal.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-sm font-medium text-[#0D0B09] text-sm bg-[#C8843A] hover:bg-[#DE913A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {runAgents.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#0D0B09] border-t-transparent rounded-full animate-spin" />
                  Agents working…
                </>
              ) : (
                <><Play className="w-4 h-4" /> Run agent pipeline</>
              )}
            </button>
          </form>

          {/* Recent runs */}
          {runs.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-3">Recent runs</p>
              <div className="border border-[#2A2520] rounded-sm divide-y divide-[#1F1B17]">
                {runs.slice(0, 5).map((run) => {
                  const badgeClass = STATUS_BADGE[run.status] ?? STATUS_BADGE.running;
                  return (
                    <div key={run.id} className="flex items-center gap-3 px-4 py-3">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        run.status === "completed" ? "bg-[#3D7A5A]" :
                        run.status === "failed" ? "bg-[#8A3030]" : "bg-[#C8843A]"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#F5F2EE] truncate">
                          {(run.input as { goal?: string })?.goal ?? run.workflow_type}
                        </p>
                        <p className="text-xs text-[#6E6860]">
                          {formatRelativeTime(run.started_at)}
                          {run.duration_ms && ` · ${(run.duration_ms / 1000).toFixed(1)}s`}
                        </p>
                      </div>
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em] rounded-sm border",
                        badgeClass
                      )}>
                        {run.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: results */}
        <div className="lg:col-span-3 space-y-4">
          {!result && !runAgents.isPending && (
            <div className="h-80 flex flex-col items-center justify-center border border-[#2A2520] border-dashed rounded-sm text-center">
              <p className="text-sm font-medium text-[#6E6860]">Ready to run</p>
              <p className="text-xs text-[#524D47] mt-1">Enter a goal and watch 4 agents collaborate to create your content</p>
            </div>
          )}

          {runAgents.isPending && (
            <div className="h-80 flex flex-col items-center justify-center border border-[#2A2520] border-dashed rounded-sm gap-4">
              <div className="w-8 h-8 border-2 border-[#C8843A] border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <p className="text-sm font-medium text-[#F5F2EE]">
                  {activeAgentStep >= 0 && activeAgentStep < AGENTS.length
                    ? `${AGENTS[activeAgentStep].label} is working…`
                    : "Initializing agents…"}
                </p>
                <p className="text-xs text-[#6E6860] mt-1">
                  4 agents are coordinating to create your campaign
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Quality scores */}
              {result.review?.scores && (
                <div className="border border-[#2A2520] rounded-sm p-5">
                  <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-4">Quality scores</p>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(result.review.scores).map(([key, score]) => (
                      <div key={key} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#6E6860] capitalize">{key.replace(/_/g, " ")}</span>
                          <span className="font-medium text-[#F5F2EE]">{score}/10</span>
                        </div>
                        <div className="h-1 bg-[#1F1B17] rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              score >= 8 ? "bg-[#3D7A5A]" : score >= 6 ? "bg-[#C8843A]" : "bg-[#8A3030]"
                            )}
                            style={{ width: `${score * 10}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {result.review.feedback && (
                    <p className="text-xs text-[#6E6860] mt-4 pt-4 border-t border-[#2A2520]">
                      {result.review.feedback}
                    </p>
                  )}
                </div>
              )}

              {/* Generated content previews */}
              {result.content && Object.entries(result.content).map(([platform, content]) => (
                <PlatformPreview
                  key={platform}
                  platform={platform as "linkedin" | "twitter" | "instagram"}
                  body={content.body}
                  hook={content.hook}
                  hashtags={content.hashtags}
                />
              ))}

              {/* Agent trace */}
              {result.agents_trace && result.agents_trace.length > 0 && (
                <div className="border border-[#2A2520] rounded-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em]">Agent trace</p>
                    <span className="text-xs text-[#524D47]">
                      Total: {result.duration_ms ? (result.duration_ms / 1000).toFixed(1) + "s" : "—"}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {result.agents_trace.map((step, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm border-b border-[#1F1B17] pb-2 last:border-0 last:pb-0">
                        {step.status === "success" ? (
                          <CheckCircle2 className="w-4 h-4 text-[#3D7A5A] shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-[#8A3030] shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-[#F5F2EE]">{step.agent}</span>
                          {step.output && (
                            <p className="text-xs text-[#6E6860] mt-0.5 line-clamp-2">{step.output}</p>
                          )}
                        </div>
                        <span className="text-xs text-[#524D47] shrink-0 font-mono">
                          {(step.duration_ms / 1000).toFixed(1)}s
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-[#524D47] text-center">
                Content saved to your library — view and approve in the Content tab
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
