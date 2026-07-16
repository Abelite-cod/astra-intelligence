import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface ContentItem {
  id: string;
  brand_id: string;
  platform: string;
  type: string;
  body: string;
  hook?: string;
  cta?: string;
  hashtags?: string[];
  status: "draft" | "approved" | "rejected" | "published";
  ai_metadata?: Record<string, unknown>;
  created_at: string;
}

export interface GeneratedContent {
  linkedin?: { body: string; hook: string; cta: string; hashtags: string[] };
  twitter?: { body: string; hook: string; cta: string; hashtags: string[] };
  instagram?: { body: string; hook: string; cta: string; hashtags: string[] };
}

function supabase() {
  return createClient();
}

export function useContentList(brandId: string) {
  return useQuery({
    queryKey: ["content", brandId],
    queryFn: async () => {
      const { data, error } = await supabase()
        .from("content")
        .select("*")
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as ContentItem[];
    },
    enabled: !!brandId,
  });
}

export function useGenerateContent(brandId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      brief,
      platforms,
    }: {
      brief: string;
      platforms: string[];
    }) => {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id: brandId, brief, platforms }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Generation failed");
      }
      return res.json() as Promise<{
        generated: GeneratedContent;
        saved_content: ContentItem[];
        model: string;
        tokens_used: number;
      }>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["content", brandId] }),
  });
}

export function useApproveContent(brandId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contentId: string) => {
      const { error } = await supabase()
        .from("content")
        .update({ status: "approved" })
        .eq("id", contentId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["content", brandId] }),
  });
}

export function useRejectContent(brandId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contentId: string) => {
      const { error } = await supabase()
        .from("content")
        .update({ status: "rejected" })
        .eq("id", contentId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["content", brandId] }),
  });
}

export function useUpdateContent(brandId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: string }) => {
      const { error } = await supabase()
        .from("content")
        .update({ body })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["content", brandId] }),
  });
}

export function useDeleteContent(brandId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contentId: string) => {
      const { error } = await supabase()
        .from("content")
        .delete()
        .eq("id", contentId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["content", brandId] }),
  });
}
