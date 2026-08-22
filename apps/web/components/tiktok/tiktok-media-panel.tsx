"use client";

import { useRef, useState } from "react";
import {
  useContentMedia, useUploadMedia, useDeleteMedia,
  useUpdateMedia, useGenerateMedia, type ContentMedia,
} from "@/hooks/use-content-media";
import { cn } from "@/lib/utils";
import {
  Upload, Sparkles, Trash2, CheckCircle2, Loader2, Eye, Video,
  ImageIcon, AlertCircle, Film, Grid, X
} from "lucide-react";
import { toast } from "sonner";

// ── TikTok content type → media mode ─────────────────────────────────────────

type MediaMode = "video" | "images" | "carousel";

function getMediaMode(format?: string): MediaMode {
  if (!format) return "video";
  const imageFormats = ["carousel_video", "photo", "image_post"];
  if (imageFormats.includes(format)) return format === "carousel_video" ? "carousel" : "images";
  return "video"; // talking_head, voiceover_broll, text_animation, screen_recording
}

const MODE_CONFIG: Record<MediaMode, {
  label: string;
  icon: React.ElementType;
  accept: string;
  maxFiles: number;
  hint: string;
  note: string;
}> = {
  video: {
    label: "Upload video",
    icon: Video,
    accept: "video/mp4,video/webm,video/mov,video/quicktime",
    maxFiles: 1,
    hint: "MP4, MOV, WebM · max 4GB · 3s–10min",
    note: "Video will be sent to your TikTok Inbox for editing before posting.",
  },
  images: {
    label: "Upload image",
    icon: ImageIcon,
    accept: "image/jpeg,image/jpg,image/png,image/webp",
    maxFiles: 1,
    hint: "JPEG, PNG, WebP · 9:16 recommended",
    note: "Image will be posted as a TikTok photo post.",
  },
  carousel: {
    label: "Upload images (carousel)",
    icon: Grid,
    accept: "image/jpeg,image/jpg,image/png,image/webp",
    maxFiles: 10,
    hint: "Up to 10 images · JPEG or PNG · 9:16 recommended",
    note: "Images will be posted as a TikTok photo carousel (2–10 images).",
  },
};

interface TikTokMediaPanelProps {
  contentId: string;
  contentBody?: string;
  format?: string;
  brandId?: string;
}

export function TikTokMediaPanel({
  contentId,
  contentBody,
  format,
}: TikTokMediaPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState("");

  const { data: mediaList = [], isLoading } = useContentMedia(contentId);
  const uploadMutation = useUploadMedia(contentId);
  const generateMutation = useGenerateMedia(contentId);
  const deleteMutation = useDeleteMedia(contentId);
  const updateMutation = useUpdateMedia(contentId);

  const mode = getMediaMode(format);
  const cfg = MODE_CONFIG[mode];
  const Icon = cfg.icon;

  function handleGenerate() {
    const prompt = generatePrompt.trim() || undefined;
    toast.promise(
      generateMutation.mutateAsync({ prompt }).then((res) => {
        setShowGenerateForm(false);
        setGeneratePrompt("");
        return res;
      }),
      {
        loading: "Generating AI image…",
        success: "AI image generated ✓",
        error: (err) => err.message,
      }
    );
  }

  // For video mode: look for video files; for image modes: look for images
  const videoMedia = mediaList.filter((m) =>
    m.public_url?.match(/\.(mp4|webm|mov)(\?|$)/i)
  );
  const imageMedia = mediaList.filter((m) =>
    !m.public_url?.match(/\.(mp4|webm|mov)(\?|$)/i)
  );
  // In video mode: show video files; also show any thumbnail/generated images separately
  const relevantMedia = mode === "video" ? videoMedia : imageMedia;
  const selectedMedia = mediaList.filter((m) => m.selected);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    // Validate video size (4GB max)
    if (mode === "video") {
      const oversized = files.find((f) => f.size > 4 * 1024 * 1024 * 1024);
      if (oversized) {
        toast.error("Video must be under 4GB");
        return;
      }
    }

    files.forEach((file) => {
      toast.promise(uploadMutation.mutateAsync({ file }), {
        loading: `Uploading ${file.name}…`,
        success: mode === "video" ? "Video uploaded ✓" : "Image uploaded ✓",
        error: (err) => err.message,
      });
    });
    e.target.value = "";
  }

  function toggleSelect(media: ContentMedia) {
    toast.promise(
      updateMutation.mutateAsync({ mediaId: media.id, updates: { selected: !media.selected } }),
      { loading: "Updating…", success: media.selected ? "Deselected" : "Selected", error: (e) => e.message }
    );
  }

  return (
    <div className="space-y-3">
      {/* Note */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl px-3 py-2">
        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#EE1D52]" />
        <span>{cfg.note}</span>
      </div>

      {/* Upload + Generate buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMutation.isPending || (mode === "video" && videoMedia.length >= 1)}
          className="flex items-center gap-1.5 text-xs font-semibold border border-[#EE1D52]/30 hover:border-[#EE1D52] text-[#EE1D52] hover:bg-[#EE1D52]/5 px-3 py-2 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploadMutation.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          {cfg.label}
        </button>

        {/* AI image generation — always available (thumbnail, cover, photo post) */}
        <button
          onClick={() => setShowGenerateForm((v) => !v)}
          disabled={generateMutation.isPending}
          className="flex items-center gap-1.5 text-xs font-semibold bg-astra-500 hover:bg-astra-600 text-white px-3 py-2 rounded-xl transition disabled:opacity-50"
        >
          {generateMutation.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          {mode === "video" ? "Generate thumbnail" : "Generate image"}
        </button>
        <span className="text-xs text-muted-foreground">{cfg.hint}</span>
      </div>

      {/* AI generate form — always available */}
      {showGenerateForm && (
        <div className="bg-astra-500/5 border border-astra-500/20 rounded-xl p-3 space-y-2.5">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-astra-500" />
            AI Image — Claude writes brief, Pollinations renders
          </p>
          <textarea
            value={generatePrompt}
            onChange={(e) => setGeneratePrompt(e.target.value)}
            rows={2}
            placeholder="Optional: describe the image. Leave blank to generate from content context."
            className="w-full px-3 py-2 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-astra-500 hover:bg-astra-600 text-white transition disabled:opacity-50"
            >
              {generateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {generateMutation.isPending ? "Generating…" : "Generate"}
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

      <input
        ref={fileInputRef}
        type="file"
        multiple={cfg.maxFiles > 1}
        accept={cfg.accept}
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Media grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-16">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : relevantMedia.length === 0 ? (
        <div
          className="border-2 border-dashed border-[#EE1D52]/20 rounded-xl p-6 text-center cursor-pointer hover:border-[#EE1D52]/40 transition"
          onClick={() => fileInputRef.current?.click()}
        >
          <Icon className="w-8 h-8 mx-auto mb-2 text-[#EE1D52] opacity-40" />
          <p className="text-xs text-muted-foreground">
            {mode === "video" ? "Click to upload your TikTok video" : "Click to upload images"}
          </p>
        </div>
      ) : mode === "video" ? (
        // Video display
        <div className="space-y-2">
          {videoMedia.map((media) => (
            <div key={media.id} className={cn(
              "flex items-center gap-3 p-3 rounded-xl border transition",
              media.selected ? "border-[#EE1D52]/30 bg-[#EE1D52]/5" : "border-border bg-card"
            )}>
              <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center shrink-0 overflow-hidden">
                <Film className="w-5 h-5 text-white/60" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  {media.storage_path?.split("/").pop() ?? "video"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {media.selected ? "✓ Selected for TikTok" : "Not selected"}
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => toggleSelect(media)}
                  className={cn(
                    "text-xs font-semibold px-2.5 py-1 rounded-lg transition",
                    media.selected
                      ? "bg-[#EE1D52]/10 text-[#EE1D52]"
                      : "border border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {media.selected ? "✓ Selected" : "Select"}
                </button>
                <button
                  onClick={() => toast.promise(deleteMutation.mutateAsync(media.id), {
                    loading: "Deleting…", success: "Deleted", error: "Failed"
                  })}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {videoMedia.filter(m => m.selected).length === 0 && videoMedia.length > 0 && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Select a video to enable TikTok publishing
            </p>
          )}
          {/* Thumbnails / cover images (generated or uploaded images in video mode) */}
          {imageMedia.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground">Thumbnails / Cover images ({imageMedia.length})</p>
              <div className="grid grid-cols-4 gap-2">
                {imageMedia.map((media) => (
                  <div
                    key={media.id}
                    className={cn(
                      "relative rounded-lg overflow-hidden border-2 aspect-square bg-muted group cursor-pointer transition",
                      media.selected ? "border-[#EE1D52]" : "border-transparent"
                    )}
                    onClick={() => toggleSelect(media)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={media.public_url} alt="Thumbnail" className="w-full h-full object-cover" />
                    <div className="absolute top-0.5 left-0.5">
                      <span className="text-[9px] font-bold px-1 py-0.5 rounded-full bg-astra-500 text-white">
                        {media.type === "generated" ? "AI" : "↑"}
                      </span>
                    </div>
                    {media.selected && (
                      <div className="absolute top-0.5 right-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#EE1D52] bg-white rounded-full" />
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.promise(deleteMutation.mutateAsync(media.id), {
                          loading: "Deleting…", success: "Deleted", error: "Failed"
                        });
                      }}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        // Image grid (carousel / single image)
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            {imageMedia.slice(0, cfg.maxFiles).map((media) => (
              <div
                key={media.id}
                className={cn(
                  "relative rounded-xl overflow-hidden border-2 aspect-[9/16] bg-muted group cursor-pointer transition",
                  media.selected ? "border-[#EE1D52]" : "border-transparent"
                )}
                onClick={() => toggleSelect(media)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={media.public_url}
                  alt="TikTok image"
                  className="w-full h-full object-cover"
                />
                {media.selected && (
                  <div className="absolute top-1 right-1">
                    <CheckCircle2 className="w-4 h-4 text-[#EE1D52] bg-white rounded-full" />
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.promise(deleteMutation.mutateAsync(media.id), {
                      loading: "Deleting…", success: "Deleted", error: "Failed"
                    });
                  }}
                  className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition w-5 h-5 rounded-full bg-black/50 flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
          {mode === "carousel" && (
            <p className="text-xs text-muted-foreground">
              {imageMedia.length} image{imageMedia.length !== 1 ? "s" : ""} · {selectedMedia.length} selected
              {imageMedia.length < 2 && " · carousel requires at least 2 images"}
            </p>
          )}
        </div>
      )}

      {/* Fullscreen image preview */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Preview" className="max-w-full max-h-full rounded-xl object-contain" />
        </div>
      )}
    </div>
  );
}
