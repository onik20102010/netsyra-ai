import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Aggregate daily Groq token limit across all free tiers (estimate)
const DAILY_GROQ_LIMIT = 100000;

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const ADMIN_EMAIL = "onik20102010@gmail.com";

  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];

  // Sum all tokens used today across all users
  const { data: usageRows, error } = await supabase
    .from("user_model_usage")
    .select("tokens_used");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const totalTokens = (usageRows || []).reduce((sum, row) => sum + (row.tokens_used || 0), 0);
  const percentUsed = Math.round((totalTokens / DAILY_GROQ_LIMIT) * 100);

  return NextResponse.json({
    totalTokens,
    limit: DAILY_GROQ_LIMIT,
    percentUsed,
    isWarning: percentUsed >= 80,
    isCritical: percentUsed >= 95,
  });
}