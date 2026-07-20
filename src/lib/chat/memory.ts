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
- Professional background (developer, engineer, doctor, etc.)
- Current projects they're working on
- Conversation preferences (technical, casual, detailed, concise)
- Interests and topics they frequently discuss
- Goals and aspirations
- Communication style and thinking patterns
- Specific preferences (tools, frameworks, approaches)

DO NOT include:
- Temporary chat content or specific questions from this session
- Recent events that won't be relevant long-term
- Personal identifiable information (PII) or sensitive data
- Repetitive details

Output a STRUCTURED summary with these sections (keep each section 1-2 sentences max):

## OVERVIEW
User's profession, main interests, and current project status.

## INTERESTS
Topics they frequently discuss or ask about.

## COMMUNICATION STYLE
How they prefer to communicate (detailed, concise, technical, casual).

## GOALS
Their long-term objectives or what they're working toward.

## PREFERENCES
Specific tools, frameworks, or approaches they prefer.

If existing summary exists, merge new insights with it while removing outdated information. Keep total summary under 300 words. Use clear section headers.
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

  // Get user profile to avoid duplication
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, goal, custom_instructions")
    .eq("user_id", userId)
    .single();

  const profileInfo = profile ? `
USER PROFILE (already stored separately - DO NOT duplicate this):
- Name: ${profile.name || "N/A"}
- Goal: ${profile.goal || "N/A"}
- Custom Instructions: ${profile.custom_instructions || "N/A"}
` : "";

  // Build context for summary generation
  const summaryContext = `
EXISTING SUMMARY:
${existingSummary}

${profileInfo}
RECENT CONVERSATION HISTORY (last 12 messages):
${conversationHistory.slice(-12).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')}

TASK: Update the existing summary by incorporating new insights from the recent conversation. 
Remove outdated information. Keep the summary concise (200-300 words). Focus on long-term patterns.
IMPORTANT: Do NOT duplicate information already in the user profile (name, goal, custom instructions).
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
        max_tokens: 600,
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
