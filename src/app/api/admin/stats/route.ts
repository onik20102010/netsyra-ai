import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "onik20102010@gmail.com";
const ADMIN_PASS = process.env.ADMIN_PASS;

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { password } = body as { password: string };

    if (!ADMIN_PASS || password !== ADMIN_PASS) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 403 });
    }

    // ── Fetch all data ──

    // 1. All auth users via RPC
    const { data: authUsers, error: rpcErr } = await supabase.rpc("admin_list_users", {
      p_admin_email: ADMIN_EMAIL,
    });

    if (rpcErr || !authUsers) {
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    // 2. All profiles
    const { data: profiles } = await supabase.from("profiles").select("*");

    // 3. All subscriptions
    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("user_id, plan, status, current_period_end");

    // 4. All conversations (public schema — where chat route writes)
    const { data: conversations } = await supabase
      .from("conversations")
      .select("id, user_id, created_at, title");

    // 6. Today's messages (public schema)
    const today = new Date().toISOString().split("T")[0];
    const { data: todayMessages } = await supabase
      .from("messages")
      .select("id, user_id, conversation_id, role, created_at")
      .gte("created_at", today);

    // 7. Active now (messages in last 5 minutes)
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentMessages } = await supabase
      .from("messages")
      .select("user_id")
      .gte("created_at", fiveMinAgo);

    // 8. Total messages count
    const { count: totalMessages } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true });

    // ── Build user rows ──
    const activeNowUserIds = new Set((recentMessages || []).map((m: any) => m.user_id));
    const todayMessageMap = new Map<string, number>();
    (todayMessages || []).forEach((m: any) => {
      const uid = m.user_id;
      todayMessageMap.set(uid, (todayMessageMap.get(uid) || 0) + 1);
    });

    const conversationMap = new Map<string, string[]>();
    (conversations || []).forEach((c: any) => {
      if (!conversationMap.has(c.user_id)) conversationMap.set(c.user_id, []);
      conversationMap.get(c.user_id)!.push(c.id);
    });

    const users = (authUsers as any[]).map((u: any) => {
      const profile = (profiles || []).find((p: any) => p.user_id === u.id);
      const sub = (subscriptions || []).find((s: any) => s.user_id === u.id && s.status === "active");

      const userConvIds = conversationMap.get(u.id) || [];
      const userTodayMsgs = todayMessageMap.get(u.id) || 0;

      return {
        id: u.id,
        email: u.email,
        name: profile?.name || null,
        plan: sub?.plan || "free",
        subscriptionStatus: sub?.status || "none",
        messagesToday: userTodayMsgs,
        totalConversations: userConvIds.length,
        isActiveNow: activeNowUserIds.has(u.id),
        joined: u.created_at,
        lastActive: profile?.last_active_at || null,
      };
    });

    // ── Aggregate stats ──
    const totalUsers = users.length;
    const activeToday = users.filter((u) => u.messagesToday > 0).length;
    const activeNow = users.filter((u) => u.isActiveNow).length;
    const paidUsers = users.filter((u) => u.plan !== "free").length;
    const freeUsers = totalUsers - paidUsers;

    // Plan distribution
    const planDistribution: Record<string, number> = {};
    users.forEach((u) => {
      planDistribution[u.plan] = (planDistribution[u.plan] || 0) + 1;
    });

    return NextResponse.json({
      users,
      stats: {
        totalUsers,
        activeToday,
        activeNow,
        paidUsers,
        freeUsers,
        totalMessages: totalMessages || 0,
        messagesToday: (todayMessages || []).length,
        planDistribution,
      },
    });
  } catch (err: any) {
    console.error("Admin stats error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
