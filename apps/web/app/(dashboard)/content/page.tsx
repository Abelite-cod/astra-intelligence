"use client";

import { useState, useMemo } from "react";
import { useBrands } from "@/hooks/use-brand";
import {
  useGenerateContent, useContentList, useApproveContent,
  useRejectContent, useDeleteContent, useUpdateContent,
  type GeneratedContent, type ContentItem
} from "@/hooks/use-content";
import { PlatformPreview } from "@/components/content/platform-preview";
import { MediaPanel } from "@/components/content/media-panel";
import { cn } from "@/lib/utils";
import {
  Sparkles, Loader2, CheckCircle2, XCircle, Trash2,
  Linkedin, Twitter, Instagram, FileText, ChevronDown,
  Pencil, Save, X as XIcon, ImageIcon, Copy, Check,
  ChevronLeft, ChevronRight, Filter, BarChart3, Hash,
  TrendingUp, Eye
} from "lucide-react";
import { toast } from "sonner";
import { formatRelativeTime } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────

const PLATFORMS = [
  { id: "all", label: "All", icon: null, color: "" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-[#0077B5]" },
  { id: "twitter", label: "Twitter / X", icon: Twitter, color: "text-[#1DA1F2]" },
  { id: "instagram", label: "Instagram", icon: Instagram, color: "text-[#E1306C]" },
];

const STATUSES = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "published", label: "Published" },
];

const BRIEF_SUGGESTIONS = [
  "Announce our new product feature launch",
  "Share a customer success story",
  "Explain the problem we solve for customers",
  "Post about a recent industry trend",
  "Share a tip related to our expertise",
  "Celebrate a company milestone",
];

const PAGE_SIZE = 8;

const PLATFORM_GENERATE = [
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-[#0077B5]" },
  { id: "twitter", label: "Twitter / X", icon: Twitter, color: "text-[#1DA1F2]" },
  { id: "instagram", label: "Instagram", icon: Instagram, color: "text-[#E1306C]" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-500 border border-red-500/20",
  published: "bg-blue-500/10 text-blue-600 border border-blue-500/20",
};

const PLATFORM_BADGE: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  linkedin: { icon: Linkedin, color: "text-[#0077B5]", bg: "bg-[#0077B5]/10" },
  twitter: { icon: Twitter, color: "text-[#1DA1F2]", bg: "bg-[#1DA1F2]/10" },
  instagram: { icon: Instagram, color: "text-[#E1306C]", bg: "bg-[#E1306C]/10" },
};

function safeErrorMessage(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e);
  if (raw.trim().startsWith("{") || raw.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      const msg = parsed?.error?.message ?? parsed?.error ?? parsed?.message ?? null;
      if (typeof msg === "string") return msg;
    } catch { /* fall through */ }
    return "Content generation failed. Please try again.";
  }
  return raw || "Content generation failed. Please try again.";
}

// ── Content Card ──────────────────────────────────────────────────────────────

function ContentCard({
  item,
  editingId, editBody,
  onStartEdit, onCancelEdit, onSaveEdit, onEditBodyChange,
  onApprove, onReject, onDelete,
  updatePending,
}: {
  item: ContentItem;
  editingId: string | null;
  editBody: string;
  onStartEdit: (id: string, body: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string) => void;
  onEditBodyChange: (v: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
  updatePending: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const platform = PLATFORM_BADGE[item.platform];
  const Icon = platform?.icon;
  const charCount = item.body?.length ?? 0;
  const charLimit = item.platform === "twitter" ? 280 : item.platform === "linkedin" ? 3000 : 2200;

  function handleCopy() {
    navigator.clipboard.writeText(item.body ?? "").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const isEditing = editingId === item.id;

  return (
    <div className={cn(
      "group bg-card rounded-2xl border transition-all duration-200",
      "hover:shadow-md hover:border-border/80",
      item.status === "approved" ? "border-emerald-500/30" :
      item.status === "published" ? "border-blue-500/30" :
      "border-border"
    )}>
      {/* Card header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", platform.bg)}>
              <Icon className={cn("w-4 h-4", platform.color)} />
            </div>
          )}
          <div>
            <span className="text-sm font-semibold text-foreground capitalize">{item.platform}</span>
            <p className="text-xs text-muted-foreground">{formatRelativeTime(item.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-xs px-2.5 py-1 rounded-full font-semibold capitalize", STATUS_STYLES[item.status] ?? "bg-muted text-muted-foreground")}>
            {item.status}
          </span>
          <span className={cn("text-xs font-mono", charCount > charLimit ? "text-red-500" : "text-muted-foreground")}>
            {charCount}/{charLimit}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pb-3">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editBody}
              onChange={(e) => onEditBodyChange(e.target.value)}
              rows={5}
              className="w-full px-3.5 py-3 rounded-xl border border-astra-500 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-astra-500/30 resize-none leading-relaxed"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSaveEdit(item.id)}
                disabled={updatePending}
                className="flex items-center gap-1.5 text-xs font-semibold bg-astra-500 hover:bg-astra-600 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                {updatePending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save changes
              </button>
              <button
                onClick={onCancelEdit}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg border border-border transition"
              >
                <XIcon className="w-3 h-3" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed line-clamp-4 pr-6">
              {item.body}
            </p>
            <button
              onClick={() => onStartEdit(item.id, item.body)}
              className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Hashtags */}
      {item.hashtags && item.hashtags.length > 0 && (
        <div className="px-5 pb-3 flex flex-wrap gap-1">
          {item.hashtags.slice(0, 6).map((tag) => (
            <span key={tag} className={cn("text-xs font-medium", platform?.color ?? "text-astra-500")}>
              #{tag.replace(/^#/, "")}
            </span>
          ))}
          {item.hashtags.length > 6 && (
            <span className="text-xs text-muted-foreground">+{item.hashtags.length - 6} more</span>
          )}
        </div>
      )}

      {/* Media toggle */}
      <div className="px-5 pb-3">
        <button
          onClick={() => setMediaOpen((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition",
            mediaOpen
              ? "bg-astra-500/10 text-astra-600 border border-astra-500/30"
              : "border border-border text-muted-foreground hover:border-astra-500/40 hover:text-astra-600"
          )}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          {mediaOpen ? "Hide media" : "Manage media"}
        </button>
        {mediaOpen && (
          <div className="mt-3">
            <MediaPanel contentId={item.id} contentBody={item.body} contentHook={item.hook} platform={item.platform} />
          </div>
        )}
      </div>

      {/* Actions footer */}
      <div className={cn(
        "flex items-center gap-1 px-5 py-3 border-t border-border",
        item.status === "draft" ? "justify-between" : "justify-end"
      )}>
        {item.status === "draft" && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onApprove(item.id)}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
            </button>
            <button
              onClick={() => onReject(item.id)}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition"
            >
              <XCircle className="w-3.5 h-3.5" /> Reject
            </button>
          </div>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-transparent hover:border-border transition"
            title="Copy text"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-destructive px-3 py-1.5 rounded-lg border border-transparent hover:border-red-500/30 transition"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Pagination ─────────────────────────────────────────────────────────────────

function Pagination({
  page, totalPages, onChange
}: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="p-2 rounded-lg border border-border bg-card hover:bg-accent disabled:opacity-40 transition"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            "w-8 h-8 rounded-lg text-sm font-medium transition",
            p === page
              ? "bg-astra-500 text-white"
              : "border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground"
          )}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="p-2 rounded-lg border border-border bg-card hover:bg-accent disabled:opacity-40 transition"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ContentPage() {
  const { data: brands = [] } = useBrands();
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [brief, setBrief] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["linkedin", "twitter"]);
  const [generated, setGenerated] = useState<GeneratedContent | null>(null);
  const [activeTab, setActiveTab] = useState<"generate" | "library">("generate");

  // Library filters
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);

  // Editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState<string>("");

  const activeBrandId = selectedBrandId || brands[0]?.id || "";

  const generateMutation = useGenerateContent(activeBrandId);
  const { data: contentList = [] } = useContentList(activeBrandId);
  const approveMutation = useApproveContent(activeBrandId);
  const rejectMutation = useRejectContent(activeBrandId);
  const deleteMutation = useDeleteContent(activeBrandId);
  const updateMutation = useUpdateContent(activeBrandId);

  // Filter + paginate
  const filtered = useMemo(() => {
    return contentList.filter((item) => {
      const byPlatform = filterPlatform === "all" || item.platform === filterPlatform;
      const byStatus = filterStatus === "all" || item.status === filterStatus;
      return byPlatform && byStatus;
    });
  }, [contentList, filterPlatform, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedContent = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Stats
  const stats = useMemo(() => ({
    total: contentList.length,
    approved: contentList.filter((c) => c.status === "approved").length,
    published: contentList.filter((c) => c.status === "published").length,
    draft: contentList.filter((c) => c.status === "draft").length,
  }), [contentList]);

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
      { loading: "Saving…", success: "Content updated", error: "Failed to save" }
    );
  }

  function togglePlatform(id: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  function handleFilterChange(platform: string, status: string) {
    setFilterPlatform(platform);
    setFilterStatus(status);
    setPage(1);
  }

  function safeErr(e: unknown): string {
    return safeErrorMessage(e);
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
        loading: "Claude is writing on-brand content…",
        success: (res) => `Generated ${Object.keys(res.generated).length} platform versions ✓`,
        error: (e) => safeErr(e),
      }
    );
  }

  if (brands.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">No brands yet</h2>
        <p className="text-muted-foreground mb-4">Create a Brand Brain first.</p>
        <a href="/brand" className="inline-flex items-center gap-2 bg-astra-500 hover:bg-astra-600 text-white font-medium px-5 py-2.5 rounded-xl transition text-sm">
          Set up Brand Brain
        </a>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Content</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Generate, manage, and publish on-brand content across every platform.
          </p>
        </div>
        {brands.length > 1 && (
          <div className="relative">
            <select
              value={activeBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit mb-6">
        {(["generate", "library"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-semibold transition capitalize",
              activeTab === tab
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "generate" ? (
              <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Generate</span>
            ) : (
              <span className="flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
                Library
                {contentList.length > 0 && (
                  <span className="bg-astra-500/15 text-astra-600 text-xs font-bold px-1.5 py-0.5 rounded-full">{contentList.length}</span>
                )}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══ GENERATE TAB ══ */}
      {activeTab === "generate" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: brief form */}
          <div className="lg:col-span-2 space-y-5">
            <form onSubmit={handleGenerate} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Content brief
                </label>
                <textarea
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  rows={5}
                  placeholder="What do you want to post about? Describe the topic, key message, or goal…"
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-astra-500/40 resize-none leading-relaxed"
                />
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {BRIEF_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setBrief(s)}
                      className="text-xs px-2.5 py-1 rounded-full border border-border bg-background hover:border-astra-500/50 hover:text-astra-600 transition text-muted-foreground"
                    >
                      {s.length > 36 ? s.slice(0, 36) + "…" : s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Target platforms</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORM_GENERATE.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePlatform(p.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm font-medium transition",
                        selectedPlatforms.includes(p.id)
                          ? "border-astra-500 bg-astra-500/8 text-astra-600"
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
                  "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white text-sm transition",
                  "bg-gradient-to-r from-astra-500 to-purple-500 hover:from-astra-600 hover:to-purple-600 shadow-lg shadow-astra-500/20",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                )}
              >
                {generateMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Writing content…</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Generate with Claude AI</>
                )}
              </button>
            </form>
          </div>

          {/* Right: previews */}
          <div className="lg:col-span-3 space-y-4">
            {!generated && !generateMutation.isPending && (
              <div className="h-72 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl text-muted-foreground text-sm gap-3">
                <div className="w-14 h-14 rounded-2xl bg-astra-500/8 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-astra-500" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">Your platform previews will appear here</p>
                  <p className="text-xs mt-1">Claude reads your brand brief and generates platform-optimised posts</p>
                </div>
              </div>
            )}
            {generateMutation.isPending && (
              <div className="h-72 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-astra-500/30 rounded-2xl bg-astra-500/5">
                <Loader2 className="w-10 h-10 text-astra-500 animate-spin" />
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">Claude is reading your brand context…</p>
                  <p className="text-xs text-muted-foreground mt-1">Writing optimised posts for {selectedPlatforms.join(", ")}</p>
                </div>
              </div>
            )}
            {generated && Object.entries(generated).map(([platform, content]) => (
              <PlatformPreview
                key={platform}
                platform={platform as "linkedin" | "twitter" | "instagram"}
                body={content.body}
                hook={content.hook}
                cta={content.cta}
                hashtags={content.hashtags}
              />
            ))}
            {generated && (
              <div className="flex justify-center">
                <button
                  onClick={() => setActiveTab("library")}
                  className="flex items-center gap-1.5 text-sm text-astra-500 hover:text-astra-600 font-medium transition"
                >
                  <Eye className="w-4 h-4" /> View in library → approve or edit
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ LIBRARY TAB ══ */}
      {activeTab === "library" && (
        <div className="space-y-5">
          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total", value: stats.total, icon: FileText, color: "text-foreground", bg: "bg-muted" },
              { label: "Drafts", value: stats.draft, icon: Pencil, color: "text-amber-600", bg: "bg-amber-500/10" },
              { label: "Approved", value: stats.approved, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10" },
              { label: "Published", value: stats.published, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-500/10" },
            ].map((s) => (
              <div key={s.label} className="bg-card border border-border rounded-xl p-3.5 flex items-center gap-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", s.bg)}>
                  <s.icon className={cn("w-4 h-4", s.color)} />
                </div>
                <div>
                  <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 p-4 bg-card border border-border rounded-xl">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />

            {/* Platform tabs */}
            <div className="flex gap-1 flex-wrap">
              {PLATFORMS.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleFilterChange(p.id, filterStatus)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition",
                      filterPlatform === p.id
                        ? "bg-astra-500 text-white"
                        : "border border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {Icon && <Icon className="w-3 h-3" />}
                    {p.label}
                  </button>
                );
              })}
            </div>

            <div className="w-px h-5 bg-border hidden sm:block" />

            {/* Status filter */}
            <div className="flex gap-1 flex-wrap">
              {STATUSES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleFilterChange(filterPlatform, s.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition",
                    filterStatus === s.id
                      ? "bg-foreground text-background"
                      : "border border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <span className="ml-auto text-xs text-muted-foreground">
              {filtered.length} post{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Content grid */}
          {paginatedContent.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl text-muted-foreground">
              <Hash className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-semibold text-foreground">No content found</p>
              <p className="text-sm mt-1">
                {contentList.length === 0
                  ? "Generate your first piece of content above."
                  : "Try changing your filter."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {paginatedContent.map((item) => (
                <ContentCard
                  key={item.id}
                  item={item}
                  editingId={editingId}
                  editBody={editBody}
                  onStartEdit={startEdit}
                  onCancelEdit={cancelEdit}
                  onSaveEdit={saveEdit}
                  onEditBodyChange={setEditBody}
                  onApprove={(id) => toast.promise(approveMutation.mutateAsync(id), {
                    loading: "Approving…", success: "Content approved ✓", error: "Failed"
                  })}
                  onReject={(id) => toast.promise(rejectMutation.mutateAsync(id), {
                    loading: "Rejecting…", success: "Content rejected", error: "Failed"
                  })}
                  onDelete={(id) => toast.promise(deleteMutation.mutateAsync(id), {
                    loading: "Deleting…", success: "Deleted", error: "Failed"
                  })}
                  updatePending={updateMutation.isPending}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          <Pagination page={page} totalPages={totalPages} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        </div>
      )}
    </div>
  );
}
