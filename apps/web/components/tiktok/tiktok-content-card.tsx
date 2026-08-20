"use client";

import { useState } from "react";
import { useTikTokScript } from "@/hooks/use-tiktok";
import { useApproveContent, useRejectContent, useDeleteContent } from "@/hooks/use-content";
import { TikTokScriptEditor } from "./tiktok-script-editor";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import {
  Music2, CheckCircle2, XCircle, Trash2, Edit3,
  Clock, Play, Loader2, X, Film
} from "lucide-react";
import { toast } from "sonner";
import type { ContentItem } from "@/hooks/use-content";

interface TikTokContentCardProps {
  item: ContentItem;
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20",
  published: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

const FORMAT_LABELS: Record<string, string> = {
  talking_head: "Talking Head",
  voiceover_broll: "Voiceover + B-Roll",
  text_animation: "Text Animation",
  screen_recording: "Screen Recording",
  carousel_video: "Carousel",
  duet_template: "Duet",
};

export function TikTokContentCard({ item }: TikTokContentCardProps) {
  const [showEditor, setShowEditor] = useState(false);
  const { data: script, isLoading: scriptLoading } = useTikTokScript(item.id);
  const approveMutation = useApproveContent(item.brand_id);
  const rejectMutation = useRejectContent(item.brand_id);
  const deleteMutation = useDeleteContent(item.brand_id);

  const aiMeta = item.ai_metadata as Record<string, unknown> | undefined;
  const format = (script?.format ?? aiMeta?.format ?? "talking_head") as string;
  const durationSec = (script?.duration_sec ?? aiMeta?.duration_sec ?? 30) as number;
  const isResponseType = !!(script?.response_type ?? aiMeta?.response_type);

  return (
    <>
      {/* Full-screen script editor modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <TikTokScriptEditor
              contentId={item.id}
              brandId={item.brand_id}
              onClose={() => setShowEditor(false)}
            />
          </div>
        </div>
      )}

      <div className={cn(
        "group bg-card border rounded-2xl p-4 space-y-3 transition hover:shadow-sm",
        item.status === "approved" ? "border-emerald-500/30" :
        item.status === "published" ? "border-blue-500/30" :
        "border-border"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#EE1D52]/15 to-[#69C9D0]/15 flex items-center justify-center">
              <Music2 className="w-4 h-4 text-[#EE1D52]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">TikTok</span>
                {isResponseType && (
                  <span className="text-xs bg-blue-500/10 text-blue-600 border border-blue-500/20 px-1.5 py-0.5 rounded-full font-semibold">
                    {script?.response_type === "duet" ? "Duet" : "Stitch"}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{formatRelativeTime(item.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Duration badge */}
            <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              <Clock className="w-3 h-3" />{durationSec}s
            </span>
            {/* Status badge */}
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-semibold border capitalize", STATUS_STYLES[item.status] ?? "bg-muted text-muted-foreground")}>
              {item.status}
            </span>
          </div>
        </div>

        {/* Hook preview */}
        {scriptLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" /> Loading script…
          </div>
        ) : script ? (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-[#EE1D52] uppercase tracking-wide flex items-center gap-1">
              <Play className="w-3 h-3" /> Hook
            </p>
            <p className="text-sm font-semibold text-foreground italic line-clamp-2">
              "{script.hook}"
            </p>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                <Film className="w-3 h-3 inline mr-0.5" />
                {FORMAT_LABELS[format] ?? format}
              </span>
              {script.scenes?.length > 0 && (
                <span className="text-xs text-muted-foreground">{script.scenes.length} scenes</span>
              )}
              {script.concept && (
                <span className="text-xs text-muted-foreground line-clamp-1 flex-1">{script.concept}</span>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <p className="text-sm text-foreground line-clamp-3 leading-relaxed">
              {item.hook && <span className="italic">"{item.hook}"</span>}
              {!item.hook && item.body && item.body.slice(0, 100)}
            </p>
          </div>
        )}

        {/* Hashtags */}
        {item.hashtags && item.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.hashtags.slice(0, 4).map((tag) => (
              <span key={tag} className="text-xs font-medium text-[#EE1D52]">
                #{tag.replace(/^#/, "")}
              </span>
            ))}
            {item.hashtags.length > 4 && (
              <span className="text-xs text-muted-foreground">+{item.hashtags.length - 4}</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5 pt-1.5 border-t border-border">
          <button
            onClick={() => setShowEditor(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-astra-500 hover:text-astra-600 bg-astra-500/10 hover:bg-astra-500/20 px-3 py-1.5 rounded-lg transition"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {script ? "Edit Script" : "View Script"}
          </button>

          {item.status === "draft" && (
            <>
              <button
                onClick={() => toast.promise(approveMutation.mutateAsync(item.id), {
                  loading: "Approving…", success: "Approved ✓", error: "Failed"
                })}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1.5 rounded-lg transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve
              </button>
              <button
                onClick={() => toast.promise(rejectMutation.mutateAsync(item.id), {
                  loading: "Rejecting…", success: "Rejected", error: "Failed"
                })}
                className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1.5 rounded-lg transition"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
            </>
          )}

          <button
            onClick={() => toast.promise(deleteMutation.mutateAsync(item.id), {
              loading: "Deleting…", success: "Deleted", error: "Failed"
            })}
            className="ml-auto flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-destructive transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}
