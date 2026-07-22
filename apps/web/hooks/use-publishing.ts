import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface SocialAccount {
  id: string;
  brand_id: string;
  platform: "twitter" | "linkedin" | "instagram" | "facebook";
  account_id: string;
  account_name: string;
  account_url?: string;
  status: "active" | "expired" | "error";
  created_at: string;
}

export interface PublishResult {
  platform: string;
  status: "published" | "failed";
  post_id?: string;
  error?: string;
}

function supabase() {
  return createClient();
}

export function useSocialAccounts(brandId: string) {
  return useQuery({
    queryKey: ["social_accounts", brandId],
    queryFn: async () => {
      const { data, error } = await supabase()
        .from("social_accounts")
        .select("*")
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as SocialAccount[];
    },
    enabled: !!brandId,
  });
}

export function useDisconnectAccount(brandId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: string) => {
      const res = await fetch(
        `/api/auth/disconnect?account_id=${accountId}&brand_id=${brandId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Disconnect failed");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social_accounts", brandId] }),
  });
}

export function usePublishContent(brandId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contentId,
      platforms,
    }: {
      contentId: string;
      platforms: string[];
    }) => {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_id: contentId,
          brand_id: brandId,
          platforms,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Publish failed");
      }
      return res.json() as Promise<{ results: PublishResult[]; content_id: string }>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["content", brandId] });
    },
  });
}

export function useScheduledPosts(brandId: string) {
  return useQuery({
    queryKey: ["scheduled_posts", brandId],
    queryFn: async () => {
      const { data, error } = await supabase()
        .from("scheduled_posts")
        .select("*, content(platform, body, hook, hashtags, status)")
        .eq("brand_id", brandId)
        .order("scheduled_at", { ascending: false })
        .limit(50);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: !!brandId,
  });
}
