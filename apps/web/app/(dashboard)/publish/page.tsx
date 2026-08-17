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
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import {
  Twitter, Linkedin, Send, CheckCircle2, XCircle,
  Loader2, Link2, Unlink, ChevronDown, Clock, ExternalLink,
  Zap, Calendar, X, Trash2, Eye, Pencil, Save, ChevronLeft,
  ChevronRight, Hash, Instagram
} from "lucide-react";
import { toast } from "sonner";

// ── Constants ─────────────────────────────────────────────────────────────────

const PLATFORM_CONFIG = {
  twitter: {
    icon: Twitter,
    label: "Twitter / X",
    color: "text-[#1DA1F2]",
    bg: "bg-[#1DA1F2]/10",
    border: "border-[#1DA1F2]/30",
    buttonBg: "bg-[#1DA1F2] hover:bg-[#1a91da]",
    connectHref: (brandId: string) => `/api/auth/twitter?brand_id=${brandId}`,
  },
  linkedin: {
    icon: Linkedin,
    label: "LinkedIn",
    color: "text-[#0077B5]",
    bg: "bg-[#0077B5]/10",
    border: "border-[#0077B5]/30",
    buttonBg: "bg-[#0077B5] hover:bg-[#006699]",
    connectHref: (brandId: string) => `/api/auth/linkedin?brand_id=${brandId}`,
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
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(item.body ?? "");
  const [saved, setSaved] = useState(false);
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card rounded-t-2xl">
          <div className="flex items-center gap-3">
            {platformConfig && (
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", platformConfig.bg)}>
                <Icon className={cn("w-4 h-4", platformConfig.color)} />
              </div>
            )}
            <div>
              <p className="font-semibold text-foreground capitalize">{item.platform}</p>
              <p className="text-xs text-muted-foreground">{formatRelativeTime(item.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!editing && (
              <button
                onClick={() => { setEditing(true); setEditBody(item.body ?? ""); }}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-lg transition"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
            )}
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition p-1.5 rounded-lg hover:bg-accent">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Social card preview */}
        <div className="p-6">
          <div className={cn("rounded-xl border p-5 space-y-4", platformConfig?.bg ?? "bg-muted/30", platformConfig?.border ?? "border-border")}>
            {/* Profile row */}
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold", platformConfig?.buttonBg?.split(" ")[0] ?? "bg-muted")}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Your Brand</p>
                <p className={cn("text-xs font-medium", platformConfig?.color ?? "text-muted-foreground")}>
                  {item.platform === "twitter" ? "@yourbrand" : item.platform === "linkedin" ? "Your Company · Followers" : "@yourbrand"}
                </p>
              </div>
              <span className={cn("ml-auto text-xs px-2 py-0.5 rounded-full font-semibold", platformConfig?.color ?? "text-muted-foreground", platformConfig?.bg ?? "bg-muted")}>
                {item.platform}
              </span>
            </div>

            {/* Content */}
            {editing ? (
              <div className="space-y-3">
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={7}
                  maxLength={charLimit}
                  className="w-full px-4 py-3 rounded-xl border border-astra-500 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-astra-500/30 resize-none leading-relaxed"
                  autoFocus
                />
                <div className="flex items-center justify-between">
                  <span className={cn("text-xs font-mono", editBody.length > charLimit ? "text-red-500" : "text-muted-foreground")}>
                    {editBody.length}/{charLimit}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={updateMutation.isPending}
                      className="flex items-center gap-1.5 text-xs font-semibold bg-astra-500 hover:bg-astra-600 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
                    >
                      {updateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      Save
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg border border-border transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {saved ? editBody : (item.body ?? "")}
              </p>
            )}

            {/* Hashtags */}
            {item.hashtags && item.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.hashtags.map((tag) => (
                  <span key={tag} className={cn("text-xs font-semibold", platformConfig?.color ?? "text-astra-500")}>
                    #{tag.replace(/^#/, "")}
                  </span>
                ))}
              </div>
            )}

            {/* Engagement mock */}
            <div className="flex items-center gap-5 pt-2 border-t border-border/60 text-xs text-muted-foreground">
              <span>👍 Like</span>
              <span>💬 Comment</span>
              <span>🔁 Share</span>
              {item.platform === "linkedin" && <span>📤 Repost</span>}
            </div>
          </div>
        </div>

        {/* CTA footer */}
        <div className="px-6 pb-6 flex flex-col gap-3">
          {isConnected ? (
            <div className="flex gap-2">
              <button
                onClick={() => onPublish(item.id, item.platform)}
                disabled={isPublishing}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition shadow-lg",
                  platformConfig?.buttonBg ?? "bg-astra-500 hover:bg-astra-600",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Publish now
              </button>
              <button
                onClick={() => onSchedule(item)}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border bg-background hover:border-astra-500/50 hover:text-astra-600 text-sm font-semibold text-muted-foreground transition"
              >
                <Calendar className="w-4 h-4" />
                Schedule
              </button>
            </div>
          ) : (
            <a
              href={`/api/auth/${item.platform}?brand_id=${item.brand_id}`}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-border bg-background text-sm font-semibold text-muted-foreground hover:text-foreground transition"
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
    <div className="flex items-center justify-center gap-2 mt-4">
      <button onClick={() => onChange(page - 1)} disabled={page === 1} className="p-2 rounded-lg border border-border bg-card hover:bg-accent disabled:opacity-40 transition">
        <ChevronLeft className="w-4 h-4" />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn("w-8 h-8 rounded-lg text-sm font-medium transition", p === page ? "bg-astra-500 text-white" : "border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground")}
        >
          {p}
        </button>
      ))}
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages} className="p-2 rounded-lg border border-border bg-card hover:bg-accent disabled:opacity-40 transition">
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
    <div className="p-8 max-w-6xl mx-auto">
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-astra-500" />
                <h3 className="font-semibold text-foreground">Schedule post</h3>
              </div>
              <button onClick={() => setSchedulePicker(null)} className="text-muted-foreground hover:text-foreground transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Platform</label>
                <p className="text-sm font-semibold text-foreground capitalize">
                  {schedulePicker.platform === "twitter" ? "Twitter / X" : "LinkedIn"}
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Publish date & time</label>
                <input
                  type="datetime-local"
                  value={schedulePicker.scheduledAt}
                  min={getMinDateTime()}
                  onChange={(e) => setSchedulePicker((prev) => prev ? { ...prev, scheduledAt: e.target.value } : prev)}
                  className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-astra-500/40"
                />
                <p className="text-xs text-muted-foreground mt-1">Times are in your local timezone</p>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSchedule}
                  disabled={scheduleMutation.isPending || !schedulePicker.scheduledAt}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-astra-500 hover:bg-astra-600 text-white text-sm font-semibold transition disabled:opacity-50"
                >
                  {scheduleMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                  Confirm schedule
                </button>
                <button onClick={() => setSchedulePicker(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Publish</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Publish now or schedule posts to go live at the perfect time.
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

      {/* Banners */}
      {connected && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 mb-6 text-emerald-600 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Successfully connected {connected === "twitter" ? "Twitter / X" : "LinkedIn"}!
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-6 text-red-600 text-sm">
          <XCircle className="w-4 h-4 shrink-0" />
          Connection failed: {error.replace(/_/g, " ")}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Connected", value: stats.connected, icon: Link2, color: "text-blue-600", bg: "bg-blue-500/10" },
          { label: "Scheduled", value: stats.scheduled, icon: Clock, color: "text-amber-600", bg: "bg-amber-500/10" },
          { label: "Published", value: stats.published, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10" },
          { label: "Failed", value: stats.failed, icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: accounts + scheduled queue */}
        <div className="lg:col-span-1 space-y-5">
          <h2 className="text-sm font-bold text-foreground tracking-wide uppercase text-muted-foreground">Connected accounts</h2>

          {Object.entries(PLATFORM_CONFIG).map(([platform, config]) => {
            const account = getAccount(platform);
            const Icon = config.icon;
            return (
              <div key={platform} className={cn("rounded-2xl border p-4 transition", account ? cn(config.bg, config.border) : "border-border bg-card")}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", account ? config.bg : "bg-muted")}>
                    <Icon className={cn("w-5 h-5", account ? config.color : "text-muted-foreground")} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{config.label}</p>
                    {account && <p className={cn("text-xs font-semibold", config.color)}>{account.account_name}</p>}
                  </div>
                </div>
                {account ? (
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Connected
                    </span>
                    <button
                      onClick={() => toast.promise(disconnectMutation.mutateAsync(account.id), {
                        loading: "Disconnecting…", success: `${config.label} disconnected`, error: "Failed",
                      })}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition"
                    >
                      <Unlink className="w-3 h-3" /> Disconnect
                    </button>
                  </div>
                ) : (
                  <a
                    href={activeBrandId ? config.connectHref(activeBrandId) : "#"}
                    className={cn("flex items-center justify-center gap-2 w-full py-2 rounded-xl text-sm font-semibold transition border border-current", config.color, !activeBrandId && "opacity-50 pointer-events-none")}
                  >
                    <Link2 className="w-3.5 h-3.5" /> Connect {config.label}
                  </a>
                )}
              </div>
            );
          })}

          {/* Upcoming scheduled queue */}
          {upcomingPosts.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wide mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-astra-500" /> Scheduled ({upcomingPosts.length})
              </h3>
              <div className="space-y-2">
                {upcomingPosts.map((post) => {
                  const cfg = PLATFORM_CONFIG[post.platform as keyof typeof PLATFORM_CONFIG];
                  const Icon = cfg?.icon ?? Zap;
                  return (
                    <div key={post.id} className="flex items-start gap-2.5 p-3 rounded-xl border border-astra-500/20 bg-astra-500/5 text-sm">
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", cfg?.bg ?? "bg-muted")}>
                        <Icon className={cn("w-3.5 h-3.5", cfg?.color ?? "text-muted-foreground")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-xs capitalize">{post.platform}</p>
                        <p className="text-xs text-muted-foreground">{formatScheduledAt(post.scheduled_at)}</p>
                      </div>
                      <button
                        onClick={() => toast.promise(cancelMutation.mutateAsync(post.id), {
                          loading: "Cancelling…", success: "Cancelled", error: "Failed",
                        })}
                        className="text-muted-foreground hover:text-destructive transition"
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
        <div className="lg:col-span-2 space-y-6">
          {/* Ready to publish */}
          <div>
            <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              Ready to publish
              {approvedContent.length > 0 && (
                <span className="text-xs font-semibold text-astra-500 bg-astra-500/10 px-2 py-0.5 rounded-full">
                  {approvedContent.length} approved
                </span>
              )}
            </h2>

            {approvedContent.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl text-muted-foreground text-sm">
                <Hash className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="font-semibold">No approved content yet.</p>
                <p className="text-xs mt-1">Go to Content → approve posts → they appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {approvedContent.map((item) => {
                  const cfg = PLATFORM_CONFIG[item.platform as keyof typeof PLATFORM_CONFIG];
                  const account = getAccount(item.platform);
                  const isConnected = !!account;
                  const Icon = cfg?.icon ?? Zap;

                  return (
                    <div key={item.id} className="group bg-card border border-border hover:border-astra-500/40 rounded-2xl p-4 transition hover:shadow-sm">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", cfg?.bg ?? "bg-muted")}>
                          <Icon className={cn("w-4 h-4", cfg?.color ?? "text-muted-foreground")} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-foreground capitalize">{item.platform}</span>
                            <span className="text-xs bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded-full font-semibold">approved</span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{item.body}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2.5 border-t border-border">
                        {/* Preview button */}
                        <button
                          onClick={() => setPreviewItem(item)}
                          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border hover:border-astra-500/40 px-3 py-1.5 rounded-lg transition"
                        >
                          <Eye className="w-3.5 h-3.5" /> Preview
                        </button>

                        {isConnected ? (
                          <>
                            <button
                              onClick={() => handlePublish(item.id, item.platform)}
                              disabled={publishMutation.isPending}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition disabled:opacity-50",
                                cfg?.buttonBg ?? "bg-astra-500 hover:bg-astra-600"
                              )}
                            >
                              {publishMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                              Publish now
                            </button>
                            <button
                              onClick={() => setSchedulePicker({ contentId: item.id, platform: item.platform, scheduledAt: getDefaultDateTime() })}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border bg-background hover:border-astra-500/50 hover:text-astra-600 text-muted-foreground transition"
                            >
                              <Calendar className="w-3 h-3" /> Schedule
                            </button>
                          </>
                        ) : (
                          <a
                            href={activeBrandId ? cfg?.connectHref(activeBrandId) ?? "#" : "#"}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
                          >
                            <Link2 className="w-3.5 h-3.5" /> Connect {cfg?.label ?? item.platform}
                          </a>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">{formatRelativeTime(item.created_at)}</span>
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
              <h2 className="text-sm font-bold text-foreground mb-3">
                Publish history
                <span className="ml-2 text-xs font-normal text-muted-foreground">({historyPosts.length} total)</span>
              </h2>
              <div className="space-y-2">
                {paginatedHistory.map((post) => (
                  <div key={post.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card text-sm hover:border-border/80 transition">
                    <div className={cn("w-2.5 h-2.5 rounded-full shrink-0",
                      post.status === "published" ? "bg-emerald-500" :
                      post.status === "failed" ? "bg-red-500" : "bg-amber-500"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground capitalize">
                        {post.platform}
                        {post.error_message && (
                          <span className="text-xs text-red-500 font-normal ml-2 truncate">— {post.error_message.slice(0, 60)}</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {post.status === "published"
                          ? `Published ${formatRelativeTime(post.published_at ?? post.scheduled_at)}`
                          : formatScheduledAt(post.scheduled_at)}
                      </p>
                    </div>
                    {post.platform_post_id && post.platform === "twitter" && (
                      <a href={`https://twitter.com/i/web/status/${post.platform_post_id}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-[#1DA1F2] transition">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-semibold shrink-0",
                      post.status === "published" ? "bg-emerald-500/10 text-emerald-600" :
                      post.status === "failed" ? "bg-red-500/10 text-red-500" :
                      "bg-amber-500/10 text-amber-600"
                    )}>
                      {post.status}
                    </span>
                  </div>
                ))}
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
    <Suspense fallback={<div className="p-8 flex items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-astra-500 border-t-transparent rounded-full" /></div>}>
      <PublishPageInner />
    </Suspense>
  );
}
