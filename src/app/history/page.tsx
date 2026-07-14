"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { createChatClient } from "@/lib/supabase/client";
import { MessageSquare, Trash2, Edit3, Check, X } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type Conversation = {
  id: string;
  title: string;
  created_at: string;
};

export default function HistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [clientReady, setClientReady] = useState(false);
  const [supabase, setSupabase] = useState<ReturnType<typeof createChatClient> | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    try {
      const client = createChatClient();
      setSupabase(client);
      setClientReady(true);
    } catch (err) {
      console.error("Failed to init Supabase client:", err);
    }
  }, []);

  useEffect(() => {
    if (!supabase || !user) return;
    const fetchConversations = async () => {
      const { data } = await supabase
        .from("conversations")
        .select("id, title, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setConversations(data || []);
    };
    fetchConversations();
  }, [supabase, user]);

  const handleDelete = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from("conversations").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete conversation");
    } else {
      toast.success("Conversation deleted");
      setConversations((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const startRename = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const saveRename = async (id: string) => {
    if (!supabase || !editTitle.trim()) return;
    const { error } = await supabase
      .from("conversations")
      .update({ title: editTitle.trim() })
      .eq("id", id);
    if (error) {
      toast.error("Failed to rename");
    } else {
      toast.success("Conversation renamed");
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: editTitle.trim() } : c))
      );
    }
    cancelRename();
  };

  if (loading || !user || !clientReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      <div className="flex-1 max-w-4xl mx-auto p-6">
        <Link href="/chat" className="text-black hover:underline text-sm mb-4 inline-block">
          ← Back to Chat
        </Link>
        <h1 className="text-3xl font-bold text-black mb-6">Your Conversations</h1>
        {conversations.length === 0 ? (
          <p className="text-black">No conversations yet.</p>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-purple-300 bg-white transition"
              >
                {editingId === conv.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-indigo-300 text-black"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveRename(conv.id);
                        if (e.key === "Escape") cancelRename();
                      }}
                      autoFocus
                    />
                    <button onClick={() => saveRename(conv.id)} className="p-1.5 text-green-500 hover:bg-green-50 rounded">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={cancelRename} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Link
                      href={`/chat?conversation=${conv.id}`}
                      className="flex items-center gap-3 flex-1"
                    >
                      <MessageSquare className="w-5 h-5 text-purple-500" />
                      <div>
                        <p className="font-medium text-black">{conv.title}</p>
                        <p className="text-xs text-black">
                          {new Date(conv.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startRename(conv)}
                        className="p-2 text-gray-400 hover:text-indigo-500 transition"
                        title="Rename"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(conv.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}