import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface ContentMedia {
  id: string;
  content_id: string;
  brand_id: string;
  type: "uploaded" | "generated";
  storage_path: string;
  public_url: string;
  prompt?: string;
  alt_text?: string;
  sort_order: number;
  selected: boolean;
  created_at: string;
}

// ── Fetch all media for a content item ────────────────────────────────────────
export function useContentMedia(contentId: string) {
  return useQuery({
    queryKey: ["content_media", contentId],
    queryFn: async () => {
      const res = await fetch(`/api/content/${contentId}/media`);
      if (!res.ok) throw new Error("Failed to load media");
      const data = await res.json();
      return data.media as ContentMedia[];
    },
    enabled: !!contentId,
  });
}

// ── Upload image ──────────────────────────────────────────────────────────────
export function useUploadMedia(contentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, altText }: { file: File; altText?: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      if (altText) formData.append("alt_text", altText);

      const res = await fetch(`/api/content/${contentId}/media`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Upload failed");
      }
      return res.json() as Promise<{ media: ContentMedia }>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["content_media", contentId] }),
  });
}

// ── Generate AI image ─────────────────────────────────────────────────────────
export function useGenerateMedia(contentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      prompt,
      referenceMdiaId,
    }: {
      prompt?: string;
      referenceMdiaId?: string;
    }) => {
      const res = await fetch(`/api/content/${contentId}/media/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, reference_media_id: referenceMdiaId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Image generation failed");
      }
      return res.json() as Promise<{ media: ContentMedia; reference_note?: string }>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["content_media", contentId] }),
  });
}

// ── Update media (select/deselect, alt text, sort order) ─────────────────────
export function useUpdateMedia(contentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      mediaId,
      updates,
    }: {
      mediaId: string;
      updates: Partial<Pick<ContentMedia, "selected" | "alt_text" | "sort_order">>;
    }) => {
      const res = await fetch(`/api/content/${contentId}/media/${mediaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Update failed");
      }
      return res.json() as Promise<{ media: ContentMedia }>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["content_media", contentId] }),
  });
}

// ── Delete media ─────────────────────────────────────────────────────────────
export function useDeleteMedia(contentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mediaId: string) => {
      const res = await fetch(`/api/content/${contentId}/media/${mediaId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Delete failed");
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["content_media", contentId] }),
  });
}
