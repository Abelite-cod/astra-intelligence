"use client";

import { useState } from "react";
import { useTikTokMemory, useDeleteTikTokPattern, useAnalyzeTikTokPosts } from "@/hooks/use-tiktok";
import { cn } from "@/lib/utils";
import {
  Sparkles, Trash2, ChevronDown, ChevronUp, Loader2,
  TrendingUp, Target, Mic2, Clock, Users, MessageSquare,
  Plus, AlertCircle, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

const PATTERN_TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  hook_style: { label: "Hook Style", icon: Sparkles, color: "text-[#EE1D52]", bg: "bg-[#EE1D52]/10" },
  format: { label: "Format", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-500/10" },
  topic_cluster: { label: "Topic", icon: Target, color: "text-purple-600", bg: "bg-purple-500/10" },
  cta_style: { label: "CTA Style", icon: MessageSquare, color: "text-emerald-600", bg: "bg-emerald-500/10" },
  duration: { label: "Duration", icon: Clock, color: "text-amber-600", bg: "bg-amber-500/10" },
  audience_signal: { label: "Audience", icon: Users, color: "text-teal-600", bg: "bg-teal-500/10" },
};

interface TikTokMemoryPanelProps {
  brandId: string;
}

export function TikTokMemoryPanel({ brandId }: TikTokMemoryPanelProps) {
  const { data: patterns = [], isLoading } = useTikTokMemory(brandId);
  const deleteMutation = useDeleteTikTokPattern(brandId);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const filtered = activeFilter === "all"
    ? patterns
    : patterns.filter((p) => p.pattern_type === activeFilter);

  const filters = [
    { id: "all", label: `All (${patterns.length})` },
    ...Object.entries(PATTERN_TYPE_CONFIG).map(([id, cfg]) => ({
      id,
      label: `${cfg.label} (${patterns.filter((p) => p.pattern_type === id).length})`,
    })),
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (patterns.length === 0) {
    return (
      <div className="text-center py-10 border-2 border-dashed border-border rounded-2xl text-muted-foreground">
        <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="font-semibold text-foreground">No patterns yet</p>
        <p className="text-sm mt-1">Import your TikTok history to extract patterns</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-semibold transition",
              activeFilter === f.id
                ? "bg-astra-500 text-white"
                : "border border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Pattern cards */}
      <div className="space-y-2">
        {filtered.map((pattern) => {
          const cfg = PATTERN_TYPE_CONFIG[pattern.pattern_type] ?? PATTERN_TYPE_CONFIG.hook_style;
          const Icon = cfg.icon;
          const isExpanded = expandedId === pattern.id;
          const confidencePct = Math.round(pattern.confidence * 100);
          const confidenceColor = pattern.confidence >= 0.7 ? "bg-emerald-500" :
            pattern.confidence >= 0.4 ? "bg-amber-500" : "bg-red-500";

          return (
            <div key={pattern.id} className="border border-border rounded-2xl overflow-hidden bg-card">
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent/50 transition"
                onClick={() => setExpandedId(isExpanded ? null : pattern.id)}
              >
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", cfg.bg)}>
                  <Icon className={cn("w-4 h-4", cfg.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn("text-xs font-semibold", cfg.color)}>{cfg.label}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground capitalize">{pattern.source}</span>
                    {pattern.post_count > 1 && (
                      <span className="text-xs text-muted-foreground">· {pattern.post_count} posts</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-foreground truncate">{pattern.pattern_label}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className={cn("text-xs font-bold", pattern.confidence >= 0.7 ? "text-emerald-600" : pattern.confidence >= 0.4 ? "text-amber-600" : "text-red-500")}>
                      {confidencePct}%
                    </p>
                    <p className="text-xs text-muted-foreground">confidence</p>
                  </div>
                  <div className="w-1.5 h-8 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("w-full rounded-full transition-all", confidenceColor)}
                      style={{ height: `${confidencePct}%`, marginTop: `${100 - confidencePct}%` }}
                    />
                  </div>
                  {isExpanded
                    ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  }
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-border bg-muted/20 space-y-3">
                  {/* Pattern data preview */}
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    {Object.entries(pattern.pattern_data ?? {}).slice(0, 6).map(([key, value]) => (
                      <div key={key} className="flex gap-2 mb-1.5">
                        <span className="font-semibold text-foreground capitalize min-w-24 shrink-0">
                          {key.replace(/_/g, " ")}:
                        </span>
                        <span className="line-clamp-2">
                          {typeof value === "string" ? value :
                           Array.isArray(value) ? value.join(", ") :
                           JSON.stringify(value)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Performance stats */}
                  {(pattern.avg_views || pattern.avg_engagement) && (
                    <div className="flex gap-4 text-xs">
                      {pattern.avg_views && (
                        <span className="text-muted-foreground">
                          Avg views: <span className="font-semibold text-foreground">{pattern.avg_views.toLocaleString()}</span>
                        </span>
                      )}
                      {pattern.avg_engagement && (
                        <span className="text-muted-foreground">
                          Avg engagement: <span className="font-semibold text-foreground">{Math.round(pattern.avg_engagement * 100)}%</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Low confidence warning */}
                  {pattern.confidence < 0.4 && (
                    <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-500/10 rounded-lg px-3 py-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Low confidence — not currently used in generation. Provide more data to improve.
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.promise(deleteMutation.mutateAsync(pattern.id), {
                          loading: "Removing pattern…",
                          success: "Pattern removed",
                          error: "Failed to remove",
                        });
                      }}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove pattern
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
