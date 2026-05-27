"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { MessageSquare, Trash2 } from "lucide-react";
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
  const supabase = createClient();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const fetchConversations = async () => {
      const { data } = await supabase
        .from("conversations")
        .select("id, title, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setConversations(data || []);
    };
    fetchConversations();
  }, [user, supabase]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("conversations").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete conversation");
    } else {
      toast.success("Conversation deleted");
      setConversations((prev) => prev.filter((c) => c.id !== id));
    }
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-white flex">
      <div className="flex-1 max-w-4xl mx-auto p-6">
        <Link href="/chat" className="text-purple-600 hover:underline text-sm mb-4 inline-block">
           Back to Chat
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Conversations</h1>
        {conversations.length === 0 ? (
          <p className="text-gray-500">No conversations yet.</p>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-purple-300 bg-white hover:bg-purple-50 transition"
              >
                <Link
                  href={`/chat?conversation=${conv.id}`}
                  className="flex items-center gap-3 flex-1"
                >
                  <MessageSquare className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="font-medium text-gray-900">{conv.title}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(conv.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => handleDelete(conv.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
