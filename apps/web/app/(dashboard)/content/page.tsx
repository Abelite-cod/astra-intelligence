"use client";

import { useState } from "react";
import { useBrands } from "@/hooks/use-brand";
import { useGenerateContent, useContentList, useApproveContent, useRejectContent, useDeleteContent, useUpdateContent, type GeneratedContent } from "@/hooks/use-content";
import { PlatformPreview } from "@/components/content/platform-preview";
import { MediaPanel } from "@/components/content/media-panel";
import { cn } from "@/lib/utils";
import {
  Sparkles, Loader2, CheckCircle2, XCircle, Trash2,
  Linkedin, Twitter, Instagram, FileText, ChevronDown, Pencil, Save, X as XIcon, ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import { formatRelativeTime } from "@/lib/utils";

const PLATFORMS = [
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-[#0077B5]" },
  { id: "twitter", label: "Twitter / X", icon: Twitter, color: "text-[#1DA1F2]" },
  { id: "instagram", label: "Instagram", icon: Instagram, color: "text-[#E1306C]" },
];

const BRIEF_SUGGESTIONS = [
  "Announce our new product feature launch",
  "Share a customer success story",
  "Explain the problem we solve for customers",
  "Post about a recent industry trend",
  "Share a tip related to our expertise",
  "Celebrate a company milestone",
];

export default function ContentPage() {
  const { data: brands = [] } = useBrands();
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [brief, setBrief] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["linkedin", "twitter"]);
  const [generated, setGenerated] = useState<GeneratedContent | null>(null);
  const [activeTab, setActiveTab] = useState<"generate" | "library">("generate");

  const activeBrandId = selectedBrandId || brands[0]?.id || "";

  const generateMutation = useGenerateContent(activeBrandId);
  const { data: contentList = [] } = useContentList(activeBrandId);
  const approveMutation = useApproveContent(activeBrandId);
  const rejectMutation = useRejectContent(activeBrandId);
  const deleteMutation = useDeleteContent(activeBrandId);
  const updateMutation = useUpdateContent(activeBrandId);

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState<string>("");

  function startEdit(id: string, body: string) {
    setEditingId(id);
    setEditBody(body);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditBody("");
  }

  function saveEdit(id: string) {
    toast.promise(
      updateMutation.mutateAsync({ id, body: editBody }).then(() => {
        setEditingId(null);
        setEditBody("");
      }),
      {
        loading: "Saving…",
        success: "Content updated",
        error: "Failed to save",
      }
    );
  }

  function togglePlatform(id: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  function safeErrorMessage(e: unknown): string {
    const raw = e instanceof Error ? e.message : String(e);
    // Guard against raw JSON leaking through (e.g. {"error":{"code":503,...}})
    if (raw.trim().startsWith("{") || raw.trim().startsWith("[")) {
      try {
        const parsed = JSON.parse(raw);
        const msg =
          parsed?.error?.message ??
          parsed?.error ??
          parsed?.message ??
          null;
        if (typeof msg === "string") return msg;
      } catch {
        // fall through
      }
      return "Content generation failed. Please try again.";
    }
    return raw || "Content generation failed. Please try again.";
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!brief.trim() || !activeBrandId) return;

    toast.promise(
      generateMutation.mutateAsync({ brief, platforms: selectedPlatforms }).then((res) => {
        setGenerated(res.generated);
        return res;
      }),
      {
        loading: "Generating on-brand content…",
        success: (res) => `Generated ${Object.keys(res.generated).length} platform versions`,
        error: (e) => safeErrorMessage(e),
      }
    );
  }

  if (brands.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">No brands yet</h2>
        <p className="text-muted-foreground mb-4">
          Create a Brand Brain first so Astra knows your company, tone, and goals.
        </p>
        <a
          href="/brand"
          className="inline-flex items-center gap-2 bg-astra-500 hover:bg-astra-600 text-white font-medium px-5 py-2.5 rounded-xl transition text-sm"
        >
          Set up Brand Brain
        </a>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Content</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Generate on-brand content for every platform in one click.
          </p>
        </div>

        {/* Brand selector */}
        {brands.length > 1 && (
          <div className="relative">
            <select
              value={activeBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit mb-6">
        {(["generate", "library"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition capitalize",
              activeTab === tab
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "generate" ? "Generate" : `Library (${contentList.length})`}
          </button>
        ))}
      </div>

      {/* ── GENERATE TAB ── */}
      {activeTab === "generate" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: brief form */}
          <div className="lg:col-span-2 space-y-4">
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Content brief
                </label>
                <textarea
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  rows={4}
                  placeholder="What do you want to post about? Be specific about the topic, key message, or goal…"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
                {/* Quick suggestions */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {BRIEF_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setBrief(s)}
                      className="text-xs px-2.5 py-1 rounded-full border border-border bg-background hover:border-astra-500/50 hover:text-astra-600 transition text-muted-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Platform selector */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Platforms
                </label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePlatform(p.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition",
                        selectedPlatforms.includes(p.id)
                          ? "border-astra-500 bg-astra-500/5 text-astra-600"
                          : "border-border text-muted-foreground hover:border-astra-500/40"
                      )}
                    >
                      <p.icon className="w-3.5 h-3.5" />
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={generateMutation.isPending || !brief.trim() || selectedPlatforms.length === 0}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-white text-sm transition",
                  "bg-astra-500 hover:bg-astra-600",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {generateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {generateMutation.isPending ? "Generating…" : "Generate content"}
              </button>
            </form>
          </div>

          {/* Right: previews */}
          <div className="lg:col-span-3 space-y-4">
            {!generated && !generateMutation.isPending && (
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-border rounded-xl text-muted-foreground text-sm">
                Your platform previews will appear here
              </div>
            )}

            {generateMutation.isPending && (
              <div className="h-64 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-astra-500/30 rounded-xl bg-astra-500/5">
                <Loader2 className="w-8 h-8 text-astra-500 animate-spin" />
                <p className="text-sm text-muted-foreground">
                  AI is reading your brand context and writing…
                </p>
              </div>
            )}

            {generated &&
              Object.entries(generated).map(([platform, content]) => (
                <PlatformPreview
                  key={platform}
                  platform={platform as "linkedin" | "twitter" | "instagram"}
                  body={content.body}
                  hook={content.hook}
                  cta={content.cta}
                  hashtags={content.hashtags}
                />
              ))}
          </div>
        </div>
      )}

      {/* ── LIBRARY TAB ── */}
      {activeTab === "library" && (
        <div className="space-y-3">
          {contentList.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No content yet</p>
              <p className="text-sm mt-1">Generate your first piece of content above.</p>
            </div>
          )}

          {contentList.map((item) => (
            <div
              key={item.id}
              className="bg-card border border-border rounded-xl p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  {/* Platform badge */}
                  {item.platform === "linkedin" && <Linkedin className="w-4 h-4 text-[#0077B5]" />}
                  {item.platform === "twitter" && <Twitter className="w-4 h-4 text-[#1DA1F2]" />}
                  {item.platform === "instagram" && <Instagram className="w-4 h-4 text-[#E1306C]" />}
                  <span className="text-sm font-medium text-foreground capitalize">{item.platform}</span>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    item.status === "approved" ? "bg-green-500/10 text-green-600" :
                    item.status === "rejected" ? "bg-red-500/10 text-red-600" :
                    "bg-yellow-500/10 text-yellow-600"
                  )}>
                    {item.status}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatRelativeTime(item.created_at)}
                </span>
              </div>

              {editingId === item.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={5}
                    className="w-full px-3 py-2.5 rounded-lg border border-astra-500 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => saveEdit(item.id)}
                      disabled={updateMutation.isPending}
                      className="flex items-center gap-1.5 text-xs font-medium bg-astra-500 hover:bg-astra-600 text-white px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                    >
                      {updateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border transition"
                    >
                      <XIcon className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-4 pr-8">
                    {item.body}
                  </p>
                  <button
                    onClick={() => startEdit(item.id, item.body)}
                    className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {item.hashtags && item.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.hashtags.map((tag) => (
                    <span key={tag} className="text-xs text-astra-500">#{tag.replace(/^#/, "")}</span>
                  ))}
                </div>
              )}

              {/* ── Media section ─────────────────────────────────── */}
              <div className="pt-1">
                <MediaPanel
                  contentId={item.id}
                  contentBody={item.body}
                  contentHook={item.hook}
                  platform={item.platform}
                />
              </div>

              {item.status === "draft" && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      toast.promise(approveMutation.mutateAsync(item.id), {
                        loading: "Approving…",
                        success: "Content approved",
                        error: "Failed to approve",
                      });
                    }}
                    className="flex items-center gap-1.5 text-sm font-medium text-green-600 hover:text-green-700 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => {
                      toast.promise(rejectMutation.mutateAsync(item.id), {
                        loading: "Rejecting…",
                        success: "Content rejected",
                        error: "Failed to reject",
                      });
                    }}
                    className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-600 transition"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                  <button
                    onClick={() => {
                      toast.promise(deleteMutation.mutateAsync(item.id), {
                        loading: "Deleting…",
                        success: "Deleted",
                        error: "Failed to delete",
                      });
                    }}
                    className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
