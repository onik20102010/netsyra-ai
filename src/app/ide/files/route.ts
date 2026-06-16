import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("ide_files")
    .select("path, content")
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const files: Record<string, string> = {};
  data.forEach((row: any) => {
    files[row.path] = row.content;
  });
  return NextResponse.json({ files });
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { path, content } = await req.json();
  if (!path) return NextResponse.json({ error: "Path required" }, { status: 400 });

  const { error } = await supabase
    .from("ide_files")
    .upsert({ user_id: user.id, path, content, updated_at: new Date().toISOString() }, { onConflict: "user_id, path" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");
  if (!path) return NextResponse.json({ error: "Path required" }, { status: 400 });

  // Delete file or folder (all paths starting with path/)
  const { error } = await supabase
    .from("ide_files")
    .delete()
    .eq("user_id", user.id)
    .or(`path.eq.${path},path.like.${path}/%`);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}