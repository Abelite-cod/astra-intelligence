"use client";

import Link from "next/link";
import { useBrands } from "@/hooks/use-brand";
import { useCampaigns } from "@/hooks/use-campaign";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { Plus, Megaphone, Loader2, Calendar } from "lucide-react";
import { useState } from "react";

export default function CampaignsPage() {
  const { data: brands = [] } = useBrands();
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const activeBrandId = selectedBrandId || brands[0]?.id || "";
  const { data: campaigns = [], isLoading } = useCampaigns(activeBrandId);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
          <p className="text-muted-foreground text-sm mt-1">
            AI-generated content campaigns with 30-day calendars.
          </p>
        </div>
        <Link
          href="/campaigns/new"
          className="flex items-center gap-2 bg-astra-500 hover:bg-astra-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
        >
          <Plus className="w-4 h-4" /> New campaign
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl">
          <Megaphone className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="font-semibold text-foreground mb-1">No campaigns yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first AI-generated 30-day campaign.
          </p>
          <Link
            href="/campaigns/new"
            className="inline-flex items-center gap-2 bg-astra-500 hover:bg-astra-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
          >
            <Plus className="w-4 h-4" /> Build a campaign
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-card border border-border rounded-xl p-5 hover:border-astra-500/50 hover:shadow-sm transition"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-astra-500/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-astra-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{campaign.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{campaign.description ?? "No description"}</p>
                </div>
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                    campaign.status === "active" ? "bg-green-500/10 text-green-600" :
                    campaign.status === "completed" ? "bg-blue-500/10 text-blue-600" :
                    "bg-yellow-500/10 text-yellow-600"
                  )}
                >
                  {campaign.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Created {formatDate(campaign.created_at)}</span>
                <div className="flex gap-1">
                  {campaign.platforms?.slice(0, 3).map((p) => (
                    <span key={p} className="capitalize">{p}</span>
                  )).reduce((acc: React.ReactNode[], el, i, arr) => [
                    ...acc, el, i < arr.length - 1 ? <span key={`sep-${i}`}>·</span> : null
                  ], [])}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
