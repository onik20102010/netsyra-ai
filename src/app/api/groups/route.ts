import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../lib/supabase/server";

function generateInviteCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// POST – create a new group
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "Group name is required" }, { status: 400 });

  const inviteCode = generateInviteCode();
  const { data, error } = await supabase
    .from("group_chats")
    .insert({ name, invite_code: inviteCode, created_by: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("group_members").insert({ group_id: data.id, user_id: user.id });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return NextResponse.json({
    group: data,
    inviteLink: `${appUrl}/join/${inviteCode}`,
  });
}

// GET – list user's groups
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", user.id);
  const groupIds = (memberships || []).map((m: { group_id: string | number }) => m.group_id);

  if (groupIds.length === 0) return NextResponse.json({ groups: [] });

  const { data: groups } = await supabase
    .from("group_chats")
    .select("*")
    .in("id", groupIds)
    .order("created_at", { ascending: false });

  return NextResponse.json({ groups: groups || [] });
}