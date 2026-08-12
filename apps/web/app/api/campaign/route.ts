import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import type { CalendarDay } from "@/types/campaign";

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brand_id, goal, description, platforms, calendar, start_date } = await request.json();
  if (!brand_id || !goal || !calendar?.length) {
    return NextResponse.json({ error: "brand_id, goal, and calendar required" }, { status: 400 });
  }

  const admin = getAdmin();
  const startDate = start_date ? new Date(start_date) : new Date();

  // Create campaign record
  const { data: campaign, error: campErr } = await admin.from("campaigns").insert({
    brand_id,
    created_by: user.id,
    name: goal.slice(0, 80),
    goal: "awareness",
    description: description ?? goal,
    platforms: platforms ?? [],
    start_date: startDate.toISOString().split("T")[0],
    end_date: new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    status: "draft",
    ai_strategy: { goal, calendar_generated: true, total_posts: calendar.length },
  }).select().single();

  if (campErr) return NextResponse.json({ error: campErr.message }, { status: 500 });

  // Create content stubs for each calendar day
  const contentRows = (calendar as CalendarDay[]).map((day) => {
    const postDate = new Date(startDate.getTime() + day.date_offset * 24 * 60 * 60 * 1000);
    return {
      brand_id,
      campaign_id: campaign.id,
      platform: day.platform,
      type: day.content_type,
      title: day.topic,
      hook: day.hook,
      body: `[Day ${day.day}] ${day.topic}\n\n${day.hook}`,
      status: "draft",
      ai_metadata: {
        calendar_day: day.day,
        topic: day.topic,
        goal: day.goal,
        hook: day.hook,
        scheduled_date: postDate.toISOString().split("T")[0],
      },
    };
  });

  const { data: contents, error: contentErr } = await admin
    .from("content")
    .insert(contentRows)
    .select("id, platform, type, title, hook, ai_metadata");

  if (contentErr) return NextResponse.json({ error: contentErr.message }, { status: 500 });

  return NextResponse.json({
    campaign_id: campaign.id,
    campaign_name: campaign.name,
    posts_created: contents?.length ?? 0,
    calendar_with_ids: (calendar as CalendarDay[]).map((day, i) => ({
      ...day,
      content_id: contents?.[i]?.id,
    })),
  });
}

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const brand_id = searchParams.get("brand_id");
  if (!brand_id) return NextResponse.json({ error: "brand_id required" }, { status: 400 });

  const admin = getAdmin();
  const { data, error } = await admin
    .from("campaigns")
    .select("*")
    .eq("brand_id", brand_id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaigns: data });
}
