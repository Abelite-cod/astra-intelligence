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
  RotateCcw, ImageIcon, Eye, Film, X, Video
} from "lucide-react";
import { toast } from "sonner";

interface MediaPanelProps {
  contentId: string;
  contentBody?: string;
  contentHook?: string;
  platform?: string;
}

function isVideo(url: string) {
  return /\.(mp4|webm|mov|avi|m4v)(\?|$)/i.test(url);
}

function MediaThumbnail({
  media,
  onPreview,
  onSelect,
  onDelete,
  onRegenerate,
  isGenerating,
}: {
  media: ContentMedia;
  onPreview: (url: string) => void;
  onSelect: (m: ContentMedia) => void;
  onDelete: (id: string) => void;
  onRegenerate?: (m: ContentMedia) => void;
  isGenerating: boolean;
}) {
  const isVid = isVideo(media.public_url);

  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden border-2 transition group aspect-square bg-muted",
        media.selected ? "border-astra-500" : "border-transparent"
      )}
    >
      {isVid ? (
        /* Video thumbnail */
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 cursor-pointer"
          onClick={() => onPreview(media.public_url)}
        >
          <Film className="w-8 h-8 text-white/50 mb-1" />
          <span className="text-[10px] text-white/40 px-1 text-center truncate max-w-full">
            {media.storage_path?.split("/").pop()?.slice(0, 16) ?? "video"}
          </span>
        </div>
      ) : (
        /* Image thumbnail */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={media.public_url}
          alt={media.alt_text ?? "Media"}
          className="w-full h-full object-cover"
        />
      )}

      {/* Type badge */}
      <div className="absolute top-1 left-1 flex gap-1">
        <span className={cn(
          "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
          media.type === "generated" ? "bg-astra-500 text-white" : "bg-black/60 text-white"
        )}>
          {isVid ? "🎥" : media.type === "generated" ? "AI" : "↑"}
        </span>
      </div>

      {/* Selected indicator */}
      {media.selected && (
        <div className="absolute top-1 right-1">
          <CheckCircle2 className="w-4 h-4 text-astra-500 bg-white rounded-full" />
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5">
        <button
          onClick={() => onPreview(media.public_url)}
          className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
          title={isVid ? "Play preview" : "Preview"}
        >
          <Eye className="w-3.5 h-3.5 text-white" />
        </button>
        <button
          onClick={() => onSelect(media)}
          className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
          title={media.selected ? "Deselect" : "Select"}
        >
          <CheckCircle2 className={cn("w-3.5 h-3.5", media.selected ? "text-astra-400" : "text-white")} />
        </button>
        {!isVid && media.type === "generated" && onRegenerate && (
          <button
            onClick={() => onRegenerate(media)}
            disabled={isGenerating}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition disabled:opacity-50"
            title="Regenerate variation"
          >
            <RotateCcw className="w-3.5 h-3.5 text-white" />
          </button>
        )}
        <button
          onClick={() => onDelete(media.id)}
          className="w-7 h-7 rounded-full bg-red-500/80 hover:bg-red-600 flex items-center justify-center transition"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
    </div>
  );
}

export function MediaPanel({ contentId, contentBody, contentHook, platform }: MediaPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewIsVideo, setPreviewIsVideo] = useState(false);

  const { data: mediaList = [], isLoading } = useContentMedia(contentId);
  const uploadMutation = useUploadMedia(contentId);
  const generateMutation = useGenerateMedia(contentId);
  const updateMutation = useUpdateMedia(contentId);
  const deleteMutation = useDeleteMedia(contentId);

  const selectedMedia = mediaList.filter((m) => m.selected);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    files.forEach((file) => {
      const isVid = file.type.startsWith("video/");
      toast.promise(
        uploadMutation.mutateAsync({ file }),
        {
          loading: `Uploading ${file.name}…`,
          success: isVid ? "Video uploaded ✓" : "Image uploaded ✓",
          error: (err) => err.message,
        }
      );
    });
    e.target.value = "";
  }

  function handleGenerate() {
    const prompt = generatePrompt.trim() || undefined;
    toast.promise(
      generateMutation.mutateAsync({ prompt }).then((res) => {
        if (res.reference_note) toast.info(res.reference_note, { duration: 6000 });
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

  function toggleSelect(media: ContentMedia) {
    toast.promise(
      updateMutation.mutateAsync({ mediaId: media.id, updates: { selected: !media.selected } }),
      {
        loading: "Updating…",
        success: media.selected ? "Deselected" : "Selected",
        error: (err) => err.message,
      }
    );
  }

  function handleDelete(mediaId: string) {
    toast.promise(deleteMutation.mutateAsync(mediaId), {
      loading: "Deleting…",
      success: "Deleted",
      error: (err) => err.message,
    });
  }

  function handleRegenerate(media: ContentMedia) {
    toast.promise(
      generateMutation.mutateAsync({ prompt: media.prompt }),
      { loading: "Regenerating…", success: "New variation generated", error: (e) => e.message }
    );
  }

  function openPreview(url: string) {
    setPreviewUrl(url);
    setPreviewIsVideo(isVideo(url));
  }

  const isGenerating = generateMutation.isPending;
  const isUploading = uploadMutation.isPending;
  const hasVideos = mediaList.some((m) => isVideo(m.public_url));
  const hasImages = mediaList.some((m) => !isVideo(m.public_url));

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
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-accent transition disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            Upload
          </button>
          <button
            onClick={() => setShowGenerateForm((v) => !v)}
            disabled={isGenerating}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-astra-500 hover:bg-astra-600 text-white transition disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Generate image
          </button>
        </div>
      </div>

      {/* Hidden file input */}
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
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-astra-500" />
            AI Image Generation
            <span className="font-normal text-muted-foreground ml-1">
              — Claude writes visual brief, Pollinations renders
            </span>
          </p>
          <textarea
            value={generatePrompt}
            onChange={(e) => setGeneratePrompt(e.target.value)}
            rows={2}
            placeholder={`Optional: describe the image you want${platform ? ` for ${platform}` : ""}. Leave blank to generate from content context.`}
            className="w-full px-3 py-2 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-astra-500 hover:bg-astra-600 text-white transition disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
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
        <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-astra-500/30 transition"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex justify-center gap-2 mb-2">
            <ImageIcon className="w-6 h-6 text-muted-foreground opacity-40" />
            <Video className="w-6 h-6 text-muted-foreground opacity-40" />
          </div>
          <p className="text-xs text-muted-foreground">Upload images or videos, or generate an AI image above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {mediaList.map((media) => (
            <MediaThumbnail
              key={media.id}
              media={media}
              onPreview={openPreview}
              onSelect={toggleSelect}
              onDelete={handleDelete}
              onRegenerate={handleRegenerate}
              isGenerating={isGenerating}
            />
          ))}
        </div>
      )}

      {/* Selected count hint */}
      {mediaList.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Only <strong>selected</strong> media will be attached when publishing.
          {selectedMedia.length === 0 && " No media selected — post will be text-only."}
        </p>
      )}

      {/* Preview modal (image or video) */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <button
            onClick={() => setPreviewUrl(null)}
            className="absolute top-4 right-4 text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition"
          >
            <X className="w-5 h-5" />
          </button>
          {previewIsVideo ? (
            <video
              src={previewUrl}
              controls
              autoPlay
              className="max-w-full max-h-full rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full max-h-full rounded-xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </div>
  );
}
