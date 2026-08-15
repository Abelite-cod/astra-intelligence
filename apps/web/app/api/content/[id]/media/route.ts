import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── GET /api/content/[id]/media ────────────────────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getAdmin();
  const { data, error } = await admin
    .from("content_media")
    .select("*")
    .eq("content_id", params.id)
    .order("sort_order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ media: data ?? [] });
}

// ── POST /api/content/[id]/media — upload file ─────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getAdmin();

  // Get content to read brand_id
  const { data: content } = await admin
    .from("content")
    .select("brand_id")
    .eq("id", params.id)
    .single();
  if (!content) return NextResponse.json({ error: "Content not found" }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const altText = formData.get("alt_text") as string | undefined;

  if (!file) return NextResponse.json({ error: "file is required" }, { status: 400 });

  // Validate file type
  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, GIF, WEBP allowed" }, { status: 400 });
  }

  // Get current max sort_order
  const { data: existing } = await admin
    .from("content_media")
    .select("sort_order")
    .eq("content_id", params.id)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  // Upload to Supabase Storage
  const ext = file.name.split(".").pop() ?? "jpg";
  const storagePath = `${content.brand_id}/${params.id}/${crypto.randomUUID()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await admin.storage
    .from("content-media")
    .upload(storagePath, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
  }

  const { data: { publicUrl } } = admin.storage
    .from("content-media")
    .getPublicUrl(storagePath);

  // Insert content_media row
  const { data: media, error: dbError } = await admin
    .from("content_media")
    .insert({
      content_id: params.id,
      brand_id: content.brand_id,
      type: "uploaded",
      storage_path: storagePath,
      public_url: publicUrl,
      alt_text: altText ?? null,
      sort_order: nextOrder,
      selected: true,
    })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ media });
}
