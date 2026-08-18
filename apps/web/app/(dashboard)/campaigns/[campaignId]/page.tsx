"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useCampaign } from "@/hooks/use-campaign";
import { useContentList, useApproveContent, useRejectContent, useUpdateContent } from "@/hooks/use-content";
import { cn } from "@/lib/utils";
import { formatRelativeTime, formatDate } from "@/lib/utils";
import {
  Calendar, ArrowLeft, Loader2, Twitter, Linkedin, Instagram,
  Mail, BookOpen, CheckCircle2, XCircle, Clock, Pencil,
  Save, X, Copy, Check, ChevronLeft, ChevronRight,
  BarChart3, Zap, TrendingUp, Hash, Filter, Send
} from "lucide-react";
import { toast } from "sonner";
import type { ContentItem } from "@/hooks/use-content";

const PLATFORM_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  linkedin: { icon: Linkedin, color: "text-[#0077B5]", bg: "bg-[#0077B5]/10" },
  twitter: { icon: Twitter, color: "text-[#1DA1F2]", bg: "bg-[#1DA1F2]/10" },
  instagram: { icon: Instagram, color: "text-[#E1306C]", bg: "bg-[#E1306C]/10" },
  email: { icon: Mail, color: "text-amber-600", bg: "bg-amber-500/10" },
  blog: { icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-500/10" },
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20",
  published: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

const STATUS_CAMPAIGN: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Draft", color: "text-amber-600", bg: "bg-amber-500/10 border border-amber-500/20" },
  active: { label: "Active", color: "text-emerald-600", bg: "bg-emerald-500/10 border border-emerald-500/20" },
  paused: { label: "Paused", color: "text-blue-600", bg: "bg-blue-500/10 border border-blue-500/20" },
  completed: { label: "Completed", color: "text-purple-600", bg: "bg-purple-500/10 border border-purple-500/20" },
};

const PAGE_SIZE = 10;

function ContentCard({
  item,
  brandId,
}: {
  item: ContentItem;
  brandId: string;
}) {
  const approveMutation = useApproveContent(brandId);
  const rejectMutation = useRejectContent(brandId);
  const updateMutation = useUpdateContent(brandId);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(item.body ?? "");
  const [copied, setCopied] = useState(false);
  const platform = PLATFORM_CONFIG[item.platform] ?? PLATFORM_CONFIG.linkedin;
  const Icon = platform.icon;
  const day = (item.ai_metadata as Record<string, unknown>)?.calendar_day as number | undefined;

  function handleCopy() {
    navigator.clipboard.writeText(item.body ?? "").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function saveEdit() {
    toast.promise(
      updateMutation.mutateAsync({ id: item.id, body: editBody }).then(() => setEditing(false)),
      { loading: "Saving…", success: "Saved ✓", error: "Failed" }
    );
  }

  return (
    <div className={cn(
      "bg-card border rounded-2xl p-4 space-y-3 transition hover:shadow-sm",
      item.status === "approved" ? "border-emerald-500/30" :
      item.status === "published" ? "border-blue-500/30" :
      "border-border"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {day && (
            <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">D{day}</span>
          )}
          <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", platform.bg)}>
            <Icon className={cn("w-3.5 h-3.5", platform.color)} />
          </div>
          <div>
            <span className="text-xs font-semibold text-foreground capitalize">{item.platform}</span>
            <p className="text-xs text-muted-foreground">{formatRelativeTime(item.created_at)}</p>
          </div>
        </div>
        <span className={cn("text-xs px-2 py-0.5 rounded-full font-semibold border capitalize", STATUS_STYLES[item.status] ?? "bg-muted text-muted-foreground")}>
          {item.status}
        </span>
      </div>

      {/* Topic/title from ai_metadata */}
      {!!(item.ai_metadata as Record<string, unknown>)?.topic && (
        <p className="text-xs font-semibold text-astra-600 uppercase tracking-wide">
          {String((item.ai_metadata as Record<string, unknown>).topic)}
        </p>
      )}

      {/* Hook */}
      {item.hook && (
        <p className="text-xs text-muted-foreground italic line-clamp-1">"{item.hook}"</p>
      )}

      {/* Body */}
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            rows={4}
            className="w-full px-3 py-2.5 rounded-xl border border-astra-500 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-astra-500/30 resize-none"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={saveEdit}
              disabled={updateMutation.isPending}
              className="flex items-center gap-1 text-xs font-semibold bg-astra-500 hover:bg-astra-600 text-white px-3 py-1.5 rounded-lg transition disabled:opacity-50"
            >
              {updateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Save
            </button>
            <button onClick={() => setEditing(false)} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-lg border border-border transition">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="relative group">
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed line-clamp-3 pr-6">
            {item.body}
          </p>
          <button
            onClick={() => { setEditing(true); setEditBody(item.body ?? ""); }}
            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition p-1 rounded-md hover:bg-accent text-muted-foreground"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 pt-1 border-t border-border">
        {item.status === "draft" && (
          <>
            <button
              onClick={() => toast.promise(approveMutation.mutateAsync(item.id), {
                loading: "Approving…", success: "Approved ✓", error: "Failed"
              })}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1.5 rounded-lg transition"
            >
              <CheckCircle2 className="w-3 h-3" /> Approve
            </button>
            <button
              onClick={() => toast.promise(rejectMutation.mutateAsync(item.id), {
                loading: "Rejecting…", success: "Rejected", error: "Failed"
              })}
              className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1.5 rounded-lg transition"
            >
              <XCircle className="w-3 h-3" /> Reject
            </button>
          </>
        )}
        <button
          onClick={handleCopy}
          className="ml-auto flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg border border-transparent hover:border-border transition"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
        {item.status === "approved" && (
          <Link
            href="/publish"
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1.5 rounded-lg transition"
          >
            <Send className="w-3 h-3" /> Publish
          </Link>
        )}
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2">
      <button onClick={() => onChange(page - 1)} disabled={page === 1} className="p-2 rounded-lg border border-border bg-card hover:bg-accent disabled:opacity-40 transition">
        <ChevronLeft className="w-4 h-4" />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button key={p} onClick={() => onChange(p)} className={cn("w-8 h-8 rounded-lg text-sm font-medium transition", p === page ? "bg-astra-500 text-white" : "border border-border bg-card hover:bg-accent text-muted-foreground")}>
          {p}
        </button>
      ))}
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages} className="p-2 rounded-lg border border-border bg-card hover:bg-accent disabled:opacity-40 transition">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function CampaignDetailPage({ params }: { params: { campaignId: string } }) {
  const { campaignId } = params;
  const { data: campaign, isLoading: campLoading } = useCampaign(campaignId);
  const { data: allContent = [], isLoading: contentLoading } = useContentList(campaign?.brand_id ?? "");

  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Filter to this campaign's content
  const campaignContent = useMemo(() =>
    allContent.filter((c) => (c as ContentItem & { campaign_id?: string }).campaign_id === campaignId),
    [allContent, campaignId]
  );

  const filtered = useMemo(() =>
    campaignContent.filter((c) => {
      const byPlatform = platformFilter === "all" || c.platform === platformFilter;
      const byStatus = statusFilter === "all" || c.status === statusFilter;
      return byPlatform && byStatus;
    }),
    [campaignContent, platformFilter, statusFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => ({
    total: campaignContent.length,
    approved: campaignContent.filter((c) => c.status === "approved").length,
    published: campaignContent.filter((c) => c.status === "published").length,
    draft: campaignContent.filter((c) => c.status === "draft").length,
  }), [campaignContent]);

  const platforms = useMemo(() => {
    const set = new Set(campaignContent.map((c) => c.platform));
    return ["all", ...Array.from(set)];
  }, [campaignContent]);

  if (campLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p className="font-semibold">Campaign not found.</p>
        <Link href="/campaigns" className="text-astra-500 hover:text-astra-600 text-sm mt-2 inline-block">← Back to campaigns</Link>
      </div>
    );
  }

  const statusCfg = STATUS_CAMPAIGN[campaign.status] ?? STATUS_CAMPAIGN.draft;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Back link */}
      <Link href="/campaigns" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition w-fit">
        <ArrowLeft className="w-4 h-4" /> All campaigns
      </Link>

      {/* Hero */}
      <div className="bg-gradient-to-br from-astra-500/8 via-background to-purple-500/5 border border-border rounded-3xl p-7">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-astra-500/20 to-purple-500/20 flex items-center justify-center shrink-0">
              <Calendar className="w-7 h-7 text-astra-500" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-foreground">{campaign.name}</h1>
                <span className={cn("text-xs px-2.5 py-1 rounded-full font-semibold", statusCfg.bg, statusCfg.color)}>
                  {statusCfg.label}
                </span>
              </div>
              {campaign.goal && (
                <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">{campaign.goal}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                {campaign.start_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(campaign.start_date)} — {campaign.end_date ? formatDate(campaign.end_date) : "ongoing"}
                  </span>
                )}
                {campaign.platforms?.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    {campaign.platforms.map((p) => {
                      const cfg = PLATFORM_CONFIG[p];
                      if (!cfg) return null;
                      const Icon = cfg.icon;
                      return <Icon key={p} className={cn("w-3.5 h-3.5", cfg.color)} />;
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
          <Link
            href="/content"
            className="flex items-center gap-2 text-sm font-semibold bg-astra-500 hover:bg-astra-600 text-white px-4 py-2.5 rounded-xl transition shadow-lg shadow-astra-500/20 shrink-0"
          >
            <Zap className="w-4 h-4" /> Generate content
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total posts", value: stats.total, icon: BarChart3, color: "text-foreground", bg: "bg-muted" },
          { label: "Draft", value: stats.draft, icon: Clock, color: "text-amber-600", bg: "bg-amber-500/10" },
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
        {/* Platform */}
        <div className="flex gap-1 flex-wrap">
          {platforms.map((p) => {
            const cfg = p !== "all" ? PLATFORM_CONFIG[p] : null;
            const Icon = cfg?.icon;
            return (
              <button
                key={p}
                onClick={() => { setPlatformFilter(p); setPage(1); }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition",
                  platformFilter === p ? "bg-astra-500 text-white" : "border border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {Icon && <Icon className="w-3 h-3" />}
                {p === "all" ? "All platforms" : p}
              </button>
            );
          })}
        </div>
        <div className="w-px h-5 bg-border" />
        {/* Status */}
        <div className="flex gap-1 flex-wrap">
          {["all", "draft", "approved", "rejected", "published"].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition",
                statusFilter === s ? "bg-foreground text-background" : "border border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} post{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Content grid */}
      {contentLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : paginated.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl text-muted-foreground">
          <Hash className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="font-semibold text-foreground">No content found</p>
          <p className="text-sm mt-1">
            {campaignContent.length === 0
              ? "Generate content from the Content page and assign it to this campaign."
              : "Try clearing your filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginated.map((item) => (
            <ContentCard key={item.id} item={item} brandId={campaign.brand_id} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
    </div>
  );
}
