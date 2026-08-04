import { NextResponse } from "next/server";
import { createChatServerClient } from "@/lib/supabase/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getRouterConfig } from "@/lib/routers/router-factory";
import { checkWebSearchLimit } from "@/lib/chat/web-search-limiter";
import { checkDiveDeepLimit } from "@/lib/chat/dive-deep-limiter";

export async function GET() {
  const supabase = await createChatServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get user's plan
  const serverClient = await createServerSupabaseClient();
  const { data: sub } = await serverClient
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  const userPlan = sub?.plan || "free";
  const routerConfig = getRouterConfig(userPlan);

  const [webSearchLimit, diveDeepLimit] = await Promise.all([
    checkWebSearchLimit(user.id, routerConfig.webSearchDailyLimit, routerConfig.webSearchLimitHours),
    checkDiveDeepLimit(user.id, routerConfig.diveDeepDailyLimit, routerConfig.diveDeepLimitHours),
  ]);

  return NextResponse.json({
    webSearch: {
      used: webSearchLimit.used,
      remaining: webSearchLimit.remaining,
      limit: webSearchLimit.limit,
      windowHours: webSearchLimit.windowHours,
    },
    diveDeep: {
      used: diveDeepLimit.used,
      remaining: diveDeepLimit.remaining,
      limit: diveDeepLimit.limit,
      windowHours: diveDeepLimit.windowHours,
    },
  });
}
