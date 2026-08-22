"use client";

import { useRef, useState } from "react";
import {
  useContentMedia,
  useUploadMedia,
  useGenerateMedia,
  useUpdateMedia,
  useDeleteMedia,
  type ContentMedia,
} from "@/hooks/use-content-media";
import { cn } from "@/lib/utils";
import {
  Upload, Sparkles, Trash2, CheckCircle2, Loader2,
  RotateCcw, ImageIcon, AlertCircle, Eye
} from "lucide-react";
import { toast } from "sonner";

interface MediaPanelProps {
  contentId: string;
  contentBody?: string;
  contentHook?: string;
  platform?: string;
}

export function MediaPanel({ contentId, contentBody, contentHook, platform }: MediaPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: mediaList = [], isLoading } = useContentMedia(contentId);
  const uploadMutation = useUploadMedia(contentId);
  const generateMutation = useGenerateMedia(contentId);
  const updateMutation = useUpdateMedia(contentId);
  const deleteMutation = useDeleteMedia(contentId);

  const selectedMedia = mediaList.filter((m) => m.selected);

  // ── Upload handler ────────────────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    files.forEach((file) => {
      toast.promise(
        uploadMutation.mutateAsync({ file }),
        {
          loading: `Uploading ${file.name}…`,
          success: "Image uploaded",
          error: (err) => err.message,
        }
      );
    });
    // Reset input so same file can be re-uploaded
    e.target.value = "";
  }

  // ── Generate handler ──────────────────────────────────────────────────────
  async function handleGenerate() {
    const prompt = generatePrompt.trim() || undefined;
    toast.promise(
      generateMutation.mutateAsync({ prompt }).then((res) => {
        if (res.reference_note) {
          toast.info(res.reference_note, { duration: 6000 });
        }
        setShowGenerateForm(false);
        setGeneratePrompt("");
        return res;
      }),
      {
        loading: "Generating image with AI…",
        success: "Image generated",
        error: (err) => err.message,
      }
    );
  }

  // ── Toggle select ─────────────────────────────────────────────────────────
  function toggleSelect(media: ContentMedia) {
    toast.promise(
      updateMutation.mutateAsync({
        mediaId: media.id,
        updates: { selected: !media.selected },
      }),
      {
        loading: "Updating…",
        success: media.selected ? "Image deselected" : "Image selected",
        error: (err) => err.message,
      }
    );
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  function handleDelete(mediaId: string) {
    toast.promise(
      deleteMutation.mutateAsync(mediaId),
      {
        loading: "Deleting…",
        success: "Image deleted",
        error: (err) => err.message,
      }
    );
  }

  const isGenerating = generateMutation.isPending;
  const isUploading = uploadMutation.isPending;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">
            Media
            {selectedMedia.length > 0 && (
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                ({selectedMedia.length} selected)
              </span>
            )}
          </span>
        </div>
        <div className="flex gap-2">
          {/* Upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-accent transition disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            Upload
          </button>
          {/* Generate button */}
          <button
            onClick={() => setShowGenerateForm((v) => !v)}
            disabled={isGenerating}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-astra-500 hover:bg-astra-600 text-white transition disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Generate
          </button>
        </div>
      </div>

      {/* Hidden file input — multiple */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/mov,video/quicktime"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* AI generate form */}
      {showGenerateForm && (
        <div className="bg-astra-500/5 border border-astra-500/20 rounded-xl p-4 space-y-3">
          <p className="text-xs font-medium text-foreground">
            AI Image Generation
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              — generates from content context + optional custom prompt
            </span>
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-2 text-xs text-amber-800">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              <strong>Reference image (image-to-image)</strong> is not supported on the current free tier of Google Imagen. Text-to-image only. Regenerating does not overwrite previous images.
            </span>
          </div>
          <textarea
            value={generatePrompt}
            onChange={(e) => setGeneratePrompt(e.target.value)}
            rows={2}
            placeholder="Optional: describe the image you want (leave blank to generate from content context)"
            className="w-full px-3 py-2 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-astra-500 hover:bg-astra-600 text-white transition disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {isGenerating ? "Generating…" : "Generate image"}
            </button>
            <button
              onClick={() => { setShowGenerateForm(false); setGeneratePrompt(""); }}
              className="text-xs text-muted-foreground hover:text-foreground transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Media grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-20">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : mediaList.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-40" />
          <p className="text-xs text-muted-foreground">No images yet. Upload or generate one above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {mediaList.map((media) => (
            <div
              key={media.id}
              className={cn(
                "relative rounded-xl overflow-hidden border-2 transition group aspect-square bg-muted",
                media.selected ? "border-astra-500" : "border-transparent"
              )}
            >
              {/* Thumbnail */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={media.public_url}
                alt={media.alt_text ?? "Content image"}
                className="w-full h-full object-cover"
              />

              {/* Type badge */}
              <div className="absolute top-1 left-1">
                <span className={cn(
                  "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                  media.type === "generated"
                    ? "bg-astra-500 text-white"
                    : "bg-black/60 text-white"
                )}>
                  {media.type === "generated" ? "AI" : "↑"}
                </span>
              </div>

              {/* Selected indicator */}
              {media.selected && (
                <div className="absolute top-1 right-1">
                  <CheckCircle2 className="w-4 h-4 text-astra-500 bg-white rounded-full" />
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                {/* Preview */}
                <button
                  onClick={() => setPreviewUrl(media.public_url)}
                  className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
                  title="Preview"
                >
                  <Eye className="w-3.5 h-3.5 text-white" />
                </button>
                {/* Select / deselect */}
                <button
                  onClick={() => toggleSelect(media)}
                  className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
                  title={media.selected ? "Deselect" : "Select"}
                >
                  <CheckCircle2 className={cn("w-3.5 h-3.5", media.selected ? "text-astra-400" : "text-white")} />
                </button>
                {/* Regenerate (generated only) */}
                {media.type === "generated" && (
                  <button
                    onClick={() => toast.promise(
                      generateMutation.mutateAsync({ prompt: media.prompt }),
                      { loading: "Regenerating…", success: "New variation generated", error: (e) => e.message }
                    )}
                    className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
                    title="Regenerate variation"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-white" />
                  </button>
                )}
                {/* Delete */}
                <button
                  onClick={() => handleDelete(media.id)}
                  className="w-7 h-7 rounded-full bg-red-500/80 hover:bg-red-600 flex items-center justify-center transition"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected count hint */}
      {mediaList.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Only <strong>selected</strong> images will be attached when publishing.
          {selectedMedia.length === 0 && " No images selected — post will be text-only."}
        </p>
      )}

      {/* Fullscreen preview modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Preview"
            className="max-w-full max-h-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
