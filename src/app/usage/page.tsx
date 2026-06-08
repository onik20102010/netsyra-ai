"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function UsagePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [usage, setUsage] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    const fetchUsage = async () => {
      const { data: profile } = await supabase.from("profiles").select("daily_message_count, daily_reset_at, subscription_tier").eq("user_id", user.id).single();
      const { count } = await supabase.from("messages").select("*", { count: "exact" }).eq("conversation_id", "any"); // approximate
      const { data: modelUsage } = await supabase.from("user_model_usage").select("*").eq("user_id", user.id);
      setUsage({ profile, totalMessages: count || 0, modelUsage: modelUsage || [] });
    };
    fetchUsage();
  }, [user, supabase]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-black text-gray-300 flex flex-col items-center justify-center px-6">
      <div className="max-w-lg w-full space-y-6">
        <h1 className="text-3xl font-bold text-white">Usage Dashboard</h1>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-2xl font-bold text-white">{usage?.profile?.daily_message_count || 0}</p>
            <p className="text-sm text-white/50">Messages today</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-2xl font-bold text-white">{usage?.totalMessages || 0}</p>
            <p className="text-sm text-white/50">Total messages</p>
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-white">Model Usage</h2>
          {usage?.modelUsage?.map((m: any) => (
            <div key={m.model_id} className="flex justify-between text-sm p-2 rounded bg-white/5">
              <span>{m.model_id}</span>
              <span>{m.tokens_used} tokens</span>
            </div>
          ))}
        </div>
        <Link href="/chat" className="text-indigo-400 hover:underline text-sm">← Back to Chat</Link>
      </div>
    </div>
  );
}