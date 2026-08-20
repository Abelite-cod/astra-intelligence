import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TikTokScene {
  order: number;
  duration_sec: number;
  visual_direction: string;
  action: string;
  voiceover: string;
  text_overlay?: string;
  transition?: string;
}

export interface TikTokScript {
  id: string;
  content_id: string;
  brand_id: string;
  hook: string;
  hook_type: string;
  concept: string;
  narrative_arc: string;
  full_script?: string;
  voiceover_text?: string;
  on_screen_text: string[];
  scenes: TikTokScene[];
  duration_sec: number;
  format: string;
  visual_style?: string;
  music_suggestion?: string;
  caption?: string;
  hashtags: string[];
  cta?: string;
  privacy_level: string;
  allow_duet: boolean;
  allow_stitch: boolean;
  allow_comment: boolean;
  response_type?: string;
  original_video_url?: string;
  original_creator?: string;
  original_claim?: string;
  response_angle?: string;
  stitch_clip_start_sec?: number;
  stitch_clip_end_sec?: number;
  tiktok_upload_id?: string;
  tiktok_video_id?: string;
  upload_status: string;
  estimated_hook_score?: number;
  pattern_match: string[];
  created_at: string;
}

export interface TikTokMemoryPattern {
  id: string;
  brand_id: string;
  pattern_type: string;
  pattern_label: string;
  pattern_data: Record<string, unknown>;
  confidence: number;
  source: string;
  post_count: number;
  avg_views?: number;
  avg_engagement?: number;
  is_active: boolean;
  created_at: string;
}

export interface TikTokRespondQueueItem {
  id: string;
  brand_id: string;
  original_url: string;
  original_video_id?: string;
  original_creator?: string;
  original_caption?: string;
  original_claim?: string;
  response_type: string;
  response_angle?: string;
  user_context?: string;
  content_id?: string;
  status: string;
  created_at: string;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

function supabase() {
  return createClient();
}

/** Fetch tiktok_scripts row for a given content_id */
export function useTikTokScript(contentId: string) {
  return useQuery({
    queryKey: ["tiktok_script", contentId],
    queryFn: async () => {
      const { data, error } = await supabase()
        .from("tiktok_scripts")
        .select("*")
        .eq("content_id", contentId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as TikTokScript | null;
    },
    enabled: !!contentId,
  });
}

/** Generate a TikTok-native script via Claude */
export function useGenerateTikTok(brandId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      brief: string;
      campaign_id?: string;
      format?: string;
      duration_sec?: number;
      narrative_arc?: string;
      response_type?: string;
      original_url?: string;
      original_caption?: string;
      response_angle?: string;
      user_context?: string;
    }) => {
      const res = await fetch("/api/tiktok/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id: brandId, ...params }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "TikTok generation failed");
      }
      return res.json() as Promise<{ content: Record<string, unknown>; script: TikTokScript }>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["content", brandId] });
    },
  });
}

/** Update a tiktok_scripts row */
export function useUpdateTikTokScript(brandId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      scriptId,
      updates,
    }: {
      scriptId: string;
      updates: Partial<TikTokScript>;
    }) => {
      const { error } = await supabase()
        .from("tiktok_scripts")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", scriptId);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_data, { updates }) => {
      qc.invalidateQueries({ queryKey: ["tiktok_script"] });
      qc.invalidateQueries({ queryKey: ["content", brandId] });
    },
  });
}

/** List TikTok memory patterns for a brand */
export function useTikTokMemory(brandId: string, patternType?: string) {
  return useQuery({
    queryKey: ["tiktok_memory", brandId, patternType],
    queryFn: async () => {
      let query = supabase()
        .from("tiktok_memory")
        .select("*")
        .eq("brand_id", brandId)
        .eq("is_active", true)
        .order("confidence", { ascending: false });
      if (patternType) query = query.eq("pattern_type", patternType);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data ?? []) as TikTokMemoryPattern[];
    },
    enabled: !!brandId,
  });
}

/** Delete a TikTok memory pattern */
export function useDeleteTikTokPattern(brandId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patternId: string) => {
      const { error } = await supabase()
        .from("tiktok_memory")
        .update({ is_active: false })
        .eq("id", patternId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tiktok_memory", brandId] }),
  });
}

/** Analyze historical TikTok posts → extract patterns */
export function useAnalyzeTikTokPosts(brandId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      posts: Array<{
        url?: string;
        caption?: string;
        views?: number;
        likes?: number;
        comments?: number;
        shares?: number;
      }>;
      import_method: "urls" | "text" | "manual";
    }) => {
      const res = await fetch("/api/tiktok/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id: brandId, ...params }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Analysis failed");
      }
      return res.json() as Promise<{ patterns_created: number; patterns: TikTokMemoryPattern[] }>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tiktok_memory", brandId] }),
  });
}

/** List tiktok_respond_queue for a brand */
export function useTikTokRespondQueue(brandId: string) {
  return useQuery({
    queryKey: ["tiktok_queue", brandId],
    queryFn: async () => {
      const { data, error } = await supabase()
        .from("tiktok_respond_queue")
        .select("*")
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw new Error(error.message);
      return (data ?? []) as TikTokRespondQueueItem[];
    },
    enabled: !!brandId,
  });
}

/** Add a video to the respond queue */
export function useAddToRespondQueue(brandId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      original_url: string;
      response_type: "duet" | "stitch";
      response_angle: string;
      user_context?: string;
    }) => {
      const videoId = params.original_url.match(/\/video\/(\d+)/)?.[1];
      const creator = params.original_url.match(/@([^/]+)/)?.[1];
      const { data, error } = await supabase()
        .from("tiktok_respond_queue")
        .insert({
          brand_id: brandId,
          original_url: params.original_url,
          original_video_id: videoId ?? null,
          original_creator: creator ? `@${creator}` : null,
          response_type: params.response_type,
          response_angle: params.response_angle,
          user_context: params.user_context ?? null,
          status: "queued",
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as TikTokRespondQueueItem;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tiktok_queue", brandId] }),
  });
}
