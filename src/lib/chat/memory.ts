// User Memory Summary Service
// Generates and maintains long-term user memory summaries

import { createServerSupabaseClient } from "@/lib/supabase/server";

interface MemorySummary {
  id: string;
  user_id: string;
  summary: string;
  last_updated_at: string;
  message_count_at_update: number;
}

const MEMORY_GENERATION_PROMPT = `
You are a memory synthesis system. Your task is to analyze the conversation history and extract long-term, useful information about the user.

Focus ONLY on:
- Preferences (what they like/dislike)
- Interests and hobbies
- Goals and aspirations
- Communication style
- Thinking patterns
- Frequently mentioned facts about their life/work
- Professional background
- Learning objectives

DO NOT include:
- Temporary chat content
- Specific questions from this session
- Recent events that won't be relevant long-term
- Personal identifiable information (PII)
- Sensitive information

Output a concise summary (200-400 words) that evolves over time. If existing summary exists, merge new insights with it while removing outdated information.

Format as plain text, no markdown, no lists. Just a flowing paragraph.
`;

export async function getUserMemorySummary(userId: string): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("user_memory_summaries")
    .select("summary")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return data.summary;
}

export async function generateMemorySummary(
  userId: string,
  conversationHistory: Array<{ role: string; content: string }>,
  totalMessageCount: number
): Promise<void> {
  // Only generate after every 6 messages
  if (totalMessageCount % 6 !== 0) return;

  const supabase = await createServerSupabaseClient();
  
  // Get existing summary
  const { data: existing } = await supabase
    .from("user_memory_summaries")
    .select("summary")
    .eq("user_id", userId)
    .single();

  const existingSummary = existing?.summary || "No existing summary.";

  // Build context for summary generation
  const summaryContext = `
EXISTING SUMMARY:
${existingSummary}

RECENT CONVERSATION HISTORY (last 12 messages):
${conversationHistory.slice(-12).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')}

TASK: Update the existing summary by incorporating new insights from the recent conversation. 
Remove outdated information. Keep the summary concise (200-400 words). Focus on long-term patterns.
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
          { role: "system", content: MEMORY_GENERATION_PROMPT },
          { role: "user", content: summaryContext },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error("Failed to generate memory summary:", response.statusText);
      return;
    }

    const data = await response.json();
    const newSummary = data.choices?.[0]?.message?.content?.trim();

    if (!newSummary) {
      console.error("Empty summary generated");
      return;
    }

    // Upsert the summary
    await supabase
      .from("user_memory_summaries")
      .upsert(
        {
          user_id: userId,
          summary: newSummary,
          last_updated_at: new Date().toISOString(),
          message_count_at_update: totalMessageCount,
        },
        { onConflict: "user_id" }
      );

    console.log("Memory summary updated for user:", userId);
  } catch (error) {
    console.error("Error generating memory summary:", error);
  }
}
