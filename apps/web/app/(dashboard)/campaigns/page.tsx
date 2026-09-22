"use client";

import Link from "next/link";
import { useBrands } from "@/hooks/use-brand";
import { useCampaigns } from "@/hooks/use-campaign";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import {
  Plus, Megaphone, Calendar, ChevronDown,
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
  email: { icon: Mail, color: "text-[#6E6860]" },
  blog: { icon: BookOpen, color: "text-[#6E6860]" },
};

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  draft:     { label: "Draft",     badgeClass: "bg-[#2A1E08] text-[#C8943A] border-[#4D3810]" },
  active:    { label: "Active",    badgeClass: "bg-[#0E2A1A] text-[#4D9A6A] border-[#1E4D30]" },
  paused:    { label: "Paused",    badgeClass: "bg-[#0E1E2A] text-[#5B9BD5] border-[#1C3650]" },
  completed: { label: "Completed", badgeClass: "bg-[#1F1B17] text-[#B8B2A9] border-[#2A2520]" },
  archived:  { label: "Archived",  badgeClass: "bg-[#1F1B17] text-[#6E6860] border-[#2A2520]" },
};

const STATUS_FILTERS = ["all", "active", "draft", "paused", "completed", "archived"];

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
    <div className="p-8 max-w-6xl">
      {/* Page header */}
      <div className="mb-8 pb-6 border-b border-[#2A2520] flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#F5F2EE] tracking-tight">Campaigns</h1>
          <p className="mt-1 text-sm text-[#928C83]">
            ASTRA-generated 30-day content strategies.
          </p>
        </div>
        <div className="flex items-center gap-3">
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
          <Link
            href="/campaigns/new"
            className="flex items-center gap-2 bg-[#C8843A] text-[#0D0B09] px-4 py-2 text-sm font-medium rounded-sm hover:bg-[#DE913A] transition-colors"
          >
            <Plus className="w-4 h-4" /> New campaign
          </Link>
        </div>
      </div>

      {/* Stats row */}
      {campaigns.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#2A2520] border border-[#2A2520] rounded-sm mb-6">
          <div className="p-6">
            <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-1">Total</p>
            <p className="text-3xl font-semibold text-[#F5F2EE] tracking-tight">{stats.total}</p>
          </div>
          <div className="p-6">
            <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-1">Active</p>
            <p className="text-3xl font-semibold text-[#F5F2EE] tracking-tight">{stats.active}</p>
            {stats.active > 0 && <p className="text-xs text-[#3D7A5A] mt-1">running</p>}
          </div>
          <div className="p-6">
            <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-1">Completed</p>
            <p className="text-3xl font-semibold text-[#F5F2EE] tracking-tight">{stats.completed}</p>
          </div>
          <div className="p-6">
            <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-1">Draft</p>
            <p className="text-3xl font-semibold text-[#F5F2EE] tracking-tight">{stats.draft}</p>
          </div>
        </div>
      )}

      {/* Status filter tabs */}
      {campaigns.length > 0 && (
        <div className="flex border-b border-[#2A2520] mb-6 gap-5">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "pb-3 text-sm font-medium border-b-2 -mb-px capitalize transition-colors",
                statusFilter === s
                  ? "text-[#F5F2EE] border-[#C8843A]"
                  : "text-[#6E6860] border-transparent hover:text-[#B8B2A9]"
              )}
            >
              {s === "all" ? `All (${campaigns.length})` : s}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin w-5 h-5 border-2 border-[#C8843A] border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 && campaigns.length === 0 ? (
        <div className="border border-[#2A2520] border-dashed rounded-sm p-16 text-center">
          <p className="text-sm font-medium text-[#6E6860]">No campaigns yet</p>
          <p className="text-xs text-[#524D47] mt-1 mb-4">Create your first ASTRA-generated 30-day content campaign.</p>
          <Link
            href="/campaigns/new"
            className="inline-flex items-center gap-2 bg-[#C8843A] text-[#0D0B09] px-4 py-2 text-sm font-medium rounded-sm hover:bg-[#DE913A] transition-colors"
          >
            <Plus className="w-4 h-4" /> Build your first campaign
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-[#2A2520] border-dashed rounded-sm p-12 text-center">
          <p className="text-sm font-medium text-[#6E6860]">No {statusFilter} campaigns</p>
          <button onClick={() => setStatusFilter("all")} className="text-xs text-[#C8843A] hover:text-[#DE913A] mt-2 transition-colors">
            Clear filter
          </button>
        </div>
      ) : (
        <div className="border border-[#2A2520] rounded-sm divide-y divide-[#1F1B17]">
          {filtered.map((campaign) => {
            const status = STATUS_CONFIG[campaign.status] ?? STATUS_CONFIG.draft;
            return (
              <Link
                key={campaign.id}
                href={`/campaigns/${campaign.id}`}
                className="flex items-center justify-between px-4 py-4 hover:bg-[#161310] transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-sm bg-[#1F1B17] flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-[#6E6860]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#F5F2EE] truncate">{campaign.name}</p>
                    <p className="text-xs text-[#6E6860] truncate mt-0.5">
                      {campaign.goal || campaign.description || "No goal specified"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 ml-4">
                  {/* Platform icons */}
                  {campaign.platforms && campaign.platforms.length > 0 && (
                    <div className="hidden sm:flex items-center gap-1">
                      {campaign.platforms.slice(0, 3).map((p) => {
                        const cfg = PLATFORM_ICONS[p];
                        if (!cfg) return null;
                        const Icon = cfg.icon;
                        return (
                          <div key={p} className="w-5 h-5 rounded-sm bg-[#1F1B17] flex items-center justify-center" title={p}>
                            <Icon className={cn("w-3 h-3", cfg.color)} />
                          </div>
                        );
                      })}
                      {campaign.platforms.length > 3 && (
                        <span className="text-xs text-[#6E6860]">+{campaign.platforms.length - 3}</span>
                      )}
                    </div>
                  )}
                  <span className="hidden md:block text-xs text-[#524D47]">
                    {formatDate(campaign.created_at)}
                  </span>
                  <span className={cn(
                    "inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em] rounded-sm border",
                    status.badgeClass
                  )}>
                    {status.label}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#3A3530]" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
