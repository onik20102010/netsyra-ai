import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "onik20102010@gmail.com";
const ADMIN_PASS = process.env.ADMIN_PASS;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

    // ── Use service role key to bypass RLS ──
    // If SERVICE_ROLE_KEY is not set, fall back to the user's session (limited by RLS)
    const adminClient = SERVICE_ROLE_KEY
      ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
      : supabase;

    // 1. Fetch all auth users (via admin API if service role key is available)
    let authUsers: any[] = [];
    if (SERVICE_ROLE_KEY) {
      const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (error) {
        console.warn("admin.listUsers failed, falling back to profiles:", error.message);
      } else {
        authUsers = (data.users || []).map((u: any) => ({
          id: u.id,
          email: u.email || "",
          created_at: u.created_at,
        }));
      }
    }

    // 2. All profiles
    const { data: profiles, error: profilesErr } = await adminClient
      .from("profiles")
      .select("*");

    // 3. All subscriptions
    const { data: subscriptions } = await adminClient
      .from("subscriptions")
      .select("user_id, plan, status, current_period_end");

    // 4. All conversations
    const { data: conversations } = await adminClient
      .from("conversations")
      .select("id, user_id, created_at, title");

    // 5. Today's messages
    const today = new Date().toISOString().split("T")[0];
    const { data: todayMessages } = await adminClient
      .from("messages")
      .select("id, user_id, conversation_id, role, created_at")
      .gte("created_at", today);

    // 6. Active now (messages in last 5 minutes)
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentMessages } = await adminClient
      .from("messages")
      .select("user_id")
      .gte("created_at", fiveMinAgo);

    // 7. Total messages count
    const { count: totalMessages } = await adminClient
      .from("messages")
      .select("*", { count: "exact", head: true });

    // ── Build user rows ──
    // If we have auth users (from admin API), use them as the primary list.
    // Otherwise, build the list from profiles.
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

    let users: any[];

    if (authUsers.length > 0) {
      // Full list from auth admin API (has emails)
      users = authUsers.map((u: any) => {
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
    } else {
      // Fallback: build from profiles (no emails, but still useful)
      users = (profiles || []).map((p: any) => {
        const sub = (subscriptions || []).find((s: any) => s.user_id === p.user_id && s.status === "active");
        const userConvIds = conversationMap.get(p.user_id) || [];
        const userTodayMsgs = todayMessageMap.get(p.user_id) || 0;

        return {
          id: p.user_id,
          email: p.email || "(hidden)",
          name: p.name || null,
          plan: sub?.plan || p.subscription_tier || "free",
          subscriptionStatus: sub?.status || "none",
          messagesToday: userTodayMsgs,
          totalConversations: userConvIds.length,
          isActiveNow: activeNowUserIds.has(p.user_id),
          joined: p.created_at || "",
          lastActive: p.last_active_at || null,
        };
      });
    }

    // ── Aggregate stats ──
    const totalUsers = users.length;
    const activeToday = users.filter((u) => u.messagesToday > 0).length;
    const activeNow = users.filter((u) => u.isActiveNow).length;
    const paidUsers = users.filter((u) => u.plan !== "free").length;
    const freeUsers = totalUsers - paidUsers;

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
