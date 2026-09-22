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
import { TikTokContentCard } from "@/components/tiktok/tiktok-content-card";
import { cn } from "@/lib/utils";
import {
  Sparkles, CheckCircle2, XCircle, Trash2,
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
  { id: "tiktok", label: "TikTok", icon: null, color: "text-[#EE1D52]" },
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
  { id: "tiktok", label: "TikTok", icon: null, color: "text-[#EE1D52]" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  draft:     "bg-[#2A1E08] text-[#C8943A] border-[#4D3810]",
  approved:  "bg-[#0E2A1A] text-[#4D9A6A] border-[#1E4D30]",
  rejected:  "bg-[#2A0E0E] text-[#D97070] border-[#5A2020]",
  published: "bg-[#0E1E2A] text-[#5B9BD5] border-[#1C3650]",
};

const PLATFORM_ICON: Record<string, { icon: React.ElementType | null; color: string }> = {
  linkedin:  { icon: Linkedin,  color: "text-[#0077B5]" },
  twitter:   { icon: Twitter,   color: "text-[#1DA1F2]" },
  instagram: { icon: Instagram, color: "text-[#E1306C]" },
  tiktok:    { icon: null,      color: "text-[#EE1D52]" },
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
  const platform = PLATFORM_ICON[item.platform];
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
  const badgeClass = STATUS_BADGE[item.status] ?? "bg-[#1F1B17] text-[#6E6860] border-[#2A2520]";

  return (
    <div className="border border-[#2A2520] rounded-sm bg-[#161310] hover:border-[#3A3530] transition-colors group">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[#1F1B17]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-sm bg-[#1F1B17] flex items-center justify-center">
            {Icon ? <Icon className={cn("w-3.5 h-3.5", platform.color)} /> : <span className="text-xs">🎵</span>}
          </div>
          <div>
            <span className="text-sm font-medium text-[#F5F2EE] capitalize">{item.platform}</span>
            <p className="text-xs text-[#6E6860]">{formatRelativeTime(item.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em] rounded-sm border",
            badgeClass
          )}>
            {item.status}
          </span>
          <span className={cn("text-xs font-mono", charCount > charLimit ? "text-[#D97070]" : "text-[#6E6860]")}>
            {charCount}/{charLimit}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editBody}
              onChange={(e) => onEditBodyChange(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 bg-[#0D0B09] border border-[#3A3530] rounded-sm text-sm text-[#F5F2EE] focus:border-[#C8843A] focus:outline-none resize-none leading-relaxed"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSaveEdit(item.id)}
                disabled={updatePending}
                className="flex items-center gap-1.5 text-xs font-medium bg-[#C8843A] text-[#0D0B09] px-3 py-1.5 rounded-sm hover:bg-[#DE913A] transition-colors disabled:opacity-50"
              >
                {updatePending ? <div className="w-3 h-3 border-2 border-[#0D0B09] border-t-transparent rounded-full animate-spin" /> : <Save className="w-3 h-3" />}
                Save changes
              </button>
              <button
                onClick={onCancelEdit}
                className="flex items-center gap-1.5 text-xs font-medium text-[#6E6860] hover:text-[#F5F2EE] px-3 py-1.5 rounded-sm border border-[#3A3530] transition-colors"
              >
                <XIcon className="w-3 h-3" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <p className="text-sm text-[#B8B2A9] whitespace-pre-wrap leading-relaxed line-clamp-4 pr-6">
              {item.body}
            </p>
            <button
              onClick={() => onStartEdit(item.id, item.body)}
              className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-sm hover:bg-[#2A2520] text-[#6E6860] hover:text-[#F5F2EE]"
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Hashtags */}
      {item.hashtags && item.hashtags.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1">
          {item.hashtags.slice(0, 6).map((tag) => (
            <span key={tag} className="text-xs font-medium text-[#6E6860]">
              #{tag.replace(/^#/, "")}
            </span>
          ))}
          {item.hashtags.length > 6 && (
            <span className="text-xs text-[#524D47]">+{item.hashtags.length - 6} more</span>
          )}
        </div>
      )}

      {/* Media toggle */}
      <div className="px-4 pb-3">
        <button
          onClick={() => setMediaOpen((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-sm border border-[#2A2520] text-[#6E6860] hover:border-[#3A3530] hover:text-[#B8B2A9] transition-colors"
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
        "flex items-center gap-1 px-4 py-3 border-t border-[#1F1B17]",
        item.status === "draft" ? "justify-between" : "justify-end"
      )}>
        {item.status === "draft" && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onApprove(item.id)}
              className="flex items-center gap-1.5 text-xs font-medium text-[#4D9A6A] bg-[#0E2A1A] border border-[#1E4D30] hover:bg-[#122E1E] px-3 py-1.5 rounded-sm transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
            </button>
            <button
              onClick={() => onReject(item.id)}
              className="flex items-center gap-1.5 text-xs font-medium text-[#D97070] bg-[#2A0E0E] border border-[#5A2020] hover:bg-[#321010] px-3 py-1.5 rounded-sm transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" /> Reject
            </button>
          </div>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-medium text-[#6E6860] hover:text-[#B8B2A9] px-3 py-1.5 rounded-sm transition-colors"
            title="Copy text"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#4D9A6A]" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="flex items-center gap-1.5 text-xs font-medium text-[#6E6860] hover:text-[#D97070] px-3 py-1.5 rounded-sm transition-colors"
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
    <div className="flex items-center justify-center gap-1.5">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="p-2 rounded-sm border border-[#2A2520] text-[#6E6860] hover:border-[#3A3530] hover:text-[#B8B2A9] disabled:opacity-40 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            "w-8 h-8 rounded-sm text-sm font-medium transition-colors",
            p === page
              ? "bg-[#C8843A] text-[#0D0B09]"
              : "border border-[#2A2520] text-[#6E6860] hover:border-[#3A3530] hover:text-[#B8B2A9]"
          )}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="p-2 rounded-sm border border-[#2A2520] text-[#6E6860] hover:border-[#3A3530] hover:text-[#B8B2A9] disabled:opacity-40 transition-colors"
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
        loading: "ASTRA is writing on-brand content…",
        success: (res) => `Generated ${Object.keys(res.generated).length} platform versions ✓`,
        error: (e) => safeErr(e),
      }
    );
  }

  if (brands.length === 0) {
    return (
      <div className="p-8 max-w-2xl">
        <div className="border border-[#2A2520] border-dashed rounded-sm p-16 text-center">
          <p className="text-sm font-medium text-[#6E6860]">No brands yet</p>
          <p className="text-xs text-[#524D47] mt-1 mb-4">Create a Brand Brain first to generate content.</p>
          <a
            href="/brand"
            className="inline-flex items-center gap-2 bg-[#C8843A] text-[#0D0B09] px-4 py-2 text-sm font-medium rounded-sm hover:bg-[#DE913A] transition-colors"
          >
            Set up Brand Brain
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl">
      {/* Page header */}
      <div className="mb-8 pb-6 border-b border-[#2A2520] flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#F5F2EE] tracking-tight">Content</h1>
          <p className="mt-1 text-sm text-[#928C83]">
            Generate, manage, and publish on-brand content across every platform.
          </p>
        </div>
        {brands.length > 1 && (
          <div className="relative">
            <select
              value={activeBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="appearance-none h-9 pl-3 pr-8 bg-[#161310] border border-[#3A3530] rounded-sm text-sm text-[#F5F2EE] focus:border-[#C8843A] focus:outline-none"
            >
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6E6860] pointer-events-none" />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#2A2520] mb-6 gap-6">
        {(["generate", "library"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "pb-3 text-sm font-medium border-b-2 -mb-px flex items-center gap-1.5 transition-colors",
              activeTab === tab
                ? "text-[#F5F2EE] border-[#C8843A]"
                : "text-[#6E6860] border-transparent hover:text-[#B8B2A9]"
            )}
          >
            {tab === "generate" ? (
              <><Sparkles className="w-3.5 h-3.5" /> Generate</>
            ) : (
              <>
                <BarChart3 className="w-3.5 h-3.5" />
                Library
                {contentList.length > 0 && (
                  <span className="text-[10px] font-medium text-[#6E6860] bg-[#1F1B17] border border-[#2A2520] px-1.5 py-0.5 rounded-sm">
                    {contentList.length}
                  </span>
                )}
              </>
            )}
          </button>
        ))}
      </div>

      {/* ══ GENERATE TAB ══ */}
      {activeTab === "generate" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: brief form */}
          <div className="lg:col-span-2 space-y-5">
            <form onSubmit={handleGenerate} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-2">
                  Content brief
                </label>
                <textarea
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  rows={5}
                  placeholder="What do you want to post about? Describe the topic, key message, or goal…"
                  className="w-full px-3 py-2 bg-[#161310] border border-[#3A3530] rounded-sm text-sm text-[#F5F2EE] placeholder:text-[#524D47] focus:border-[#C8843A] focus:outline-none resize-none leading-relaxed"
                />
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {BRIEF_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setBrief(s)}
                      className="text-xs px-2.5 py-1 rounded-sm border border-[#2A2520] text-[#6E6860] hover:border-[#3A3530] hover:text-[#B8B2A9] bg-transparent transition-colors"
                    >
                      {s.length > 36 ? s.slice(0, 36) + "…" : s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-2">Target platforms</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORM_GENERATE.map((p) => {
                    const selected = selectedPlatforms.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePlatform(p.id)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-2 rounded-sm border text-sm font-medium transition-colors",
                          selected
                            ? "border-[#C8843A] text-[#F5F2EE]"
                            : "border-[#2A2520] text-[#6E6860] hover:border-[#3A3530] hover:text-[#B8B2A9]"
                        )}
                      >
                        {p.icon && <p.icon className={cn("w-3.5 h-3.5", selected ? p.color : "text-[#6E6860]")} />}
                        {!p.icon && <span className="text-xs">🎵</span>}
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={generateMutation.isPending || !brief.trim() || selectedPlatforms.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-sm font-medium text-[#0D0B09] text-sm bg-[#C8843A] hover:bg-[#DE913A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generateMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#0D0B09] border-t-transparent rounded-full animate-spin" />
                    Writing content…
                  </>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Generate with ASTRA</>
                )}
              </button>
            </form>
          </div>

          {/* Right: previews */}
          <div className="lg:col-span-3 space-y-4">
            {!generated && !generateMutation.isPending && (
              <div className="h-64 flex flex-col items-center justify-center border border-[#2A2520] border-dashed rounded-sm text-center">
                <p className="text-sm font-medium text-[#6E6860]">Platform previews will appear here</p>
                <p className="text-xs text-[#524D47] mt-1">ASTRA reads your brand brief and generates platform-optimised posts</p>
              </div>
            )}
            {generateMutation.isPending && (
              <div className="h-64 flex flex-col items-center justify-center gap-4 border border-[#2A2520] border-dashed rounded-sm">
                <div className="w-8 h-8 border-2 border-[#C8843A] border-t-transparent rounded-full animate-spin" />
                <div className="text-center">
                  <p className="text-sm font-medium text-[#F5F2EE]">ASTRA is reading your brand context…</p>
                  <p className="text-xs text-[#6E6860] mt-1">Writing optimised posts for {selectedPlatforms.join(", ")}</p>
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
                  className="flex items-center gap-1.5 text-sm text-[#C8843A] hover:text-[#DE913A] font-medium transition-colors"
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
        <div className="space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#2A2520] border border-[#2A2520] rounded-sm">
            <div className="p-6">
              <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-1">Total</p>
              <p className="text-3xl font-semibold text-[#F5F2EE] tracking-tight">{stats.total}</p>
            </div>
            <div className="p-6">
              <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-1">Drafts</p>
              <p className="text-3xl font-semibold text-[#F5F2EE] tracking-tight">{stats.draft}</p>
            </div>
            <div className="p-6">
              <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-1">Approved</p>
              <p className="text-3xl font-semibold text-[#F5F2EE] tracking-tight">{stats.approved}</p>
              {stats.approved > 0 && <p className="text-xs text-[#3D7A5A] mt-1">ready to publish</p>}
            </div>
            <div className="p-6">
              <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-1">Published</p>
              <p className="text-3xl font-semibold text-[#F5F2EE] tracking-tight">{stats.published}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Platform tabs */}
            <div className="flex border-b border-[#2A2520] gap-4">
              {PLATFORMS.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleFilterChange(p.id, filterStatus)}
                    className={cn(
                      "pb-2 text-xs font-medium border-b-2 -mb-px flex items-center gap-1 transition-colors",
                      filterPlatform === p.id
                        ? "text-[#F5F2EE] border-[#C8843A]"
                        : "text-[#6E6860] border-transparent hover:text-[#B8B2A9]"
                    )}
                  >
                    {Icon && <Icon className={cn("w-3 h-3", p.color)} />}
                    {p.label}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-1.5 flex-wrap ml-auto">
              {STATUSES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleFilterChange(filterPlatform, s.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-sm text-xs font-medium transition-colors border",
                    filterStatus === s.id
                      ? "border-[#C8843A] text-[#C8843A] bg-transparent"
                      : "border-[#2A2520] text-[#6E6860] hover:border-[#3A3530] hover:text-[#B8B2A9]"
                  )}
                >
                  {s.label}
                </button>
              ))}
              <span className="text-xs text-[#524D47] self-center ml-2">
                {filtered.length} post{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Content grid */}
          {paginatedContent.length === 0 ? (
            <div className="border border-[#2A2520] border-dashed rounded-sm p-16 text-center">
              <p className="text-sm font-medium text-[#6E6860]">No content found</p>
              <p className="text-xs text-[#524D47] mt-1">
                {contentList.length === 0
                  ? "Generate your first piece of content above."
                  : "Try changing your filter."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {paginatedContent.map((item) =>
                item.platform === "tiktok" ? (
                  <TikTokContentCard key={item.id} item={item} />
                ) : (
                  <ContentCard
                    key={item.id}
                    item={item}
                    editingId={editingId}
                    editBody={editBody}
                    onStartEdit={startEdit}
                    onCancelEdit={cancelEdit}
                    onSaveEdit={saveEdit}
                    onEditBodyChange={setEditBody}
                    onApprove={(id) => toast.promise(approveMutation.mutateAsync({ id, body: item.body }), {
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
                )
              )}
            </div>
          )}

          {/* Pagination */}
          <Pagination page={page} totalPages={totalPages} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        </div>
      )}
    </div>
  );
}
