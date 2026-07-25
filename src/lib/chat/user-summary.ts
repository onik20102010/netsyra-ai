// User Summary System for Free Plan
// Creates and maintains a 500-character summary of user behavior across all chats
// Updated based on interaction patterns and user activity

import { createServerSupabaseClient } from "@/lib/supabase/server";

interface UserSummary {
  id: string;
  user_id: string;
  summary: string;
  interaction_counts: Record<string, number>;
  last_updated_at: string;
  message_count_at_update: number;
}

const USER_SUMMARY_PROMPT = `
You are a user behavior analysis system. Your task is to analyze the user's conversation history and create a concise summary of their behavior patterns.

Focus on:
- What the user describes most frequently
- What the user likes to do
- If the user is working on specific projects
- Key interests and preferences

Format the summary EXACTLY in this style:
"User likes [specific interests]. User wants [specific goals]. User describes [topics] the most."

Requirements:
- Maximum 500 characters including spaces and punctuation
- Focus on long-term patterns, not temporary content
- Use simple, clear language
- Update existing summary by adding new patterns and removing less relevant ones
- Keep the most important information within the character limit

If existing summary exists, merge new insights while removing outdated information. Maintain the exact format.
`;

export async function getUserSummary(userId: string): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("user_summaries")
    .select("summary")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return data.summary;
}

export async function generateUserSummary(
  userId: string,
  conversationHistory: Array<{ role: string; content: string }>,
  totalMessageCount: number
): Promise<void> {
  // Only generate after every 5 messages
  if (totalMessageCount % 5 !== 0) return;

  const supabase = await createServerSupabaseClient();
  
  // Get existing summary
  const { data: existing } = await supabase
    .from("user_summaries")
    .select("summary, interaction_counts")
    .eq("user_id", userId)
    .single();

  const existingSummary = existing?.summary || "No existing summary.";
  const interactionCounts = existing?.interaction_counts || {};

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
RECENT CONVERSATION HISTORY (last 10 messages):
${conversationHistory.slice(-10).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')}

TASK: Update the existing summary by incorporating new insights from the recent conversation.
Remove outdated information. Keep the summary under 500 characters including spaces and punctuation.
Focus on long-term patterns and user behavior. Maintain the exact format: "User likes... User wants... User describes..."
IMPORTANT: Do NOT duplicate information already in the user profile.
`;

  try {
    // Use Groq API key 4 for summary generation
    const apiKey = process.env.GROQ_API_KEY_4;
    if (!apiKey) {
      console.error("GROQ_API_KEY_4 is not configured");
      return;
    }

    // Use a model that's not used heavily for other purposes
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", // Lightweight model for summary generation
        messages: [
          { role: "system", content: USER_SUMMARY_PROMPT },
          { role: "user", content: summaryContext },
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      console.error("Failed to generate user summary:", response.statusText);
      return;
    }

    const data = await response.json();
    const newSummary = data.choices?.[0]?.message?.content?.trim();

    if (!newSummary) {
      console.error("Empty summary generated");
      return;
    }

    // Ensure summary is under 500 characters
    const truncatedSummary = newSummary.length > 500 ? newSummary.slice(0, 500) : newSummary;

    // Update interaction counts based on conversation analysis
    const newInteractionCounts = { ...interactionCounts };
    conversationHistory.slice(-10).forEach(msg => {
      if (msg.role === 'user') {
        const words = msg.content.toLowerCase().split(/\s+/);
        words.forEach(word => {
          if (word.length > 3) { // Only count meaningful words
            newInteractionCounts[word] = (newInteractionCounts[word] || 0) + 1;
          }
        });
      }
    });

    // Upsert the summary
    await supabase
      .from("user_summaries")
      .upsert(
        {
          user_id: userId,
          summary: truncatedSummary,
          interaction_counts: newInteractionCounts,
          last_updated_at: new Date().toISOString(),
          message_count_at_update: totalMessageCount,
        },
        { onConflict: "user_id" }
      );

    console.log("User summary updated for user:", userId);
  } catch (error) {
    console.error("Error generating user summary:", error);
  }
}

export async function shouldUseUserSummary(userMessage: string): Promise<boolean> {
  // Check if user is asking about past information or things the bot might not know
  const pastKeywords = [
    'remember', 'before', 'earlier', 'previously', 'past', 'mentioned',
    'told you', 'said', 'discussed', 'talked about', 'my', 'i am',
    'i like', 'i want', 'i need', 'working on', 'project'
  ];
  
  const lowerMessage = userMessage.toLowerCase();
  return pastKeywords.some(keyword => lowerMessage.includes(keyword));
}
