"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { createClient, createChatClient } from "@/lib/supabase/client";
import Link from "next/link";
import { BarChart3, MessageSquare, Users } from "lucide-react";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "onik20102010@gmail.com";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  tier: string;
  messagesToday: number;
  totalMessages: number;
  tokensUsed: number;
  joined: string;
};

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [fetching, setFetching] = useState(true);
  const supabase = createClient();
  const chatSupabase = createChatClient();

  // Groq usage warning state
  const [groqUsage, setGroqUsage] = useState<{ percentUsed: number; isWarning: boolean; isCritical: boolean } | null>(null);

  // Fetch Groq usage on mount
  useEffect(() => {
    fetch("/api/admin/usage")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setGroqUsage(d);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!loading && (!user || user.email !== ADMIN_EMAIL)) {
      router.push("/chat");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) return;

    const fetchData = async () => {
      // Get all auth users via RPC
      const { data: authUsers, error: rpcErr } = await supabase
        .rpc("admin_list_users", { p_admin_email: ADMIN_EMAIL });

      if (rpcErr || !authUsers) {
        setFetching(false);
        return;
      }

      // Get all profiles
      const { data: profiles } = await supabase.from("profiles").select("*");

      // Get all model usage
      const { data: modelUsage } = await chatSupabase.from("user_model_usage").select("*");

      // Get today's date
      const today = new Date().toISOString().split("T")[0];

      // Build rows
      const rows: UserRow[] = await Promise.all(
        (authUsers as any[]).map(async (u: any) => {
          const profile = (profiles || []).find((p: any) => p.user_id === u.id);
          const usageRows = (modelUsage || []).filter((m: any) => m.user_id === u.id);
          const tokensUsed = usageRows.reduce((sum: number, m: any) => sum + (m.tokens_used || 0), 0);

          // Count messages today and total
          const { count: totalMsgs } = await chatSupabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", "any"); // Not perfect, but we can't easily filter by user. We'll skip per-user total for now.

          // Actually, we need per-user message counts. We can query messages joined with conversations.
          const { count: userTotal } = await chatSupabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .in("conversation_id", (await chatSupabase.from("conversations").select("id").eq("user_id", u.id)).data?.map((c: any) => c.id) || []);

          const { count: userToday } = await chatSupabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .gte("created_at", today)
            .in("conversation_id", (await chatSupabase.from("conversations").select("id").eq("user_id", u.id)).data?.map((c: any) => c.id) || []);

          return {
            id: u.id,
            email: u.email,
            name: profile?.name || null,
            tier: profile?.subscription_tier || "free",
            messagesToday: userToday || 0,
            totalMessages: userTotal || 0,
            tokensUsed,
            joined: new Date(u.created_at).toLocaleDateString(),
          };
        })
      );

      setUsers(rows);
      setFetching(false);
    };

    fetchData();
  }, [user, supabase, chatSupabase]);

  if (loading || !user || user.email !== ADMIN_EMAIL) return null;

  return (
    <div className="min-h-screen bg-black text-gray-300 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-white/40 text-sm mt-1">Monitor all users and usage</p>
          </div>
          <Link href="/chat" className="text-indigo-400 hover:underline text-sm">
            ← Back to Chat
          </Link>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-indigo-400" />
              <span className="text-xs text-white/50">Total Users</span>
            </div>
            <p className="text-2xl font-bold text-white">{users.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="w-4 h-4 text-green-400" />
              <span className="text-xs text-white/50">Messages Today</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {users.reduce((sum, u) => sum + u.messagesToday, 0)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-white/50">Total Tokens</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {users.reduce((sum, u) => sum + u.tokensUsed, 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Groq usage warning banner */}
        {groqUsage && groqUsage.isWarning && (
          <div
            className={`p-4 rounded-xl border mb-6 ${
              groqUsage.isCritical
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-amber-500/10 border-amber-500/30 text-amber-400"
            }`}
          >
            <p className="font-semibold">
              {groqUsage.isCritical ? "🚨 Critical" : "⚠️ Warning"}: Groq API usage at {groqUsage.percentUsed}%
            </p>
            <p className="text-sm opacity-80">
              {groqUsage.isCritical
                ? "Daily limit almost reached. Consider reducing usage or adding more API keys."
                : "Usage is high. Monitor closely."}
            </p>
          </div>
        )}

        {/* User table */}
        {fetching ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="p-3 text-white/50 font-medium">Email</th>
                  <th className="p-3 text-white/50 font-medium">Name</th>
                  <th className="p-3 text-white/50 font-medium">Tier</th>
                  <th className="p-3 text-white/50 font-medium">Today</th>
                  <th className="p-3 text-white/50 font-medium">Total Msgs</th>
                  <th className="p-3 text-white/50 font-medium">Tokens</th>
                  <th className="p-3 text-white/50 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="p-3 text-white/70">{u.email}</td>
                    <td className="p-3 text-white/70">{u.name || "-"}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.tier === "paid"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {u.tier}
                      </span>
                    </td>
                    <td className="p-3 text-white/70">{u.messagesToday}</td>
                    <td className="p-3 text-white/70">{u.totalMessages}</td>
                    <td className="p-3 text-white/70">{u.tokensUsed.toLocaleString()}</td>
                    <td className="p-3 text-white/50 text-xs">{u.joined}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}