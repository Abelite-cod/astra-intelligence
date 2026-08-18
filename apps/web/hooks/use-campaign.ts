import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CalendarDay, Campaign } from "@/types/campaign";

export interface GeneratedCalendar {
  calendar: CalendarDay[];
  brand_name: string;
  goal: string;
  duration: number;
  platforms: string[];
  total_posts: number;
}

export interface SavedCampaign {
  campaign_id: string;
  campaign_name: string;
  posts_created: number;
  calendar_with_ids: CalendarDay[];
}

export function useCampaign(campaignId: string) {
  return useQuery({
    queryKey: ["campaign", campaignId],
    queryFn: async () => {
      const res = await fetch(`/api/campaign/${campaignId}`);
      if (!res.ok) throw new Error("Failed to load campaign");
      return res.json() as Promise<Campaign>;
    },
    enabled: !!campaignId,
  });
}

export function useCampaigns(brandId: string) {
  return useQuery({
    queryKey: ["campaigns", brandId],
    queryFn: async () => {
      const res = await fetch(`/api/campaign?brand_id=${brandId}`);
      if (!res.ok) throw new Error("Failed to load campaigns");
      const data = await res.json();
      return (data.campaigns ?? []) as Campaign[];
    },
    enabled: !!brandId,
  });
}

export function useGenerateCampaign() {
  return useMutation({
    mutationFn: async (data: {
      brand_id: string;
      goal: string;
      duration?: number;
      platforms?: string[];
    }) => {
      const res = await fetch("/api/campaign/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Campaign generation failed");
      }
      return res.json() as Promise<GeneratedCalendar>;
    },
  });
}

export function useSaveCampaign(brandId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      brand_id: string;
      goal: string;
      description?: string;
      platforms: string[];
      calendar: CalendarDay[];
      start_date?: string;
    }) => {
      const res = await fetch("/api/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to save campaign");
      }
      return res.json() as Promise<SavedCampaign>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns", brandId] }),
  });
}
