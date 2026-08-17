import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// POST /api/schedule — create a scheduled post
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { content_id, brand_id, platform, scheduled_at } = body;

  if (!content_id || !brand_id || !platform || !scheduled_at) {
    return NextResponse.json(
      { error: "content_id, brand_id, platform, and scheduled_at are required" },
      { status: 400 }
    );
  }

  const scheduledDate = new Date(scheduled_at);
  if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
    return NextResponse.json(
      { error: "scheduled_at must be a valid future date/time" },
      { status: 400 }
    );
  }

  const admin = getAdmin();

  // Verify content belongs to this brand
  const { data: content } = await admin
    .from("content")
    .select("id, brand_id, status")
    .eq("id", content_id)
    .eq("brand_id", brand_id)
    .single();

  if (!content) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }

  if (content.status !== "approved") {
    return NextResponse.json(
      { error: "Only approved content can be scheduled" },
      { status: 400 }
    );
  }

  const { data: scheduled, error } = await admin
    .from("scheduled_posts")
    .insert({
      content_id,
      brand_id,
      platform,
      scheduled_at: scheduledDate.toISOString(),
      status: "scheduled",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ scheduled });
}

// DELETE /api/schedule?id=xxx — cancel a scheduled post
export async function DELETE(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const admin = getAdmin();
  const { error } = await admin
    .from("scheduled_posts")
    .delete()
    .eq("id", id)
    .eq("status", "scheduled"); // only allow cancelling pending ones

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
