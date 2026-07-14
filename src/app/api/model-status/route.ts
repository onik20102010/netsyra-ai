import { NextRequest, NextResponse } from "next/server";
import { createChatServerClient } from "@/lib/supabase/server";
import { modelLimits, checkModelLimit } from "@/lib/chat/model-limits";

export async function GET(req: NextRequest) {
  const supabase = await createChatServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const statuses: Record<string, { allowed: boolean; remaining: number; resetsAt: string; label: string }> = {};
  for (const [key, limit] of Object.entries(modelLimits)) {
    const { allowed, remaining, resetsAt } = await checkModelLimit(supabase, user.id, key);
    statuses[key] = { allowed, remaining, resetsAt, label: limit.label };
  }

  return NextResponse.json(statuses);
}