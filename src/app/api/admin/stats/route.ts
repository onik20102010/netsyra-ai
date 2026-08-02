import { NextResponse } from "next/server";
import { createServerSupabaseClient, createChatServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "onik20102010@gmail.com";

// 5-layer password verification — each layer must match
const ADMIN_PASSWORDS = [
  process.env.ADMIN_PASS_1,
  process.env.ADMIN_PASS_2,
  process.env.ADMIN_PASS_3,
  process.env.ADMIN_PASS_4,
  process.env.ADMIN_PASS_5,
];

function verifyPasswords(provided: string[]): boolean {
  if (provided.length !== 5) return false;
  for (let i = 0; i < 5; i++) {
    if (!ADMIN_PASSWORDS[i]) return false;
    if (provided[i] !== ADMIN_PASSWORDS[i]) return false;
  }
  return true;
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const chatSupabase = await createChatServerClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { passwords } = body as { passwords: string[] };

    if (!verifyPasswords(passwords || [])) {
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

    // 4. All model usage from chat schema
    const { data: modelUsage } = await chatSupabase.from("user_model_usage").select("*");

    // 5. All conversations
    const { data: conversations } = await chatSupabase
      .from("conversations")
      .select("id, user_id, created_at, title");

    // 6. Today's messages
    const today = new Date().toISOString().split("T")[0];
    const { data: todayMessages } = await chatSupabase
      .from("messages")
      .select("id, user_id, conversation_id, role, created_at")
      .gte("created_at", today);

    // 7. Active now (messages in last 5 minutes)
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentMessages } = await chatSupabase
      .from("messages")
      .select("user_id")
      .gte("created_at", fiveMinAgo);

    // 8. Total messages count
    const { count: totalMessages } = await chatSupabase
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
      const usageRows = (modelUsage || []).filter((m: any) => m.user_id === u.id);
      const tokensUsed = usageRows.reduce((sum: number, m: any) => sum + (m.tokens_used || 0), 0);
      const messagesSent = usageRows.reduce((sum: number, m: any) => sum + (m.messages_sent || 0), 0);

      // Per-model breakdown
      const modelBreakdown = usageRows.map((m: any) => ({
        model: m.model_id,
        tokens: m.tokens_used || 0,
        messages: m.messages_sent || 0,
        resetAt: m.reset_at,
      }));

      const userConvIds = conversationMap.get(u.id) || [];
      const userTodayMsgs = todayMessageMap.get(u.id) || 0;

      return {
        id: u.id,
        email: u.email,
        name: profile?.name || null,
        plan: sub?.plan || "free",
        subscriptionStatus: sub?.status || "none",
        tokensUsed,
        messagesSent,
        messagesToday: userTodayMsgs,
        totalConversations: userConvIds.length,
        isActiveNow: activeNowUserIds.has(u.id),
        joined: u.created_at,
        modelBreakdown,
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

    // Model usage breakdown
    const modelStats: Record<string, { tokens: number; messages: number }> = {};
    (modelUsage || []).forEach((m: any) => {
      const key = m.model_id || "unknown";
      if (!modelStats[key]) modelStats[key] = { tokens: 0, messages: 0 };
      modelStats[key].tokens += m.tokens_used || 0;
      modelStats[key].messages += m.messages_sent || 0;
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
        modelStats,
      },
    });
  } catch (err: any) {
    console.error("Admin stats error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
