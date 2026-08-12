// Shared types for Campaign Builder

export interface CalendarDay {
  day: number;           // 1–30
  date_offset: number;   // days from campaign start
  platform: string;      // linkedin | twitter | instagram | email | blog
  content_type: string;  // post | thread | carousel | newsletter | article
  topic: string;         // brief topic for this day
  goal: string;          // what this post achieves
  hook: string;          // attention-grabbing first line
  content_id?: string;   // filled after saving to DB
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
