import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "onik20102010@gmail.com";
const ADMIN_PASS = process.env.ADMIN_PASS;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// GET: Fetch conversations for a user, or messages for a conversation
//   ?userId=xxx          → returns conversations list
//   ?userId=xxx&conversationId=yyy → returns messages in that conversation
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin password from header
    const providedPass = req.headers.get("x-admin-pass");
    if (!ADMIN_PASS || providedPass !== ADMIN_PASS) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const conversationId = searchParams.get("conversationId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const adminClient = SERVICE_ROLE_KEY
      ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
      : supabase;

    // ── If conversationId is provided, return messages ──
    if (conversationId) {
      const { data: messages, error } = await adminClient
        .from("messages")
        .select("id, role, content, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Admin: Failed to fetch messages:", error.message);
        return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
      }

      // Also get conversation metadata
      const { data: conv } = await adminClient
        .from("conversations")
        .select("id, title, created_at")
        .eq("id", conversationId)
        .maybeSingle();

      return NextResponse.json({
        conversation: conv,
        messages: messages || [],
      });
    }

    // ── Otherwise, return conversations for the user ──
    const { data: conversations, error } = await adminClient
      .from("conversations")
      .select("id, title, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Admin: Failed to fetch conversations:", error.message);
      return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
    }

    // Get message count per conversation
    const convIds = (conversations || []).map((c: any) => c.id);
    let messageCounts: Record<string, number> = {};

    if (convIds.length > 0) {
      const { data: allMsgs } = await adminClient
        .from("messages")
        .select("conversation_id")
        .in("conversation_id", convIds);

      if (allMsgs) {
        allMsgs.forEach((m: any) => {
          messageCounts[m.conversation_id] = (messageCounts[m.conversation_id] || 0) + 1;
        });
      }
    }

    const result = (conversations || []).map((c: any) => ({
      ...c,
      messageCount: messageCounts[c.id] || 0,
    }));

    return NextResponse.json({ conversations: result });
  } catch (err: any) {
    console.error("Admin user-data error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
