"use client";

import { useState } from "react";
import { useTikTokScript, useUpdateTikTokScript } from "@/hooks/use-tiktok";
import { useContentMedia } from "@/hooks/use-content-media";
import { cn } from "@/lib/utils";
import {
  Music2, X, Save, Loader2, ChevronDown, ChevronUp,
  Play, Clock, Eye, Mic2, Type, Film, Sparkles, ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import type { TikTokScene } from "@/hooks/use-tiktok";

interface TikTokScriptEditorProps {
  contentId: string;
  brandId: string;
  onClose: () => void;
}

const FORMAT_LABELS: Record<string, string> = {
  talking_head: "Talking Head",
  voiceover_broll: "Voiceover + B-Roll",
  text_animation: "Text Animation",
  screen_recording: "Screen Recording",
  carousel_video: "Carousel",
  duet_template: "Duet Template",
};

const NARRATIVE_LABELS: Record<string, string> = {
  problem_solution: "Problem → Solution",
  listicle: "Listicle",
  story: "Story",
  tutorial: "Tutorial",
  reveal: "Reveal",
};

export function TikTokScriptEditor({ contentId, brandId, onClose }: TikTokScriptEditorProps) {
  const { data: script, isLoading } = useTikTokScript(contentId);
  const { data: mediaList = [] } = useContentMedia(contentId);
  const selectedMedia = mediaList.filter((m) => m.selected);
  const updateMutation = useUpdateTikTokScript(brandId);
  const [expandedScene, setExpandedScene] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);

  // Local editable state
  const [localHook, setLocalHook] = useState<string>("");
  const [localCaption, setLocalCaption] = useState<string>("");
  const [localCta, setLocalCta] = useState<string>("");
  const [localScenes, setLocalScenes] = useState<TikTokScene[]>([]);
  const [hasEdits, setHasEdits] = useState(false);

  // Init local state when script loads
  const [initialized, setInitialized] = useState(false);
  if (script && !initialized) {
    setLocalHook(script.hook);
    setLocalCaption(script.caption ?? "");
    setLocalCta(script.cta ?? "");
    setLocalScenes(script.scenes ?? []);
    setInitialized(true);
  }

  function markEdited() {
    setHasEdits(true);
  }

  function handleSave() {
    if (!script) return;
    toast.promise(
      updateMutation.mutateAsync({
        scriptId: script.id,
        updates: {
          hook: localHook,
          caption: localCaption,
          cta: localCta,
          scenes: localScenes,
        },
      }).then(() => setHasEdits(false)),
      { loading: "Saving script…", success: "Script saved ✓", error: "Failed to save" }
    );
  }

  function updateScene(index: number, field: keyof TikTokScene, value: string | number) {
    setLocalScenes((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    markEdited();
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-[#524D47]" />
      </div>
    );
  }

  if (!script) {
    return (
      <div className="text-center py-8 text-[#6E6860] text-sm">
        No TikTok script found for this content.
      </div>
    );
  }

  const totalDuration = localScenes.reduce((sum, s) => sum + (s.duration_sec ?? 0), 0);

  return (
    <div className="flex flex-col h-full max-h-[85vh] overflow-hidden rounded-sm bg-[#0D0B09] border border-[#2A2520]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2A2520] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-sm bg-[#1F1B17] border border-[#2A2520] flex items-center justify-center">
            <Music2 className="w-3.5 h-3.5 text-[#6E6860]" />
          </div>
          <div>
            <p className="font-medium text-[#F5F2EE] text-sm">TikTok Script Editor</p>
            <p className="text-xs text-[#524D47]">
              {FORMAT_LABELS[script.format] ?? script.format} ·{" "}
              {NARRATIVE_LABELS[script.narrative_arc] ?? script.narrative_arc} ·{" "}
              ~{totalDuration}s
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasEdits && (
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex items-center gap-1.5 text-xs font-medium bg-[#C8843A] hover:bg-[#DE913A] text-[#0D0B09] px-3 py-1.5 rounded-sm transition-colors disabled:opacity-50"
            >
              {updateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Save
            </button>
          )}
          <button
            onClick={onClose}
            className="text-[#524D47] hover:text-[#B8B2A9] transition-colors p-1.5 rounded-sm hover:bg-[#1F1B17]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Media preview — thumbnails / cover images */}
        {mediaList.length > 0 && (
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em]">
              <ImageIcon className="w-3.5 h-3.5" /> Media ({selectedMedia.length} selected)
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {mediaList.map((m) => {
                const isVid = /\.(mp4|webm|mov)(\?|$)/i.test(m.public_url);
                return (
                  <div
                    key={m.id}
                    className={cn(
                      "relative rounded-sm overflow-hidden shrink-0 border-2 transition-colors",
                      m.selected ? "border-[#C8843A]" : "border-[#2A2520] opacity-60",
                      isVid
                        ? "w-16 h-16 bg-[#0D0B09] flex items-center justify-center"
                        : "w-16 h-16"
                    )}
                  >
                    {isVid ? (
                      <Film className="w-6 h-6 text-[#524D47]" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.public_url} alt="Media" className="w-full h-full object-cover" />
                    )}
                    {m.selected && (
                      <div className="absolute top-0.5 right-0.5">
                        <div className="w-3 h-3 rounded-sm bg-[#C8843A]" />
                      </div>
                    )}
                    <div className="absolute bottom-0.5 left-0.5">
                      <span className="text-[9px] font-bold bg-black/60 text-white px-1 rounded-sm">
                        {m.type === "generated" ? "AI" : isVid ? "🎥" : "↑"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            {selectedMedia.length === 0 && (
              <p className="text-xs text-[#524D47]">No media selected — select in the Upload/Generate panel below</p>
            )}
          </div>
        )}

        {/* Hook */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em]">
            <Sparkles className="w-3.5 h-3.5 text-[#C8843A]" /> Hook (0–3s)
          </label>
          <textarea
            value={localHook}
            onChange={(e) => { setLocalHook(e.target.value); markEdited(); }}
            rows={2}
            className="w-full px-3 py-2.5 rounded-sm border border-[#3A3530] bg-[#161310] text-sm text-[#F5F2EE] placeholder:text-[#524D47] focus:border-[#C8843A] focus:outline-none transition-colors resize-none font-medium"
          />
          <p className="text-xs text-[#524D47]">
            Hook type: <span className="font-medium text-[#B8B2A9]">{script.hook_type}</span> ·
            Concept: <span className="font-medium text-[#B8B2A9]">{script.concept}</span>
          </p>
        </div>

        {/* Full script */}
        {script.full_script && (
          <details className="group">
            <summary className="flex items-center gap-1.5 text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] cursor-pointer list-none">
              <Film className="w-3.5 h-3.5" /> Full Script
              <ChevronDown className="w-3.5 h-3.5 ml-auto group-open:rotate-180 transition-transform" />
            </summary>
            <div className="mt-2 px-3 py-2.5 rounded-sm bg-[#1F1B17] border border-[#2A2520] text-sm text-[#B8B2A9] leading-relaxed whitespace-pre-wrap">
              {script.full_script}
            </div>
          </details>
        )}

        {/* Scenes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em]">
              <Play className="w-3.5 h-3.5 text-[#524D47]" /> Scenes ({localScenes.length})
            </label>
            <span className="text-xs text-[#524D47]">
              <Clock className="w-3 h-3 inline mr-0.5" />{totalDuration}s total
            </span>
          </div>

          {localScenes.map((scene, i) => (
            <div key={i} className="border border-[#2A2520] rounded-sm overflow-hidden">
              <button
                onClick={() => setExpandedScene(expandedScene === i ? null : i)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#161310] hover:bg-[#1F1B17] transition-colors text-left"
              >
                <div className="w-6 h-6 rounded-sm bg-[#1F1B17] border border-[#2A2520] flex items-center justify-center shrink-0">
                  <span className="text-xs font-medium text-[#6E6860]">{scene.order}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#F5F2EE] truncate">{scene.voiceover?.slice(0, 60)}…</p>
                  <p className="text-xs text-[#524D47]">{scene.duration_sec}s · {scene.visual_direction?.slice(0, 40)}</p>
                </div>
                <span className="text-xs text-[#524D47]">{scene.duration_sec}s</span>
                {expandedScene === i
                  ? <ChevronUp className="w-4 h-4 text-[#524D47] shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-[#524D47] shrink-0" />
                }
              </button>

              {expandedScene === i && (
                <div className="px-4 pb-4 pt-3 border-t border-[#2A2520] bg-[#0D0B09] space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-[#B8B2A9] uppercase tracking-[0.06em] mb-1.5 block">Duration (sec)</label>
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={scene.duration_sec}
                        onChange={(e) => updateScene(i, "duration_sec", parseInt(e.target.value) || 1)}
                        className="h-10 px-3 bg-[#161310] border border-[#3A3530] rounded-sm text-sm text-[#F5F2EE] focus:border-[#C8843A] focus:outline-none transition-colors w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#B8B2A9] uppercase tracking-[0.06em] mb-1.5 block">Transition</label>
                      <select
                        value={scene.transition ?? "cut"}
                        onChange={(e) => updateScene(i, "transition", e.target.value)}
                        className="h-10 px-3 bg-[#161310] border border-[#3A3530] rounded-sm text-sm text-[#F5F2EE] focus:border-[#C8843A] focus:outline-none transition-colors w-full"
                      >
                        {["cut", "zoom", "swipe", "fade", "none"].map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-xs font-medium text-[#B8B2A9] uppercase tracking-[0.06em] mb-1.5">
                      <Eye className="w-3 h-3" /> Visual direction
                    </label>
                    <input
                      value={scene.visual_direction ?? ""}
                      onChange={(e) => updateScene(i, "visual_direction", e.target.value)}
                      className="h-10 px-3 bg-[#161310] border border-[#3A3530] rounded-sm text-sm text-[#F5F2EE] placeholder:text-[#524D47] focus:border-[#C8843A] focus:outline-none transition-colors w-full"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-xs font-medium text-[#B8B2A9] uppercase tracking-[0.06em] mb-1.5">
                      <Mic2 className="w-3 h-3" /> Voiceover
                    </label>
                    <textarea
                      value={scene.voiceover ?? ""}
                      onChange={(e) => updateScene(i, "voiceover", e.target.value)}
                      rows={2}
                      className="px-3 py-2.5 bg-[#161310] border border-[#3A3530] rounded-sm text-sm text-[#F5F2EE] placeholder:text-[#524D47] focus:border-[#C8843A] focus:outline-none transition-colors resize-none w-full"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-xs font-medium text-[#B8B2A9] uppercase tracking-[0.06em] mb-1.5">
                      <Type className="w-3 h-3" /> On-screen text overlay
                    </label>
                    <input
                      value={scene.text_overlay ?? ""}
                      onChange={(e) => updateScene(i, "text_overlay", e.target.value)}
                      placeholder="Text shown on screen (optional)"
                      className="h-10 px-3 bg-[#161310] border border-[#3A3530] rounded-sm text-sm text-[#F5F2EE] placeholder:text-[#524D47] focus:border-[#C8843A] focus:outline-none transition-colors w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Caption */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] block">Caption</label>
          <textarea
            value={localCaption}
            onChange={(e) => { setLocalCaption(e.target.value); markEdited(); }}
            rows={4}
            maxLength={2200}
            className="w-full px-3 py-2.5 rounded-sm border border-[#3A3530] bg-[#161310] text-sm text-[#F5F2EE] placeholder:text-[#524D47] focus:border-[#C8843A] focus:outline-none transition-colors resize-none"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#524D47]">
              Hashtags: {script.hashtags?.map((h) => (
                <span key={h} className="text-[#C8843A] mr-1">{h}</span>
              ))}
            </p>
            <span className={cn(
              "text-xs font-mono",
              localCaption.length > 2100 ? "text-red-400" : "text-[#524D47]"
            )}>
              {localCaption.length}/2200
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] block">Call to action</label>
          <input
            value={localCta}
            onChange={(e) => { setLocalCta(e.target.value); markEdited(); }}
            placeholder="e.g. Link in bio for the full guide"
            className="h-10 px-3 bg-[#161310] border border-[#3A3530] rounded-sm text-sm text-[#F5F2EE] placeholder:text-[#524D47] focus:border-[#C8843A] focus:outline-none transition-colors w-full"
          />
        </div>

        {/* Production notes */}
        {(script.music_suggestion || script.visual_style) && (
          <div className="bg-[#1F1B17] border border-[#2A2520] rounded-sm p-4 space-y-2">
            <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em]">Production notes</p>
            {script.visual_style && (
              <p className="text-xs text-[#B8B2A9]"><span className="font-medium text-[#F5F2EE]">Visual style:</span> {script.visual_style}</p>
            )}
            {script.music_suggestion && (
              <p className="text-xs text-[#B8B2A9]"><span className="font-medium text-[#F5F2EE]">Music:</span> {script.music_suggestion}</p>
            )}
          </div>
        )}

        {/* Duet/Stitch info */}
        {script.response_type && (
          <div className="bg-[#141824] border border-blue-500/20 rounded-sm p-4 space-y-1.5">
            <p className="text-xs font-medium text-blue-400 uppercase tracking-[0.06em]">
              {script.response_type === "duet" ? "Duet" : "Stitch"} Response
            </p>
            {script.original_creator && (
              <p className="text-xs text-[#B8B2A9]">Responding to: <span className="font-medium text-[#F5F2EE]">{script.original_creator}</span></p>
            )}
            {script.original_claim && (
              <p className="text-xs text-[#6E6860]">Claim: &ldquo;{script.original_claim}&rdquo;</p>
            )}
            {script.stitch_clip_start_sec != null && (
              <p className="text-xs text-[#6E6860]">
                Clip: {script.stitch_clip_start_sec}s → {script.stitch_clip_end_sec}s
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
