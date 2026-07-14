"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../../hooks/useAuth";
import { createChatClient } from "../../../lib/supabase/client";

export default function JoinGroupPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState("");
  const supabase = createChatClient();

  useEffect(() => {
    if (!code) return;
    const fetchGroup = async () => {
      const { data, error: rpcError } = await supabase.rpc("lookup_group_by_code", { p_code: code });
      if (rpcError || !data || data.length === 0) {
        setError("Invalid invite link");
        return;
      }
      setGroupName(data[0].name);
    };
    fetchGroup();
  }, [code, supabase]);

  const handleJoin = async () => {
    if (!user) { router.push(`/login?redirect=/join/${code}`); return; }

    const { data, error: rpcError } = await supabase.rpc("lookup_group_by_code", { p_code: code });
    if (rpcError || !data || data.length === 0) { setError("Group not found"); return; }

    const groupId = data[0].id;
    const { error: joinError } = await supabase.from("group_members").insert({ group_id: groupId, user_id: user.id });
    if (joinError) { setError(joinError.message); return; }

    router.push(`/chat?group=${groupId}`);
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-white"><div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-3xl font-bold text-white">{groupName || "Join Group"}</h1>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <p className="text-white/50">You've been invited to join a group chat on Netsyra AI.</p>
        {user ? (
          <button onClick={handleJoin} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition">Join Group</button>
        ) : (
          <button onClick={() => router.push(`/login?redirect=/join/${code}`)} className="w-full py-3 rounded-xl bg-white text-black font-medium hover:bg-gray-200 transition">Log in to Join</button>
        )}
      </div>
    </div>
  );
}