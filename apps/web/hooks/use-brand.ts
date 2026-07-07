import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Brand {
  id: string;
  name: string;
  description?: string;
  mission?: string;
  tone_of_voice?: string;
  website_url?: string;
  industry?: string;
  keywords?: string[];
  hashtags?: string[];
  onboarded: boolean;
  created_at: string;
}

export interface KnowledgeDocument {
  id: string;
  name: string;
  type: string;
  source_url?: string;
  status: "pending" | "processing" | "indexed" | "failed";
  chunk_count: number;
  token_count: number;
  error_message?: string;
  created_at: string;
}

export interface SearchResult {
  content: string;
  document_id: string;
  score: number;
  metadata: Record<string, unknown>;
}

// ── Brand hooks ───────────────────────────────────────────────────────────────

export function useBrands() {
  return useQuery({
    queryKey: ["brands"],
    queryFn: () => api.get("/v1/brands").then((r) => r.brands as Brand[]),
  });
}

export function useBrand(brandId: string) {
  return useQuery({
    queryKey: ["brands", brandId],
    queryFn: () => api.get(`/v1/brands/${brandId}`) as Promise<Brand>,
    enabled: !!brandId,
  });
}

export function useBrandHealthScore(brandId: string) {
  return useQuery({
    queryKey: ["brands", brandId, "health-score"],
    queryFn: () => api.get(`/v1/brands/${brandId}/health-score`),
    enabled: !!brandId,
  });
}

export function useCreateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Brand>) => api.post("/v1/brands", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brands"] }),
  });
}

export function useUpdateBrand(brandId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Brand>) =>
      api.patch(`/v1/brands/${brandId}`, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["brands", brandId] }),
  });
}

// ── Knowledge hooks ───────────────────────────────────────────────────────────

export function useKnowledgeDocs(brandId: string) {
  return useQuery({
    queryKey: ["knowledge", brandId],
    queryFn: () =>
      api
        .get(`/v1/brands/${brandId}/knowledge`)
        .then((r) => r.documents as KnowledgeDocument[]),
    enabled: !!brandId,
    refetchInterval: (query) => {
      // Poll every 3s while any doc is processing
      const docs = query.state.data as KnowledgeDocument[] | undefined;
      const hasProcessing = docs?.some(
        (d) => d.status === "pending" || d.status === "processing"
      );
      return hasProcessing ? 3000 : false;
    },
  });
}

export function useUploadDocument(brandId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/brands/${brandId}/knowledge/upload`,
        {
          method: "POST",
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {},
          body: formData,
        }
      );
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["knowledge", brandId] }),
  });
}

export function useIngestUrl(brandId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { url: string; name?: string }) =>
      api.post(`/v1/brands/${brandId}/knowledge/url`, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["knowledge", brandId] }),
  });
}

export function useDeleteDocument(brandId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (docId: string) =>
      api.delete(`/v1/brands/${brandId}/knowledge/${docId}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["knowledge", brandId] }),
  });
}

export function useKnowledgeSearch(brandId: string) {
  return useMutation({
    mutationFn: (query: string) =>
      api.post(`/v1/brands/${brandId}/knowledge/search`, {
        query,
        top_k: 20,
        top_n: 5,
      }),
  });
}
