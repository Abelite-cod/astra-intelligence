// Shared types for Campaign Builder

export interface CalendarDay {
  day: number;           // 1–30
  date_offset: number;   // days from campaign start
  platform: string;      // linkedin | twitter | instagram | email | blog | tiktok
  content_type: string;  // post | thread | carousel | newsletter | article | talking_head | voiceover_broll | text_animation
  topic: string;         // brief topic for this day
  goal: string;          // what this post achieves
  hook: string;          // attention-grabbing first line
  content_id?: string;   // filled after saving to DB
  // TikTok-specific fields (optional)
  format?: string;                // talking_head | voiceover_broll | text_animation | screen_recording
  estimated_duration_sec?: number; // 15 | 30 | 60
  narrative_arc?: string;          // problem_solution | listicle | story | tutorial | reveal
}

export interface Campaign {
  id: string;
  brand_id: string;
  name: string;
  goal: string;
  description?: string;
  platforms: string[];
  start_date?: string;
  end_date?: string;
  status: "draft" | "active" | "paused" | "completed" | "archived";
  ai_strategy?: Record<string, unknown>;
  created_at: string;
}
