import { NextRequest, NextResponse } from "next/server";
import { createChatServerClient } from "@/lib/supabase/server";

function isPreferenceValue(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value) && value >= -10 && value <= 10;
}

export async function GET() {
  const supabase = await createChatServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("user_preferences")
    .select("warmth, enthusiasm, formatting, conciseness")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({ preferences: data || {} });
}

export async function POST(req: NextRequest) {
  const supabase = await createChatServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const prefs: Partial<Record<string, number>> = {};
  for (const key of ["warmth", "enthusiasm", "formatting", "conciseness"]) {
    if (body[key] !== undefined && body[key] !== null) {
      if (!isPreferenceValue(body[key])) {
        return NextResponse.json({ error: `Invalid ${key}: must be a number between -10 and 10` }, { status: 400 });
      }
      prefs[key] = body[key];
    }
  }

  await supabase.from("user_preferences").upsert(
    {
      user_id: user.id,
      ...prefs,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  return NextResponse.json({ success: true });
}