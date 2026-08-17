"use client";

import { useState } from "react";
import { useBrands } from "@/hooks/use-brand";
import { useRunAgents, useAgentRuns, type AgentRunResult } from "@/hooks/use-agents";
import { PlatformPreview } from "@/components/content/platform-preview";
import { cn } from "@/lib/utils";
import {
  Bot, Loader2, Sparkles, CheckCircle2, XCircle,
  ChevronDown, Clock, Zap, Brain, Search, TrendingUp,
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
      <div className="p-8 max-w-2xl mx-auto text-center">
        <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Set up your Brand Brain first</h2>
        <p className="text-muted-foreground mb-4">Agents need your brand context to work.</p>
        <a href="/brand" className="inline-flex items-center gap-2 bg-astra-500 hover:bg-astra-600 text-white font-medium px-5 py-2.5 rounded-xl transition text-sm">
          Set up Brand Brain <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Agents</h1>
          <p className="text-muted-foreground text-sm mt-1">
            A team of specialized AI agents that coordinate to create high-quality campaigns.
          </p>
        </div>
        {brands.length > 1 && (
          <div className="relative">
            <select
              value={activeBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: goal input */}
        <div className="lg:col-span-2 space-y-4">
          {/* Agent pipeline visualization */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground mb-3">AGENT PIPELINE</p>
            {AGENTS.map((agent, i) => (
              <div key={agent.id} className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
                    runAgents.isPending && activeAgentStep === i
                      ? "bg-astra-500 text-white animate-pulse"
                      : activeAgentStep > i || (!runAgents.isPending && result)
                      ? "bg-green-500/10 text-green-600"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {runAgents.isPending && activeAgentStep === i ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : activeAgentStep > i || (!runAgents.isPending && result) ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <agent.icon className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{agent.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{agent.desc}</p>
                </div>
                {i < AGENTS.length - 1 && (
                  <div className="absolute left-[2.25rem] mt-8">
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Goal form */}
          <form onSubmit={handleRun} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Campaign goal
              </label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={3}
                placeholder="What is the marketing goal? Be specific about the outcome you want…"
                className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {GOAL_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setGoal(s)}
                    className="text-xs px-2.5 py-1 rounded-full border border-border bg-background hover:border-astra-500/50 hover:text-astra-600 transition text-muted-foreground"
                  >
                    {s.length > 40 ? s.slice(0, 40) + "…" : s}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={runAgents.isPending || !goal.trim()}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-white text-sm transition",
                "bg-gradient-to-r from-astra-500 to-purple-500 hover:from-astra-600 hover:to-purple-600",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {runAgents.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Agents working…</>
              ) : (
                <><Play className="w-4 h-4" /> Run agent pipeline</>
              )}
            </button>
          </form>

          {/* Recent runs */}
          {runs.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">RECENT RUNS</p>
              <div className="space-y-2">
                {runs.slice(0, 5).map((run) => (
                  <div key={run.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card text-sm">
                    <div className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      run.status === "completed" ? "bg-green-500" :
                      run.status === "failed" ? "bg-red-500" :
                      "bg-yellow-500 animate-pulse"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {(run.input as { goal?: string })?.goal ?? run.workflow_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(run.started_at)}
                        {run.duration_ms && ` · ${(run.duration_ms / 1000).toFixed(1)}s`}
                      </p>
                    </div>
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded font-medium",
                      run.status === "completed" ? "bg-green-500/10 text-green-600" :
                      run.status === "failed" ? "bg-red-500/10 text-red-500" :
                      "bg-yellow-500/10 text-yellow-600"
                    )}>
                      {run.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: results */}
        <div className="lg:col-span-3 space-y-4">
          {!result && !runAgents.isPending && (
            <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl text-muted-foreground text-sm gap-3">
              <div className="w-14 h-14 rounded-2xl bg-astra-500/10 flex items-center justify-center">
                <Bot className="w-7 h-7 text-astra-500" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">Ready to run</p>
                <p className="text-xs mt-1">Enter a goal and watch 4 agents collaborate to create your content</p>
              </div>
            </div>
          )}

          {runAgents.isPending && (
            <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-astra-500/30 rounded-xl bg-astra-500/5 gap-4">
              <Loader2 className="w-10 h-10 text-astra-500 animate-spin" />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  {activeAgentStep >= 0 && activeAgentStep < AGENTS.length
                    ? `${AGENTS[activeAgentStep].label} is working…`
                    : "Initializing agents…"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  4 agents are coordinating to create your campaign
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Quality scores */}
              {result.review?.scores && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 text-astra-500" /> Quality Scores
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(result.review.scores).map(([key, score]) => (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                          <span className="font-bold text-foreground">{score}/10</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              score >= 8 ? "bg-green-500" : score >= 6 ? "bg-yellow-500" : "bg-red-500"
                            )}
                            style={{ width: `${score * 10}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {result.review.feedback && (
                    <p className="text-xs text-muted-foreground mt-3 border-t border-border pt-3">
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
                <div className="bg-card border border-border rounded-xl p-4">
                  <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    Agent Trace
                    <span className="text-xs text-muted-foreground font-normal ml-auto">
                      Total: {result.duration_ms ? (result.duration_ms / 1000).toFixed(1) + "s" : "—"}
                    </span>
                  </p>
                  <div className="space-y-2">
                    {result.agents_trace.map((step, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm">
                        {step.status === "success" ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <span className="font-medium text-foreground">{step.agent}</span>
                          {step.output && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{step.output}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {(step.duration_ms / 1000).toFixed(1)}s
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground text-center">
                ✓ Content saved to your library — view and approve in the Content tab
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
