"use client";

import { useState } from "react";
import { useTikTokMemory, useDeleteTikTokPattern } from "@/hooks/use-tiktok";
import { cn } from "@/lib/utils";
import {
  Sparkles, Trash2, ChevronDown, ChevronUp, Loader2,
  TrendingUp, Target, Mic2, Clock, Users, MessageSquare,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

const PATTERN_TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  hook_style: { label: "Hook Style", icon: Sparkles, color: "text-[#C8843A]" },
  format: { label: "Format", icon: TrendingUp, color: "text-blue-400" },
  topic_cluster: { label: "Topic", icon: Target, color: "text-purple-400" },
  cta_style: { label: "CTA Style", icon: MessageSquare, color: "text-emerald-400" },
  duration: { label: "Duration", icon: Clock, color: "text-[#C8843A]" },
  audience_signal: { label: "Audience", icon: Users, color: "text-teal-400" },
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
        <Loader2 className="w-5 h-5 animate-spin text-[#524D47]" />
      </div>
    );
  }

  if (patterns.length === 0) {
    return (
      <div className="text-center py-10 border border-dashed border-[#3A3530] rounded-sm text-[#6E6860]">
        <Sparkles className="w-7 h-7 mx-auto mb-2 text-[#524D47]" />
        <p className="font-medium text-[#B8B2A9] text-sm">No patterns yet</p>
        <p className="text-xs mt-1 text-[#524D47]">Import your TikTok history to extract patterns</p>
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
              "px-2.5 py-1 rounded-sm text-xs font-medium transition-colors border",
              activeFilter === f.id
                ? "bg-[#C8843A] text-[#0D0B09] border-[#C8843A]"
                : "border-[#3A3530] text-[#6E6860] hover:border-[#524D47] hover:text-[#B8B2A9]"
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
          const confidenceBarColor = pattern.confidence >= 0.7
            ? "bg-emerald-500"
            : pattern.confidence >= 0.4
              ? "bg-[#C8843A]"
              : "bg-red-500";
          const confidenceTextColor = pattern.confidence >= 0.7
            ? "text-emerald-400"
            : pattern.confidence >= 0.4
              ? "text-[#C8843A]"
              : "text-red-400";

          return (
            <div key={pattern.id} className="border border-[#2A2520] rounded-sm overflow-hidden bg-[#161310]">
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#1F1B17] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : pattern.id)}
              >
                <div className="w-7 h-7 rounded-sm bg-[#1F1B17] border border-[#2A2520] flex items-center justify-center shrink-0">
                  <Icon className={cn("w-3.5 h-3.5", cfg.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn("text-[10px] font-medium uppercase tracking-[0.06em]", cfg.color)}>{cfg.label}</span>
                    <span className="text-[10px] text-[#524D47]">·</span>
                    <span className="text-[10px] text-[#524D47] capitalize">{pattern.source}</span>
                    {pattern.post_count > 1 && (
                      <span className="text-[10px] text-[#524D47]">· {pattern.post_count} posts</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-[#F5F2EE] truncate">{pattern.pattern_label}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className={cn("text-xs font-medium", confidenceTextColor)}>
                      {confidencePct}%
                    </p>
                    <p className="text-[10px] text-[#524D47]">confidence</p>
                  </div>
                  <div className="w-1 h-8 bg-[#1F1B17] border border-[#2A2520] rounded-sm overflow-hidden">
                    <div
                      className={cn("w-full transition-all", confidenceBarColor)}
                      style={{ height: `${confidencePct}%`, marginTop: `${100 - confidencePct}%` }}
                    />
                  </div>
                  {isExpanded
                    ? <ChevronUp className="w-4 h-4 text-[#524D47]" />
                    : <ChevronDown className="w-4 h-4 text-[#524D47]" />
                  }
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 pt-3 border-t border-[#2A2520] bg-[#0D0B09] space-y-3">
                  {/* Pattern data preview */}
                  <div className="text-xs text-[#6E6860] leading-relaxed">
                    {Object.entries(pattern.pattern_data ?? {}).slice(0, 6).map(([key, value]) => (
                      <div key={key} className="flex gap-2 mb-1.5">
                        <span className="font-medium text-[#B8B2A9] capitalize min-w-24 shrink-0">
                          {key.replace(/_/g, " ")}:
                        </span>
                        <span className="line-clamp-2 text-[#6E6860]">
                          {typeof value === "string" ? value :
                           Array.isArray(value) ? value.join(", ") :
                           JSON.stringify(value)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Performance stats */}
                  {(pattern.avg_views || pattern.avg_engagement) && (
                    <div className="flex gap-4 text-xs border-t border-[#2A2520] pt-3">
                      {pattern.avg_views && (
                        <span className="text-[#524D47]">
                          Avg views: <span className="font-medium text-[#B8B2A9]">{pattern.avg_views.toLocaleString()}</span>
                        </span>
                      )}
                      {pattern.avg_engagement && (
                        <span className="text-[#524D47]">
                          Avg engagement: <span className="font-medium text-[#B8B2A9]">{Math.round(pattern.avg_engagement * 100)}%</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Low confidence warning */}
                  {pattern.confidence < 0.4 && (
                    <div className="flex items-center gap-2 text-xs text-[#C8843A] bg-[#1F1B17] border border-[#C8843A]/20 rounded-sm px-3 py-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Low confidence — not currently used in generation. Provide more data to improve.
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.promise(deleteMutation.mutateAsync(pattern.id), {
                          loading: "Removing pattern…",
                          success: "Pattern removed",
                          error: "Failed to remove",
                        });
                      }}
                      className="flex items-center gap-1.5 text-xs text-[#524D47] hover:text-red-400 transition-colors"
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
