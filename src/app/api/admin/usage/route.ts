import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Aggregate daily usage stats (text LLM limits removed — this is now informational only)
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "netsyraai@gmail.com";

  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Count total messages today across all users
  const today = new Date().toISOString().split("T")[0];
  const { count } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today);

  return NextResponse.json({
    totalMessagesToday: count || 0,
  });
}
