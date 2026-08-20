"use client";

import { useState } from "react";
import { useTikTokScript, useUpdateTikTokScript } from "@/hooks/use-tiktok";
import { cn } from "@/lib/utils";
import {
  Music2, X, Save, Loader2, ChevronDown, ChevronUp,
  Play, Clock, Eye, Mic2, Type, Film, Sparkles
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
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!script) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No TikTok script found for this content.
      </div>
    );
  }

  const totalDuration = localScenes.reduce((sum, s) => sum + (s.duration_sec ?? 0), 0);

  return (
    <div className="flex flex-col h-full max-h-[85vh] overflow-hidden rounded-2xl bg-card border border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#EE1D52]/20 to-[#69C9D0]/20 flex items-center justify-center">
            <Music2 className="w-4 h-4 text-[#EE1D52]" />
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">TikTok Script Editor</p>
            <p className="text-xs text-muted-foreground">
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
              className="flex items-center gap-1.5 text-xs font-semibold bg-astra-500 hover:bg-astra-600 text-white px-3 py-1.5 rounded-lg transition disabled:opacity-50"
            >
              {updateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Save
            </button>
          )}
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition p-1.5 rounded-lg hover:bg-accent">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* Hook */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-[#EE1D52]" /> Hook (0–3s)
          </label>
          <textarea
            value={localHook}
            onChange={(e) => { setLocalHook(e.target.value); markEdited(); }}
            rows={2}
            className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#EE1D52]/30 resize-none font-semibold"
          />
          <p className="text-xs text-muted-foreground">
            Hook type: <span className="font-medium text-foreground">{script.hook_type}</span> ·
            Concept: <span className="font-medium text-foreground">{script.concept}</span>
          </p>
        </div>

        {/* Full script */}
        {script.full_script && (
          <details className="group">
            <summary className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wide cursor-pointer list-none">
              <Film className="w-3.5 h-3.5" /> Full Script
              <ChevronDown className="w-3.5 h-3.5 ml-auto group-open:rotate-180 transition-transform" />
            </summary>
            <div className="mt-2 px-3.5 py-2.5 rounded-xl bg-muted text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {script.full_script}
            </div>
          </details>
        )}

        {/* Scenes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wide">
              <Play className="w-3.5 h-3.5 text-blue-500" /> Scenes ({localScenes.length})
            </label>
            <span className="text-xs text-muted-foreground">
              <Clock className="w-3 h-3 inline mr-0.5" />{totalDuration}s total
            </span>
          </div>

          {localScenes.map((scene, i) => (
            <div key={i} className="border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedScene(expandedScene === i ? null : i)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-card hover:bg-accent transition text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-muted-foreground">{scene.order}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{scene.voiceover?.slice(0, 60)}…</p>
                  <p className="text-xs text-muted-foreground">{scene.duration_sec}s · {scene.visual_direction?.slice(0, 40)}</p>
                </div>
                <span className="text-xs text-muted-foreground">{scene.duration_sec}s</span>
                {expandedScene === i
                  ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                }
              </button>

              {expandedScene === i && (
                <div className="px-4 pb-4 pt-2 border-t border-border bg-muted/30 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">Duration (sec)</label>
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={scene.duration_sec}
                        onChange={(e) => updateScene(i, "duration_sec", parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">Transition</label>
                      <select
                        value={scene.transition ?? "cut"}
                        onChange={(e) => updateScene(i, "transition", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none"
                      >
                        {["cut", "zoom", "swipe", "fade", "none"].map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-xs font-semibold text-muted-foreground mb-1">
                      <Eye className="w-3 h-3" /> Visual direction
                    </label>
                    <input
                      value={scene.visual_direction ?? ""}
                      onChange={(e) => updateScene(i, "visual_direction", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-xs font-semibold text-muted-foreground mb-1">
                      <Mic2 className="w-3 h-3" /> Voiceover
                    </label>
                    <textarea
                      value={scene.voiceover ?? ""}
                      onChange={(e) => updateScene(i, "voiceover", e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-xs font-semibold text-muted-foreground mb-1">
                      <Type className="w-3 h-3" /> On-screen text overlay
                    </label>
                    <input
                      value={scene.text_overlay ?? ""}
                      onChange={(e) => updateScene(i, "text_overlay", e.target.value)}
                      placeholder="Text shown on screen (optional)"
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Caption */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Caption</label>
          <textarea
            value={localCaption}
            onChange={(e) => { setLocalCaption(e.target.value); markEdited(); }}
            rows={4}
            maxLength={2200}
            className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Hashtags: {script.hashtags?.map((h) => <span key={h} className="text-[#EE1D52] mr-1">{h}</span>)}
            </p>
            <span className={cn("text-xs font-mono", localCaption.length > 2100 ? "text-red-500" : "text-muted-foreground")}>
              {localCaption.length}/2200
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Call to action</label>
          <input
            value={localCta}
            onChange={(e) => { setLocalCta(e.target.value); markEdited(); }}
            placeholder="e.g. Link in bio for the full guide"
            className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Production notes */}
        {(script.music_suggestion || script.visual_style) && (
          <div className="bg-muted/50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Production notes</p>
            {script.visual_style && (
              <p className="text-xs text-foreground"><span className="font-semibold">Visual style:</span> {script.visual_style}</p>
            )}
            {script.music_suggestion && (
              <p className="text-xs text-foreground"><span className="font-semibold">Music:</span> {script.music_suggestion}</p>
            )}
          </div>
        )}

        {/* Duet/Stitch info */}
        {script.response_type && (
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 space-y-1.5">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">
              {script.response_type === "duet" ? "Duet" : "Stitch"} Response
            </p>
            {script.original_creator && (
              <p className="text-xs text-foreground">Responding to: <span className="font-semibold">{script.original_creator}</span></p>
            )}
            {script.original_claim && (
              <p className="text-xs text-muted-foreground">Claim: "{script.original_claim}"</p>
            )}
            {script.stitch_clip_start_sec != null && (
              <p className="text-xs text-muted-foreground">
                Clip: {script.stitch_clip_start_sec}s → {script.stitch_clip_end_sec}s
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
