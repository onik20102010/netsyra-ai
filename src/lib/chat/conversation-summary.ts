// Conversation Summary Service
// Summarizes older messages in a conversation when it gets too long
// This enables GPT-like memory: keep recent context, summarize older parts

import { createServerSupabaseClient } from "@/lib/supabase/server";

const CONVERSATION_SUMMARY_PROMPT = `
You are a conversation summarization system. Your task is to analyze the conversation history and create a concise summary of the older messages.

Focus on:
- Main topics discussed
- Key decisions made
- Important information shared
- Context that might be needed for future messages

Keep the summary:
- Concise (150-250 words)
- Factual and objective
- Structured with clear sections if multiple topics
- Free of temporary conversational filler

Format:
## Summary
[Brief overview of what was discussed]

## Key Points
- [Important point 1]
- [Important point 2]
- [Important point 3]

## Context
[Any relevant context for continuing the conversation]
`;

export interface ConversationSummary {
  id: string;
  conversation_id: string;
  summary: any; // JSONB field
  message_count?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Get the latest summary for a conversation
 */
export async function getConversationSummary(
  conversationId: string
): Promise<ConversationSummary | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("chat_summaries")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as ConversationSummary;
}

/**
 * Generate or update a conversation summary
 */
export async function generateConversationSummary(
  conversationId: string,
  messages: Array<{ role: string; content: string }>
): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  
  // Get existing summary
  const existingSummary = await getConversationSummary(conversationId);
  
  // Build context for summary generation
  const summaryContext = existingSummary
    ? `
EXISTING SUMMARY:
${existingSummary.summary}

NEW MESSAGES TO INTEGRATE:
${messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')}

TASK: Update the existing summary by incorporating new information from these messages. 
Remove outdated information. Keep the summary concise (150-250 words). Focus on key points and context.
`
    : `
CONVERSATION HISTORY:
${messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')}

TASK: Create a concise summary (150-250 words) of this conversation. Focus on main topics, key decisions, and important context.
`;

  try {
    // Use a lightweight model for summary generation
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: CONVERSATION_SUMMARY_PROMPT },
          { role: "user", content: summaryContext },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error("Failed to generate conversation summary:", response.statusText);
      return null;
    }

    const data = await response.json();
    const newSummary = data.choices?.[0]?.message?.content?.trim();

    if (!newSummary) {
      console.error("Empty conversation summary generated");
      return null;
    }

    // Store or update the summary as JSONB
    const summaryJson = {
      text: newSummary,
      generated_at: new Date().toISOString(),
      message_count: messages.length,
    };

    if (existingSummary) {
      await supabase
        .from("chat_summaries")
        .update({
          summary: summaryJson,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSummary.id);
    } else {
      await supabase
        .from("chat_summaries")
        .insert({
          conversation_id: conversationId,
          summary: summaryJson,
        });
    }

    console.log("Conversation summary updated for conversation:", conversationId);
    return newSummary;
  } catch (error) {
    console.error("Error generating conversation summary:", error);
    return null;
  }
}

/**
 * Build context for AI model with summary + recent messages
 * Returns messages array with summary prepended if conversation is long
 */
export async function buildMessageContext(
  conversationId: string,
  recentMessages: Array<{ role: string; content: string }>,
  totalMessageCount: number
): Promise<Array<{ role: string; content: string }>> {
  const MESSAGE_THRESHOLD = 6;
  
  // If conversation is short, return messages as-is
  if (totalMessageCount <= MESSAGE_THRESHOLD) {
    return recentMessages;
  }

  // Get existing summary
  const summary = await getConversationSummary(conversationId);
  
  if (!summary) {
    // No summary exists yet, generate one from older messages
    // For now, return recent messages (summary will be generated on next message)
    return recentMessages;
  }

  // Prepend summary as a system message
  const summaryText = typeof summary.summary === 'string' 
    ? summary.summary 
    : summary.summary?.text || JSON.stringify(summary.summary);
  
  return [
    {
      role: "system",
      content: `CONVERSATION SUMMARY (older messages):\n${summaryText}\n\nContinue the conversation based on this context and the recent messages below.`,
    },
    ...recentMessages,
  ];
}
