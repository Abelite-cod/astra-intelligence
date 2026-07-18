import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface AgentRun {
  id: string;
  brand_id: string;
  workflow_type: string;
  status: "running" | "completed" | "failed" | "cancelled";
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  agent_trace: Array<{
    agent: string;
    status: string;
    output?: string;
    error?: string;
    duration_ms: number;
  }>;
  error_message?: string;
  duration_ms?: number;
  started_at: string;
  completed_at?: string;
}

export interface AgentRunResult {
  run_id: string;
  status: string;
  agents_trace: AgentRun["agent_trace"];
  research: string;
  trends: string;
  content: Record<string, { body: string; hook: string; hashtags: string[] }>;
  review: {
    scores: Record<string, number>;
    feedback: string;
  };
  saved_content: unknown[];
  duration_ms: number;
}

function supabase() {
  return createClient();
}

export function useAgentRuns(brandId: string) {
  return useQuery({
    queryKey: ["agent_runs", brandId],
    queryFn: async () => {
      const { data, error } = await supabase()
        .from("agent_runs")
        .select("*")
        .eq("brand_id", brandId)
        .order("started_at", { ascending: false })
        .limit(20);
      if (error) throw new Error(error.message);
      return (data ?? []) as AgentRun[];
    },
    enabled: !!brandId,
    refetchInterval: (query) => {
      const runs = query.state.data as AgentRun[] | undefined;
      const hasRunning = runs?.some((r) => r.status === "running");
      return hasRunning ? 2000 : false;
    },
  });
}

export function useRunAgents(brandId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { goal: string; campaign_id?: string }) => {
      const res = await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id: brandId, ...data }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Agent run failed");
      }
      return res.json() as Promise<AgentRunResult>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agent_runs", brandId] });
      qc.invalidateQueries({ queryKey: ["content", brandId] });
    },
  });
}
