"use client";

import { Suspense, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useBrands } from "@/hooks/use-brand";
import {
  useSocialAccounts,
  useDisconnectAccount,
  usePublishContent,
  useScheduledPosts,
  useScheduleContent,
  useCancelScheduled,
} from "@/hooks/use-publishing";
import { useContentList, useUpdateContent, type ContentItem } from "@/hooks/use-content";
import { useContentMedia } from "@/hooks/use-content-media";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import {
  Twitter, Linkedin, Send, CheckCircle2, XCircle,
  Link2, Unlink, ChevronDown, Clock, ExternalLink,
  Zap, Calendar, X, Trash2, Eye, Pencil, Save, ChevronLeft,
  ChevronRight, Hash, ImageIcon, Music2
} from "lucide-react";
import { toast } from "sonner";

// ── Constants ─────────────────────────────────────────────────────────────────

const PLATFORM_CONFIG = {
  twitter: {
    icon: Twitter,
    label: "Twitter / X",
    color: "text-[#1DA1F2]",
    connectHref: (brandId: string) => `/api/auth/twitter?brand_id=${brandId}`,
  },
  linkedin: {
    icon: Linkedin,
    label: "LinkedIn",
    color: "text-[#0077B5]",
    connectHref: (brandId: string) => `/api/auth/linkedin?brand_id=${brandId}`,
  },
  tiktok: {
    icon: Music2,
    label: "TikTok",
    color: "text-[#EE1D52]",
    connectHref: (brandId: string) => `/api/auth/tiktok?brand_id=${brandId}`,
  },
};

const HISTORY_PAGE_SIZE = 10;

function getMinDateTime() {
  const d = new Date(Date.now() + 5 * 60 * 1000);
  return d.toISOString().slice(0, 16);
}

function getDefaultDateTime() {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 16);
}

function formatScheduledAt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Preview/Edit Modal ────────────────────────────────────────────────────────

function ContentPreviewModal({
  item,
  onClose,
  onPublish,
  onSchedule,
  isPublishing,
  isConnected,
  platformConfig,
}: {
  item: ContentItem;
  onClose: () => void;
  onPublish: (id: string, platform: string) => void;
  onSchedule: (item: ContentItem) => void;
  isPublishing: boolean;
  isConnected: boolean;
  platformConfig: typeof PLATFORM_CONFIG[keyof typeof PLATFORM_CONFIG] | undefined;
}) {
  const updateMutation = useUpdateContent(item.brand_id);
  const { data: mediaList = [] } = useContentMedia(item.id);
  const selectedMedia = mediaList.filter((m) => m.selected);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(item.body ?? "");
  const [saved, setSaved] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const Icon = platformConfig?.icon ?? Zap;
  const charLimit = item.platform === "twitter" ? 280 : item.platform === "linkedin" ? 3000 : 2200;

  function handleSave() {
    toast.promise(
      updateMutation.mutateAsync({ id: item.id, body: editBody }).then(() => {
        setEditing(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }),
      { loading: "Saving…", success: "Content updated ✓", error: "Failed to save" }
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[#1F1B17] border border-[#2A2520] rounded-sm w-full max-w-xl shadow-lg max-h-[90vh] overflow-y-auto">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2520] sticky top-0 bg-[#1F1B17]">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-sm bg-[#2A2520] flex items-center justify-center">
              <Icon className={cn("w-4 h-4", platformConfig?.color ?? "text-[#6E6860]")} />
            </div>
            <div>
              <p className="text-sm font-medium text-[#F5F2EE] capitalize">{item.platform}</p>
              <p className="text-xs text-[#6E6860]">{formatRelativeTime(item.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!editing && (
              <button
                onClick={() => { setEditing(true); setEditBody(item.body ?? ""); }}
                className="flex items-center gap-1.5 text-xs font-medium text-[#6E6860] hover:text-[#F5F2EE] border border-[#3A3530] px-3 py-1.5 rounded-sm transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
            )}
            <button onClick={onClose} className="text-[#6E6860] hover:text-[#F5F2EE] transition-colors p-1.5">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content preview */}
        <div className="p-5">
          <div className="border border-[#2A2520] rounded-sm p-4 space-y-4 bg-[#161310]">
            {/* Profile row */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-sm bg-[#2A2520] flex items-center justify-center">
                <Icon className={cn("w-4 h-4", platformConfig?.color ?? "text-[#6E6860]")} />
              </div>
              <div>
                <p className="text-sm font-medium text-[#F5F2EE]">Your Brand</p>
                <p className={cn("text-xs", platformConfig?.color ?? "text-[#6E6860]")}>
                  {item.platform === "twitter" ? "@yourbrand" : item.platform === "linkedin" ? "Your Company · Followers" : "@yourbrand"}
                </p>
              </div>
            </div>

            {/* Media images */}
            {selectedMedia.length > 0 && (
              <div className={cn(
                "rounded-sm overflow-hidden",
                selectedMedia.length === 1 ? "" : "grid grid-cols-2 gap-1"
              )}>
                {selectedMedia.slice(0, 4).map((media, i) => (
                  <div
                    key={media.id}
                    className="relative cursor-pointer group"
                    onClick={() => setLightboxUrl(media.public_url)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={media.public_url}
                      alt={media.alt_text ?? "Post image"}
                      className={cn(
                        "w-full object-cover transition group-hover:brightness-90",
                        selectedMedia.length === 1 ? "max-h-72" : "h-32"
                      )}
                    />
                    {selectedMedia.length > 4 && i === 3 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-lg">
                        +{selectedMedia.length - 4}
                      </div>
                    )}
                    <div className="absolute top-1.5 left-1.5">
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-[#1F1B17] text-[#6E6860] border border-[#2A2520]">
                        {media.type === "generated" ? "AI" : "↑"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Content body */}
            {editing ? (
              <div className="space-y-3">
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={7}
                  maxLength={charLimit}
                  className="w-full px-3 py-2 bg-[#0D0B09] border border-[#3A3530] rounded-sm text-sm text-[#F5F2EE] focus:border-[#C8843A] focus:outline-none resize-none leading-relaxed"
                  autoFocus
                />
                <div className="flex items-center justify-between">
                  <span className={cn("text-xs font-mono", editBody.length > charLimit ? "text-[#D97070]" : "text-[#6E6860]")}>
                    {editBody.length}/{charLimit}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={updateMutation.isPending}
                      className="flex items-center gap-1.5 text-xs font-medium bg-[#C8843A] text-[#0D0B09] px-3 py-1.5 rounded-sm hover:bg-[#DE913A] transition-colors disabled:opacity-50"
                    >
                      {updateMutation.isPending ? <div className="w-3 h-3 border-2 border-[#0D0B09] border-t-transparent rounded-full animate-spin" /> : <Save className="w-3 h-3" />}
                      Save
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="text-xs font-medium text-[#6E6860] hover:text-[#F5F2EE] px-3 py-1.5 rounded-sm border border-[#3A3530] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#B8B2A9] whitespace-pre-wrap leading-relaxed">
                {saved ? editBody : (item.body ?? "")}
              </p>
            )}

            {/* Hashtags */}
            {item.hashtags && item.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.hashtags.map((tag) => (
                  <span key={tag} className={cn("text-xs font-medium", platformConfig?.color ?? "text-[#6E6860]")}>
                    #{tag.replace(/^#/, "")}
                  </span>
                ))}
              </div>
            )}

            {/* Media count hint */}
            {selectedMedia.length === 0 && mediaList.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-[#6E6860] border border-[#2A2520] rounded-sm px-3 py-2">
                <ImageIcon className="w-3.5 h-3.5" />
                {mediaList.length} image{mediaList.length !== 1 ? "s" : ""} available — none selected for publishing
              </div>
            )}

            {/* Engagement mock */}
            <div className="flex items-center gap-5 pt-2 border-t border-[#2A2520] text-xs text-[#524D47]">
              <span>👍 Like</span>
              <span>💬 Comment</span>
              <span>🔁 Share</span>
              {item.platform === "linkedin" && <span>📤 Repost</span>}
            </div>
          </div>
        </div>

        {/* Lightbox */}
        {lightboxUrl && (
          <div
            className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightboxUrl(null)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxUrl}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-4 right-4 text-white bg-black/40 hover:bg-black/60 rounded-sm p-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* CTA footer */}
        <div className="px-5 pb-5 flex flex-col gap-2">
          {isConnected ? (
            <div className="flex gap-2">
              <button
                onClick={() => onPublish(item.id, item.platform)}
                disabled={isPublishing}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-sm text-sm font-medium text-[#0D0B09] bg-[#C8843A] hover:bg-[#DE913A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPublishing ? <div className="w-4 h-4 border-2 border-[#0D0B09] border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                Publish now
              </button>
              <button
                onClick={() => onSchedule(item)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm border border-[#3A3530] text-sm font-medium text-[#B8B2A9] hover:border-[#524D47] hover:text-[#F5F2EE] bg-transparent transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Schedule
              </button>
            </div>
          ) : (
            <a
              href={`/api/auth/${item.platform}?brand_id=${item.brand_id}`}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-sm border border-[#3A3530] text-sm font-medium text-[#B8B2A9] hover:border-[#524D47] hover:text-[#F5F2EE] transition-colors"
            >
              <Link2 className="w-4 h-4" />
              Connect {platformConfig?.label ?? item.platform} to publish
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Pagination ─────────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1.5 mt-4">
      <button onClick={() => onChange(page - 1)} disabled={page === 1} className="p-2 rounded-sm border border-[#2A2520] text-[#6E6860] hover:border-[#3A3530] hover:text-[#B8B2A9] disabled:opacity-40 transition-colors">
        <ChevronLeft className="w-4 h-4" />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn("w-8 h-8 rounded-sm text-sm font-medium transition-colors", p === page ? "bg-[#C8843A] text-[#0D0B09]" : "border border-[#2A2520] text-[#6E6860] hover:border-[#3A3530] hover:text-[#B8B2A9]")}
        >
          {p}
        </button>
      ))}
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages} className="p-2 rounded-sm border border-[#2A2520] text-[#6E6860] hover:border-[#3A3530] hover:text-[#B8B2A9] disabled:opacity-40 transition-colors">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Main Inner Page ───────────────────────────────────────────────────────────

function PublishPageInner() {
  const searchParams = useSearchParams();
  const { data: brands = [] } = useBrands();
  const [selectedBrandId, setSelectedBrandId] = useState("");

  const activeBrandId = selectedBrandId || brands[0]?.id || "";

  const { data: accounts = [] } = useSocialAccounts(activeBrandId);
  const { data: contentList = [] } = useContentList(activeBrandId);
  const { data: scheduledPosts = [] } = useScheduledPosts(activeBrandId);
  const disconnectMutation = useDisconnectAccount(activeBrandId);
  const publishMutation = usePublishContent(activeBrandId);
  const scheduleMutation = useScheduleContent(activeBrandId);
  const cancelMutation = useCancelScheduled(activeBrandId);

  // Modal state
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null);
  const [schedulePicker, setSchedulePicker] = useState<{ contentId: string; platform: string; scheduledAt: string } | null>(null);

  // History pagination
  const [historyPage, setHistoryPage] = useState(1);

  const approvedContent = contentList.filter((c) => c.status === "approved");
  const upcomingPosts = scheduledPosts.filter((p) => p.status === "scheduled");
  const historyPosts = scheduledPosts.filter((p) => p.status !== "scheduled");
  const historyTotalPages = Math.max(1, Math.ceil(historyPosts.length / HISTORY_PAGE_SIZE));
  const paginatedHistory = historyPosts.slice((historyPage - 1) * HISTORY_PAGE_SIZE, historyPage * HISTORY_PAGE_SIZE);

  // Stats
  const stats = useMemo(() => ({
    connected: accounts.length,
    scheduled: upcomingPosts.length,
    published: historyPosts.filter((p) => p.status === "published").length,
    failed: historyPosts.filter((p) => p.status === "failed").length,
  }), [accounts, upcomingPosts, historyPosts]);

  function getAccount(platform: string) {
    return accounts.find((a) => a.platform === platform);
  }

  function handlePublish(contentId: string, platform: string) {
    toast.promise(
      publishMutation.mutateAsync({ contentId, platforms: [platform] }).then((res) => {
        setPreviewItem(null);
        return res;
      }),
      {
        loading: `Publishing to ${platform}…`,
        success: (res) => {
          const result = res.results[0];
          return result.status === "published" ? `Published to ${platform}! ✓` : `Failed: ${result.error}`;
        },
        error: (e) => e.message,
      }
    );
  }

  function openSchedulePicker(item: ContentItem) {
    setPreviewItem(null);
    setSchedulePicker({ contentId: item.id, platform: item.platform, scheduledAt: getDefaultDateTime() });
  }

  function handleSchedule() {
    if (!schedulePicker) return;
    toast.promise(
      scheduleMutation.mutateAsync({
        contentId: schedulePicker.contentId,
        platform: schedulePicker.platform,
        scheduledAt: new Date(schedulePicker.scheduledAt).toISOString(),
      }).then(() => setSchedulePicker(null)),
      {
        loading: "Scheduling…",
        success: `Scheduled for ${formatScheduledAt(schedulePicker.scheduledAt)} ✓`,
        error: (e) => e.message,
      }
    );
  }

  const connected = searchParams.get("connected");
  const error = searchParams.get("error");

  return (
    <div className="p-8 max-w-6xl">
      {/* Preview modal */}
      {previewItem && (
        <ContentPreviewModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
          onPublish={handlePublish}
          onSchedule={openSchedulePicker}
          isPublishing={publishMutation.isPending}
          isConnected={!!getAccount(previewItem.platform)}
          platformConfig={PLATFORM_CONFIG[previewItem.platform as keyof typeof PLATFORM_CONFIG]}
        />
      )}

      {/* Schedule picker modal */}
      {schedulePicker && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#1F1B17] border border-[#2A2520] rounded-sm p-6 w-full max-w-sm shadow-lg">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#C8843A]" />
                <h3 className="text-sm font-medium text-[#F5F2EE]">Schedule post</h3>
              </div>
              <button onClick={() => setSchedulePicker(null)} className="text-[#6E6860] hover:text-[#F5F2EE] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-1.5">Platform</label>
                <p className="text-sm font-medium text-[#F5F2EE] capitalize">
                  {schedulePicker.platform === "twitter" ? "Twitter / X" : "LinkedIn"}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-1.5">Publish date & time</label>
                <input
                  type="datetime-local"
                  value={schedulePicker.scheduledAt}
                  min={getMinDateTime()}
                  onChange={(e) => setSchedulePicker((prev) => prev ? { ...prev, scheduledAt: e.target.value } : prev)}
                  className="w-full h-9 px-3 bg-[#161310] border border-[#3A3530] rounded-sm text-sm text-[#F5F2EE] focus:border-[#C8843A] focus:outline-none"
                />
                <p className="text-xs text-[#524D47] mt-1">Times are in your local timezone</p>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSchedule}
                  disabled={scheduleMutation.isPending || !schedulePicker.scheduledAt}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-sm bg-[#C8843A] hover:bg-[#DE913A] text-[#0D0B09] text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {scheduleMutation.isPending ? <div className="w-4 h-4 border-2 border-[#0D0B09] border-t-transparent rounded-full animate-spin" /> : <Calendar className="w-4 h-4" />}
                  Confirm schedule
                </button>
                <button onClick={() => setSchedulePicker(null)} className="flex-1 py-2.5 rounded-sm border border-[#3A3530] text-sm font-medium text-[#B8B2A9] hover:border-[#524D47] hover:text-[#F5F2EE] transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="mb-8 pb-6 border-b border-[#2A2520] flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#F5F2EE] tracking-tight">Publish</h1>
          <p className="mt-1 text-sm text-[#928C83]">
            Publish now or schedule posts to go live at the perfect time.
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

      {/* Banners */}
      {connected && (
        <div className="flex items-center gap-2 border border-[#1E4D30] bg-[#0E2A1A] rounded-sm px-4 py-3 mb-6 text-[#4D9A6A] text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Successfully connected {connected === "twitter" ? "Twitter / X" : "LinkedIn"}!
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 border border-[#5A2020] bg-[#2A0E0E] rounded-sm px-4 py-3 mb-6 text-[#D97070] text-sm">
          <XCircle className="w-4 h-4 shrink-0" />
          Connection failed: {error.replace(/_/g, " ")}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#2A2520] border border-[#2A2520] rounded-sm mb-8">
        <div className="p-6">
          <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-1">Connected</p>
          <p className="text-3xl font-semibold text-[#F5F2EE] tracking-tight">{stats.connected}</p>
        </div>
        <div className="p-6">
          <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-1">Scheduled</p>
          <p className="text-3xl font-semibold text-[#F5F2EE] tracking-tight">{stats.scheduled}</p>
          {stats.scheduled > 0 && <p className="text-xs text-[#C8843A] mt-1">upcoming</p>}
        </div>
        <div className="p-6">
          <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-1">Published</p>
          <p className="text-3xl font-semibold text-[#F5F2EE] tracking-tight">{stats.published}</p>
          {stats.published > 0 && <p className="text-xs text-[#3D7A5A] mt-1">total</p>}
        </div>
        <div className="p-6">
          <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-1">Failed</p>
          <p className="text-3xl font-semibold text-[#F5F2EE] tracking-tight">{stats.failed}</p>
          {stats.failed > 0 && <p className="text-xs text-[#D97070] mt-1">need attention</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: accounts + scheduled queue */}
        <div className="lg:col-span-1 space-y-6">
          <div>
            <h2 className="text-base font-medium text-[#F5F2EE] mb-4">Connected accounts</h2>
            <div className="border border-[#2A2520] rounded-sm divide-y divide-[#1F1B17]">
              {Object.entries(PLATFORM_CONFIG).map(([platform, config]) => {
                const account = getAccount(platform);
                const Icon = config.icon;
                return (
                  <div key={platform} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-7 h-7 rounded-sm bg-[#1F1B17] flex items-center justify-center shrink-0">
                      <Icon className={cn("w-4 h-4", account ? config.color : "text-[#6E6860]")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#F5F2EE]">{config.label}</p>
                      {account ? (
                        <p className={cn("text-xs", config.color)}>{account.account_name}</p>
                      ) : (
                        <p className="text-xs text-[#6E6860]">Not connected</p>
                      )}
                    </div>
                    {account ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#3D7A5A] shrink-0" />
                        <button
                          onClick={() => toast.promise(disconnectMutation.mutateAsync(account.id), {
                            loading: "Disconnecting…", success: `${config.label} disconnected`, error: "Failed",
                          })}
                          className="text-xs text-[#6E6860] hover:text-[#D97070] transition-colors flex items-center gap-1"
                        >
                          <Unlink className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <a
                        href={activeBrandId ? config.connectHref(activeBrandId) : "#"}
                        className="text-xs font-medium px-3 py-1.5 rounded-sm border border-[#3A3530] text-[#B8B2A9] hover:border-[#524D47] hover:text-[#F5F2EE] transition-colors"
                      >
                        Connect
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming scheduled queue */}
          {upcomingPosts.length > 0 && (
            <div>
              <h2 className="text-base font-medium text-[#F5F2EE] mb-4">
                Scheduled
                <span className="ml-2 text-xs font-normal text-[#6E6860]">({upcomingPosts.length})</span>
              </h2>
              <div className="border border-[#2A2520] rounded-sm divide-y divide-[#1F1B17]">
                {upcomingPosts.map((post) => {
                  const cfg = PLATFORM_CONFIG[post.platform as keyof typeof PLATFORM_CONFIG];
                  const Icon = cfg?.icon ?? Zap;
                  return (
                    <div key={post.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-7 h-7 rounded-sm bg-[#1F1B17] flex items-center justify-center shrink-0">
                        <Icon className={cn("w-3.5 h-3.5", cfg?.color ?? "text-[#6E6860]")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#F5F2EE] capitalize">{post.platform}</p>
                        <p className="text-xs text-[#6E6860]">{formatScheduledAt(post.scheduled_at)}</p>
                      </div>
                      <button
                        onClick={() => toast.promise(cancelMutation.mutateAsync(post.id), {
                          loading: "Cancelling…", success: "Cancelled", error: "Failed",
                        })}
                        className="text-[#6E6860] hover:text-[#D97070] transition-colors"
                        title="Cancel"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: approved content + history */}
        <div className="lg:col-span-2 space-y-8">
          {/* Ready to publish */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-medium text-[#F5F2EE]">Ready to publish</h2>
              {approvedContent.length > 0 && (
                <span className="text-xs text-[#3D7A5A]">{approvedContent.length} approved</span>
              )}
            </div>

            {approvedContent.length === 0 ? (
              <div className="border border-[#2A2520] border-dashed rounded-sm p-12 text-center">
                <p className="text-sm font-medium text-[#6E6860]">No approved content yet</p>
                <p className="text-xs text-[#524D47] mt-1">Go to Content → approve posts → they appear here.</p>
              </div>
            ) : (
              <div className="border border-[#2A2520] rounded-sm divide-y divide-[#1F1B17]">
                {approvedContent.map((item) => {
                  const cfg = PLATFORM_CONFIG[item.platform as keyof typeof PLATFORM_CONFIG];
                  const account = getAccount(item.platform);
                  const isConnected = !!account;
                  const Icon = cfg?.icon ?? Zap;

                  return (
                    <div key={item.id} className="flex items-start justify-between px-4 py-4 hover:bg-[#161310] transition-colors">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-7 h-7 rounded-sm bg-[#1F1B17] flex items-center justify-center shrink-0 mt-0.5">
                          <Icon className={cn("w-3.5 h-3.5", cfg?.color ?? "text-[#6E6860]")} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-[#F5F2EE] capitalize">{item.platform}</span>
                            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em] bg-[#0E2A1A] text-[#4D9A6A] border border-[#1E4D30] rounded-sm">
                              approved
                            </span>
                          </div>
                          <p className="text-xs text-[#6E6860] line-clamp-2 leading-relaxed">{item.body}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-3">
                        <button
                          onClick={() => setPreviewItem(item)}
                          className="text-xs font-medium text-[#6E6860] hover:text-[#B8B2A9] border border-[#2A2520] hover:border-[#3A3530] px-2.5 py-1.5 rounded-sm transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> Preview
                        </button>
                        {isConnected ? (
                          <>
                            <button
                              onClick={() => handlePublish(item.id, item.platform)}
                              disabled={publishMutation.isPending}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-sm text-xs font-medium text-[#0D0B09] bg-[#C8843A] hover:bg-[#DE913A] transition-colors disabled:opacity-50"
                            >
                              {publishMutation.isPending ? <div className="w-3 h-3 border-2 border-[#0D0B09] border-t-transparent rounded-full animate-spin" /> : <Send className="w-3 h-3" />}
                              Publish
                            </button>
                            <button
                              onClick={() => setSchedulePicker({ contentId: item.id, platform: item.platform, scheduledAt: getDefaultDateTime() })}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-sm text-xs font-medium border border-[#2A2520] text-[#6E6860] hover:border-[#3A3530] hover:text-[#B8B2A9] transition-colors"
                            >
                              <Calendar className="w-3 h-3" /> Schedule
                            </button>
                          </>
                        ) : (
                          <a
                            href={activeBrandId ? cfg?.connectHref(activeBrandId) ?? "#" : "#"}
                            className="flex items-center gap-1 text-xs text-[#6E6860] hover:text-[#B8B2A9] transition-colors"
                          >
                            <Link2 className="w-3 h-3" /> Connect
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Publish history */}
          {historyPosts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-medium text-[#F5F2EE]">Publish history</h2>
                <span className="text-xs text-[#6E6860]">{historyPosts.length} total</span>
              </div>
              <div className="border border-[#2A2520] rounded-sm divide-y divide-[#1F1B17]">
                {paginatedHistory.map((post) => {
                  const statusBadge =
                    post.status === "published" ? "bg-[#0E2A1A] text-[#4D9A6A] border-[#1E4D30]" :
                    post.status === "failed" ? "bg-[#2A0E0E] text-[#D97070] border-[#5A2020]" :
                    "bg-[#2A1E08] text-[#C8943A] border-[#4D3810]";
                  return (
                    <div key={post.id} className="flex items-center gap-3 px-4 py-3">
                      <div className={cn("w-1.5 h-1.5 rounded-full shrink-0",
                        post.status === "published" ? "bg-[#3D7A5A]" :
                        post.status === "failed" ? "bg-[#8A3030]" : "bg-[#C8843A]"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#F5F2EE] capitalize">
                          {post.platform}
                          {post.error_message && (
                            <span className="text-xs text-[#D97070] font-normal ml-2 truncate">— {post.error_message.slice(0, 60)}</span>
                          )}
                        </p>
                        <p className="text-xs text-[#6E6860]">
                          {post.status === "published"
                            ? `Published ${formatRelativeTime(post.published_at ?? post.scheduled_at)}`
                            : formatScheduledAt(post.scheduled_at)}
                        </p>
                      </div>
                      {post.platform_post_id && post.platform === "twitter" && (
                        <a href={`https://twitter.com/i/web/status/${post.platform_post_id}`} target="_blank" rel="noopener noreferrer" className="text-[#6E6860] hover:text-[#1DA1F2] transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em] rounded-sm border shrink-0",
                        statusBadge
                      )}>
                        {post.status}
                      </span>
                    </div>
                  );
                })}
              </div>
              <Pagination page={historyPage} totalPages={historyTotalPages} onChange={setHistoryPage} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PublishPage() {
  return (
    <Suspense fallback={<div className="p-8 flex items-center justify-center"><div className="animate-spin w-5 h-5 border-2 border-[#C8843A] border-t-transparent rounded-full" /></div>}>
      <PublishPageInner />
    </Suspense>
  );
}
