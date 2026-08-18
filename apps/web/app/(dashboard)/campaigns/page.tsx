"use client";

import Link from "next/link";
import { useBrands } from "@/hooks/use-brand";
import { useCampaigns } from "@/hooks/use-campaign";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import {
  Plus, Megaphone, Loader2, Calendar, ChevronDown,
  Twitter, Linkedin, Instagram, Mail, BookOpen,
  TrendingUp, Zap, CheckCircle2, Clock, BarChart3,
  ChevronRight, Filter
} from "lucide-react";
import { useState, useMemo } from "react";
import type { Campaign } from "@/types/campaign";

const PLATFORM_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  linkedin: { icon: Linkedin, color: "text-[#0077B5]" },
  twitter: { icon: Twitter, color: "text-[#1DA1F2]" },
  instagram: { icon: Instagram, color: "text-[#E1306C]" },
  email: { icon: Mail, color: "text-amber-600" },
  blog: { icon: BookOpen, color: "text-emerald-600" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  draft: { label: "Draft", color: "text-amber-600", bg: "bg-amber-500/10 border-amber-500/20", dot: "bg-amber-500" },
  active: { label: "Active", color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-500" },
  paused: { label: "Paused", color: "text-blue-600", bg: "bg-blue-500/10 border-blue-500/20", dot: "bg-blue-500" },
  completed: { label: "Completed", color: "text-purple-600", bg: "bg-purple-500/10 border-purple-500/20", dot: "bg-purple-500" },
  archived: { label: "Archived", color: "text-muted-foreground", bg: "bg-muted border-border", dot: "bg-muted-foreground" },
};

const STATUS_FILTERS = ["all", "active", "draft", "paused", "completed", "archived"];

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const status = STATUS_CONFIG[campaign.status] ?? STATUS_CONFIG.draft;

  return (
    <Link
      href={`/campaigns/${campaign.id}`}
      className="group bg-card border border-border rounded-2xl p-5 hover:border-astra-500/50 hover:shadow-md transition-all duration-200 flex flex-col gap-4"
    >
      {/* Card header */}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-astra-500/20 to-purple-500/20 flex items-center justify-center shrink-0">
          <Calendar className="w-5 h-5 text-astra-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-bold text-foreground truncate group-hover:text-astra-600 transition-colors">
              {campaign.name}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {campaign.goal || campaign.description || "No goal specified"}
          </p>
        </div>
        <span className={cn(
          "text-xs px-2.5 py-1 rounded-full font-semibold border shrink-0",
          status.bg, status.color
        )}>
          <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1.5", status.dot)} />
          {status.label}
        </span>
      </div>

      {/* Platform icons */}
      {campaign.platforms && campaign.platforms.length > 0 && (
        <div className="flex items-center gap-1.5">
          {campaign.platforms.map((p) => {
            const cfg = PLATFORM_ICONS[p];
            if (!cfg) return null;
            const Icon = cfg.icon;
            return (
              <div key={p} className="w-6 h-6 rounded-md bg-muted flex items-center justify-center" title={p}>
                <Icon className={cn("w-3.5 h-3.5", cfg.color)} />
              </div>
            );
          })}
          <span className="text-xs text-muted-foreground ml-1">
            {campaign.platforms.length} platform{campaign.platforms.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3 mt-auto">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Created {formatDate(campaign.created_at)}
        </span>
        <span className="flex items-center gap-1 text-astra-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          View details <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  );
}

export default function CampaignsPage() {
  const { data: brands = [] } = useBrands();
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const activeBrandId = selectedBrandId || brands[0]?.id || "";
  const { data: campaigns = [], isLoading } = useCampaigns(activeBrandId);

  const filtered = useMemo(() =>
    statusFilter === "all" ? campaigns : campaigns.filter((c) => c.status === statusFilter),
    [campaigns, statusFilter]
  );

  const stats = useMemo(() => ({
    total: campaigns.length,
    active: campaigns.filter((c) => c.status === "active").length,
    completed: campaigns.filter((c) => c.status === "completed").length,
    draft: campaigns.filter((c) => c.status === "draft").length,
  }), [campaigns]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
          <p className="text-muted-foreground text-sm mt-1">
            AI-generated 30-day content strategies. Click any campaign to view its content.
          </p>
        </div>
        <div className="flex items-center gap-3">
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
          <Link
            href="/campaigns/new"
            className="flex items-center gap-2 bg-gradient-to-r from-astra-500 to-purple-500 hover:from-astra-600 hover:to-purple-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-lg shadow-astra-500/20"
          >
            <Plus className="w-4 h-4" /> New campaign
          </Link>
        </div>
      </div>

      {/* Stats row */}
      {campaigns.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total", value: stats.total, icon: BarChart3, color: "text-foreground", bg: "bg-muted" },
            { label: "Active", value: stats.active, icon: Zap, color: "text-emerald-600", bg: "bg-emerald-500/10" },
            { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-purple-600", bg: "bg-purple-500/10" },
            { label: "Draft", value: stats.draft, icon: Clock, color: "text-amber-600", bg: "bg-amber-500/10" },
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
      )}

      {/* Status filter */}
      {campaigns.length > 0 && (
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition",
                statusFilter === s
                  ? "bg-astra-500 text-white"
                  : "border border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {s === "all" ? `All (${campaigns.length})` : s}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 && campaigns.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-border rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-astra-500/10 flex items-center justify-center mx-auto mb-4">
            <Megaphone className="w-8 h-8 text-astra-500 opacity-60" />
          </div>
          <p className="font-bold text-foreground text-lg mb-1">No campaigns yet</p>
          <p className="text-sm text-muted-foreground mb-6">
            Create your first AI-generated 30-day content campaign.
          </p>
          <Link
            href="/campaigns/new"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-astra-500 to-purple-500 hover:from-astra-600 hover:to-purple-600 text-white text-sm font-semibold px-6 py-3 rounded-xl transition shadow-lg shadow-astra-500/20"
          >
            <Plus className="w-4 h-4" /> Build your first campaign
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl text-muted-foreground">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="font-semibold text-foreground">No {statusFilter} campaigns</p>
          <button onClick={() => setStatusFilter("all")} className="text-sm text-astra-500 hover:text-astra-600 mt-1 transition">
            Clear filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}
