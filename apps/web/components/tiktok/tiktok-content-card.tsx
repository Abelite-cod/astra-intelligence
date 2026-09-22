"use client";

import { useState } from "react";
import { useTikTokScript } from "@/hooks/use-tiktok";
import { useContentMedia, useDeleteMedia, useUpdateMedia } from "@/hooks/use-content-media";
import { useApproveContent, useRejectContent, useDeleteContent } from "@/hooks/use-content";
import { TikTokScriptEditor } from "./tiktok-script-editor";
import { TikTokMediaPanel } from "./tiktok-media-panel";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import {
  Music2, CheckCircle2, XCircle, Trash2, Edit3,
  Clock, Play, Loader2, Film, ImageIcon,
  X
} from "lucide-react";
import { toast } from "sonner";
import type { ContentItem } from "@/hooks/use-content";

interface TikTokContentCardProps {
  item: ContentItem;
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-[#1F1B17] text-[#C8843A] border-[#C8843A]/30",
  approved: "bg-[#1A2420] text-emerald-500 border-emerald-500/30",
  rejected: "bg-[#1F1414] text-red-400 border-red-500/30",
  published: "bg-[#141824] text-blue-400 border-blue-500/30",
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
  const [mediaOpen, setMediaOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxIsVideo, setLightboxIsVideo] = useState(false);

  const { data: script, isLoading: scriptLoading } = useTikTokScript(item.id);
  const { data: mediaList = [] } = useContentMedia(item.id);
  const deleteMediaMutation = useDeleteMedia(item.id);
  const updateMediaMutation = useUpdateMedia(item.id);
  const approveMutation = useApproveContent(item.brand_id);
  const rejectMutation = useRejectContent(item.brand_id);
  const deleteMutation = useDeleteContent(item.brand_id);

  const isVideo = (url: string) => /\.(mp4|webm|mov)(\?|$)/i.test(url);

  function openLightbox(url: string) {
    setLightboxUrl(url);
    setLightboxIsVideo(isVideo(url));
  }

  const aiMeta = item.ai_metadata as Record<string, unknown> | undefined;
  const format = (script?.format ?? aiMeta?.format ?? "talking_head") as string;
  const durationSec = (script?.duration_sec ?? aiMeta?.duration_sec ?? 30) as number;
  const isResponseType = !!(script?.response_type ?? aiMeta?.response_type);

  return (
    <>
      {/* Full-screen script editor modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <TikTokScriptEditor
              contentId={item.id}
              brandId={item.brand_id}
              onClose={() => setShowEditor(false)}
            />
          </div>
        </div>
      )}

      <div className="border border-[#2A2520] rounded-sm bg-[#161310] overflow-hidden hover:border-[#3A3530] transition-colors">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#2A2520] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-sm bg-[#1F1B17] border border-[#2A2520] flex items-center justify-center">
              <Music2 className="w-3.5 h-3.5 text-[#6E6860]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#F5F2EE]">TikTok</span>
                {isResponseType && (
                  <span className="text-[10px] bg-[#141824] text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded-sm font-medium">
                    {script?.response_type === "duet" ? "Duet" : "Stitch"}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#524D47]">{formatRelativeTime(item.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Duration badge */}
            <span className="flex items-center gap-1 text-xs text-[#6E6860] bg-[#1F1B17] border border-[#2A2520] px-2 py-0.5 rounded-sm">
              <Clock className="w-3 h-3" />{durationSec}s
            </span>
            {/* Status badge */}
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded-sm font-medium border capitalize",
              STATUS_STYLES[item.status] ?? "bg-[#1F1B17] text-[#6E6860] border-[#2A2520]"
            )}>
              {item.status}
            </span>
          </div>
        </div>

        {/* Content body */}
        <div className="p-4 space-y-3">
          {/* Hook preview */}
          {scriptLoading ? (
            <div className="flex items-center gap-2 text-xs text-[#524D47]">
              <Loader2 className="w-3 h-3 animate-spin" /> Loading script…
            </div>
          ) : script ? (
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium text-[#6E6860] uppercase tracking-[0.06em] flex items-center gap-1">
                <Play className="w-3 h-3" /> Hook
              </p>
              <p className="text-sm font-medium text-[#F5F2EE] italic line-clamp-2">
                &ldquo;{script.hook}&rdquo;
              </p>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="text-[10px] text-[#6E6860] bg-[#1F1B17] border border-[#2A2520] px-1.5 py-0.5 rounded-sm">
                  <Film className="w-3 h-3 inline mr-0.5" />
                  {FORMAT_LABELS[format] ?? format}
                </span>
                {script.scenes?.length > 0 && (
                  <span className="text-[10px] text-[#524D47]">{script.scenes.length} scenes</span>
                )}
                {script.concept && (
                  <span className="text-[10px] text-[#524D47] line-clamp-1 flex-1">{script.concept}</span>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-sm text-[#B8B2A9] line-clamp-3 leading-relaxed">
                {item.hook && <span className="italic">&ldquo;{item.hook}&rdquo;</span>}
                {!item.hook && item.body && item.body.slice(0, 100)}
              </p>
            </div>
          )}

          {/* Hashtags */}
          {item.hashtags && item.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.hashtags.slice(0, 4).map((tag) => (
                <span key={tag} className="text-[10px] font-medium text-[#C8843A]">
                  #{tag.replace(/^#/, "")}
                </span>
              ))}
              {item.hashtags.length > 4 && (
                <span className="text-[10px] text-[#524D47]">+{item.hashtags.length - 4}</span>
              )}
            </div>
          )}

          {/* ── Inline media preview strip (always visible) ──────────── */}
          {mediaList.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium text-[#6E6860] uppercase tracking-[0.06em] flex items-center gap-1">
                <ImageIcon className="w-3 h-3" /> Media ({mediaList.length})
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {mediaList.map((m) => {
                  const isVid = isVideo(m.public_url);
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        "relative rounded-sm overflow-hidden border-2 cursor-pointer shrink-0",
                        m.selected ? "border-[#C8843A]" : "border-[#2A2520]",
                        isVid
                          ? "w-14 h-14 bg-[#0D0B09] flex items-center justify-center"
                          : "w-14 h-14"
                      )}
                      onClick={() => openLightbox(m.public_url)}
                      title={isVid ? "Click to preview video" : "Click to preview image"}
                    >
                      {isVid ? (
                        <Film className="w-5 h-5 text-[#524D47]" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.public_url} alt="Media" className="w-full h-full object-cover" />
                      )}
                      {/* Selected indicator */}
                      {m.selected && (
                        <div className="absolute top-0.5 right-0.5">
                          <div className="w-2.5 h-2.5 rounded-sm bg-[#C8843A]" />
                        </div>
                      )}
                      {/* Type badge */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[9px] text-white text-center font-bold py-0.5">
                        {isVid ? "🎥" : m.type === "generated" ? "AI" : "↑"}
                      </div>
                      {/* Toggle select on long press area — separate from preview */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toast.promise(
                            updateMediaMutation.mutateAsync({ mediaId: m.id, updates: { selected: !m.selected } }),
                            { loading: "…", success: m.selected ? "Deselected" : "Selected", error: "Failed" }
                          );
                        }}
                        className="absolute inset-0 opacity-0"
                        title={m.selected ? "Click to deselect" : "Click to select"}
                      />
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-[#524D47]">
                {mediaList.filter(m => m.selected).length} selected · click to preview · click badge to select/deselect
              </p>
            </div>
          )}

          {/* TikTok Media Panel (video or images depending on format) */}
          <div className="pt-1">
            <button
              onClick={() => setMediaOpen((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-sm transition-colors border mb-2",
                mediaOpen
                  ? "bg-[#1F1B17] text-[#C8843A] border-[#C8843A]/40"
                  : "border-[#3A3530] text-[#B8B2A9] hover:border-[#524D47] hover:text-[#F5F2EE]"
              )}
            >
              <Film className="w-3.5 h-3.5" />
              {mediaOpen ? "Hide media" : format === "carousel_video" ? "Upload images (carousel)" : "Upload video / image"}
            </button>
            {mediaOpen && (
              <div className="mb-3">
                <TikTokMediaPanel
                  contentId={item.id}
                  contentBody={item.body}
                  format={format}
                />
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-t border-[#2A2520]">
          <button
            onClick={() => setShowEditor(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-[#C8843A] hover:text-[#DE913A] bg-[#1F1B17] hover:bg-[#261F17] border border-[#C8843A]/20 hover:border-[#C8843A]/40 px-3 py-1.5 rounded-sm transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {script ? "Edit Script" : "View Script"}
          </button>

          {item.status === "draft" && (
            <>
              <button
                onClick={() => toast.promise(approveMutation.mutateAsync({ id: item.id, body: item.body }), {
                  loading: "Approving…", success: "Approved ✓", error: "Failed"
                })}
                className="flex items-center gap-1 text-xs font-medium text-emerald-500 hover:text-emerald-400 bg-[#1A2420] hover:bg-[#1F2E28] border border-emerald-500/20 hover:border-emerald-500/40 px-2.5 py-1.5 rounded-sm transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve
              </button>
              <button
                onClick={() => toast.promise(rejectMutation.mutateAsync(item.id), {
                  loading: "Rejecting…", success: "Rejected", error: "Failed"
                })}
                className="flex items-center gap-1 text-xs font-medium text-red-400 hover:text-red-300 bg-[#1F1414] hover:bg-[#2A1A1A] border border-red-500/20 hover:border-red-500/40 px-2.5 py-1.5 rounded-sm transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
            </>
          )}

          <button
            onClick={() => toast.promise(deleteMutation.mutateAsync(item.id), {
              loading: "Deleting…", success: "Deleted", error: "Failed"
            })}
            className="ml-auto flex items-center gap-1 text-xs font-medium text-[#524D47] hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 text-white bg-black/40 hover:bg-black/60 rounded-sm p-2 transition"
          >
            <X className="w-5 h-5" />
          </button>
          {lightboxIsVideo ? (
            <video
              src={lightboxUrl}
              controls
              autoPlay
              className="max-w-full max-h-full rounded-sm"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lightboxUrl}
              alt="Preview"
              className="max-w-full max-h-full rounded-sm object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </>
  );
}
