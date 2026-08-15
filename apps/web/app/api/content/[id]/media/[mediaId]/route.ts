import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── PATCH /api/content/[id]/media/[mediaId] ───────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; mediaId: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const admin = getAdmin();

  const allowed = ["selected", "alt_text", "sort_order"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("content_media")
    .update(updates)
    .eq("id", params.mediaId)
    .eq("content_id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ media: data });
}

// ── DELETE /api/content/[id]/media/[mediaId] ──────────────────────────────────
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; mediaId: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getAdmin();

  // Load media to get storage_path
  const { data: media } = await admin
    .from("content_media")
    .select("storage_path")
    .eq("id", params.mediaId)
    .eq("content_id", params.id)
    .single();

  if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete from storage
  await admin.storage.from("content-media").remove([media.storage_path]);

  // Delete DB row
  const { error } = await admin
    .from("content_media")
    .delete()
    .eq("id", params.mediaId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
