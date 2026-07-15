import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Brand {
  id: string;
  org_id: string;
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
  updated_at: string;
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

// ── Supabase helper ───────────────────────────────────────────────────────────

function supabase() {
  return createClient();
}

async function getCurrentUser() {
  const { data: { user } } = await supabase().auth.getUser();
  return user;
}

// ── Brand hooks ───────────────────────────────────────────────────────────────

export function useBrands() {
  return useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) return [];
      const { data, error } = await supabase()
        .from("brands")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Brand[];
    },
  });
}

export function useBrand(brandId: string) {
  return useQuery({
    queryKey: ["brands", brandId],
    queryFn: async () => {
      const { data, error } = await supabase()
        .from("brands")
        .select("*")
        .eq("id", brandId)
        .single();
      if (error) throw new Error(error.message);
      return data as Brand;
    },
    enabled: !!brandId,
  });
}

export function useBrandHealthScore(brandId: string) {
  return useQuery({
    queryKey: ["brands", brandId, "health-score"],
    queryFn: async () => {
      const { data: brand } = await supabase()
        .from("brands")
        .select("*")
        .eq("id", brandId)
        .single();
      const { count } = await supabase()
        .from("knowledge_documents")
        .select("*", { count: "exact", head: true })
        .eq("brand_id", brandId)
        .eq("status", "indexed");

      let score = 0;
      const reasons: string[] = [];
      if (brand?.name) score += 10;
      if (brand?.description) score += 15;
      if (brand?.mission) score += 10;
      if (brand?.tone_of_voice) score += 10;
      if (brand?.target_audience) score += 15;
      if (brand?.website_url) score += 10;
      if (brand?.keywords?.length) score += 10;
      if ((count ?? 0) >= 1) { score += 10; reasons.push(`${count} document(s) indexed`); }
      if ((count ?? 0) >= 5) { score += 10; reasons.push("Rich knowledge base"); }

      return { score: Math.min(score, 100), reasons };
    },
    enabled: !!brandId,
  });
}

export function useCreateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      website_url?: string;
      industry?: string;
      description?: string;
      tone_of_voice?: string;
      mission?: string;
    }) => {
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      // Get or create an organization for this user
      let orgId: string;
      const { data: existingOrg } = await supabase()
        .from("organizations")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (existingOrg) {
        orgId = existingOrg.id;
      } else {
        // Auto-create an org using the user's id as the org id for simplicity
        const slug = user.email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9]/g, "-") ?? user.id;
        const { data: newOrg, error: orgError } = await supabase()
          .from("organizations")
          .insert({
            id: user.id,  // use user id as org id (1:1 for solo users)
            name: data.name,
            slug: `${slug}-${Date.now()}`,
          })
          .select("id")
          .single();
        if (orgError) throw new Error(`Failed to create org: ${orgError.message}`);
        orgId = newOrg.id;
      }

      const { data: brand, error } = await supabase()
        .from("brands")
        .insert({
          org_id: orgId,
          name: data.name,
          website_url: data.website_url ?? "",
          industry: data.industry ?? "",
          description: data.description ?? "",
          tone_of_voice: data.tone_of_voice ?? "professional",
          mission: data.mission ?? "",
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return brand as Brand;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brands"] }),
  });
}

export function useUpdateBrand(brandId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Brand>) => {
      const { data: brand, error } = await supabase()
        .from("brands")
        .update(data)
        .eq("id", brandId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return brand as Brand;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brands", brandId] }),
  });
}

// ── Knowledge hooks ───────────────────────────────────────────────────────────

export function useKnowledgeDocs(brandId: string) {
  return useQuery({
    queryKey: ["knowledge", brandId],
    queryFn: async () => {
      const { data, error } = await supabase()
        .from("knowledge_documents")
        .select("*")
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as KnowledgeDocument[];
    },
    enabled: !!brandId,
    refetchInterval: (query) => {
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
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Create document record in Supabase
      const { data: doc, error } = await supabase()
        .from("knowledge_documents")
        .insert({
          brand_id: brandId,
          name: file.name,
          type: file.name.toLowerCase().endsWith(".pdf") ? "pdf"
            : file.name.toLowerCase().endsWith(".docx") ? "docx" : "txt",
          status: "pending",
        })
        .select()
        .single();
      if (error) throw new Error(error.message);

      // 2. Upload file to Supabase Storage
      const filePath = `${brandId}/${doc.id}/${file.name}`;
      const { error: uploadError } = await supabase()
        .storage
        .from("knowledge")
        .upload(filePath, file);

      if (uploadError) {
        // Mark as failed if storage fails
        await supabase()
          .from("knowledge_documents")
          .update({ status: "failed", error_message: uploadError.message })
          .eq("id", doc.id);
        throw new Error(uploadError.message);
      }

      // Update with file path
      await supabase()
        .from("knowledge_documents")
        .update({ file_path: filePath, status: "pending" })
        .eq("id", doc.id);

      return doc;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["knowledge", brandId] }),
  });
}

export function useIngestUrl(brandId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { url: string; name?: string }) => {
      const { data: doc, error } = await supabase()
        .from("knowledge_documents")
        .insert({
          brand_id: brandId,
          name: data.name || data.url,
          type: "url",
          source_url: data.url,
          status: "pending",
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return doc;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["knowledge", brandId] }),
  });
}

export function useDeleteDocument(brandId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (docId: string) => {
      const { error } = await supabase()
        .from("knowledge_documents")
        .delete()
        .eq("id", docId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["knowledge", brandId] }),
  });
}

export function useKnowledgeSearch(brandId: string) {
  return useMutation({
    mutationFn: async (query: string) => {
      // Direct Supabase full-text search as fallback when FastAPI is offline
      const { data, error } = await supabase()
        .from("knowledge_chunks")
        .select("content, document_id, metadata")
        .eq("brand_id", brandId)
        .textSearch("content", query, { type: "plain" })
        .limit(5);
      if (error) throw new Error(error.message);
      return {
        query,
        results: (data ?? []).map((r, i) => ({
          content: r.content,
          document_id: r.document_id,
          score: 1 - i * 0.1,
          metadata: r.metadata ?? {},
        })) as SearchResult[],
      };
    },
  });
}
