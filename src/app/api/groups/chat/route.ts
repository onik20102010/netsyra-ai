import { NextRequest, NextResponse } from "next/server";
import { createChatServerClient } from "../../../../lib/supabase/server";
import { tiers } from "@/lib/chat/model-registry";
import { checkAndUpdateUsage, MODEL_LIMITS } from "@/lib/chat/usage";

const MAX_MESSAGE_LENGTH = 4000;

export async function POST(req: NextRequest) {
  const supabase = await createChatServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { groupId, message, modelTier = "fast" } = await req.json();
  if (!groupId || !message) return NextResponse.json({ error: "Group ID and message are required" }, { status: 400 });
  if (typeof message !== "string" || message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }
  const tierKey = typeof modelTier === "string" && modelTier in MODEL_LIMITS ? modelTier : "fast";

  // Verify membership via security‑definer function
  const { data: isMember } = await supabase.rpc("is_member_of_group", { p_group_id: groupId });
  if (!isMember) {
    return NextResponse.json({ error: "You are not a member of this group" }, { status: 403 });
  }

  const usageCheck = await checkAndUpdateUsage(supabase, user.id, tierKey);
  if (!usageCheck.allowed) {
    return NextResponse.json({ error: "Daily group chat limit reached" }, { status: 429 });
  }

  // Find or create the group conversation
  let { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("group_id", groupId)
    .single();

  if (!conversation) {
    const { data: newConv, error: createError } = await supabase
      .from("conversations")
      .insert({ group_id: groupId, user_id: user.id, title: "Group Chat" })
      .select("id")
      .single();
    if (createError || !newConv) {
      return NextResponse.json({ error: createError?.message || "Failed to create conversation" }, { status: 500 });
    }
    conversation = newConv;
  }

  // Call AI
  const tier = tiers[tierKey as keyof typeof tiers] || tiers.fast;
  const modelConfig = tier.models[0];
  const apiKey = process.env[modelConfig.apiKeyEnv];
  if (!apiKey) return NextResponse.json({ error: "Model unavailable" }, { status: 500 });

  const aiRes = await fetch(modelConfig.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: modelConfig.modelName,
      messages: [{ role: "system", content: tier.systemPrompt }, { role: "user", content: message }],
      temperature: tier.temperature,
      max_tokens: tier.maxTokens,
    }),
  });

  if (!aiRes.ok) return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  const aiData = await aiRes.json();
  const reply = aiData.choices[0].message.content;

  // Store messages with sender identification
  const now = new Date().toISOString();
  await supabase.from("messages").insert([
    {
      conversation_id: conversation!.id,
      role: "user",
      content: `${user.email}: ${message}`,
      created_at: now,
    },
    {
      conversation_id: conversation!.id,
      role: "assistant",
      content: reply,
      created_at: new Date(Date.now() + 1).toISOString(),
    },
  ]);

  return NextResponse.json({ reply });
}