import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({ preferences: data || {} });
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { warmth, enthusiasm, formatting, conciseness } = body;

  await supabase.from("user_preferences").upsert({
    user_id: user.id,
    warmth,
    enthusiasm,
    formatting,
    conciseness,
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json({ success: true });
}