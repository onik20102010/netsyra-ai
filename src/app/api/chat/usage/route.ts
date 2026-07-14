import { NextResponse } from "next/server";
import { createChatServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createChatServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("chat_usage")
    .select("model_tier, messages_used, reset_at")
    .eq("user_id", user.id);

  return NextResponse.json({ usage: data || [] });
}