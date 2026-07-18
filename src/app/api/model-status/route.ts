import { NextRequest, NextResponse } from "next/server";
import { createChatServerClient } from "@/lib/supabase/server";
import { checkAllModelLimits } from "@/lib/chat/model-limits";

export async function GET(req: NextRequest) {
  const supabase = await createChatServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const statuses = await checkAllModelLimits(supabase, user.id);
  return NextResponse.json(statuses);
}