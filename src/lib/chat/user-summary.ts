// User Summary System for Free Plan
// Creates and maintains a 500-character summary of user behavior across all chats
// Updated based on interaction patterns and user activity

import { createChatServerClient } from "@/lib/supabase/server";

interface UserSummary {
  id: string;
  user_id: string;
  summary: string;
  interaction_counts: Record<string, number>;
  last_updated_at: string;
  message_count_at_update: number;
}

const USER_SUMMARY_PROMPT = `You are a personal memory system, similar to how ChatGPT remembers users. Your job is to distill the user's conversation history into a concise, natural-sounding memory that captures who they are and what matters to them.

## What to capture (in order of priority):
1. **Identity & Context**: What the user does, their role, their current situation
2. **Recurring Themes**: Topics they bring up repeatedly across conversations
3. **Preferences & Style**: How they like information presented, their communication style
4. **Active Projects**: What they're currently working on or trying to accomplish
5. **Explicit Requests**: Things they directly asked you to remember

## What to ignore:
- One-off questions or temporary queries
- Greetings, small talk, or filler
- Information already in their profile (name, goal, custom instructions)
- Anything that won't be relevant in future conversations

## Writing style:
- Write in natural, flowing sentences like a human would remember someone
- Use the format: "User is [role/identity]. User likes [interests]. User wants [goals]. User often discusses [topics]. User is working on [projects]."
- Be specific, not generic. Instead of "User likes coding", say "User is a React developer building a SaaS dashboard"
- Prioritize the most important 2-3 facts if space is tight
- Update incrementally: keep what's still true, drop what's outdated, add what's new

## Hard rules:
- Maximum 500 characters including spaces and punctuation
- Never duplicate profile information (name, goal, custom instructions)
- If the existing summary is good, only add genuinely new information
- When at capacity, drop the least important/relevant fact to make room for new ones`;

export async function getUserSummary(userId: string): Promise<string | null> {
  const supabase = await createChatServerClient();
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

  const supabase = await createChatServerClient();
  
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
  const userMessages = conversationHistory
    .filter(m => m.role === 'user')
    .slice(-10)
    .map(m => m.content)
    .join('\n---\n');

  const summaryContext = `
## Current memory:
${existingSummary}

${profileInfo}

## Recent user messages (last 10):
${userMessages}

## Task:
Review the recent messages and update the memory. Follow the system prompt rules:
- Add new, genuinely important information about the user
- Keep what's still accurate from the current memory
- Remove anything that's become outdated or irrelevant
- Stay under 500 characters
- Never duplicate profile info
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
  const lowerMessage = userMessage.toLowerCase();
  
  // Personal context triggers - user is talking about themselves
  const personalTriggers = [
    'remember', 'before', 'earlier', 'previously', 'past', 'mentioned',
    'told you', 'said', 'discussed', 'talked about', 'my', 'i am',
    'i like', 'i want', 'i need', 'working on', 'project', 'my project',
    'my work', 'my job', 'my goal', 'about me', 'know about me',
    'what do you know', 'recall', 'remind me'
  ];
  
  // Reference triggers - user is referring to something previously discussed
  const referenceTriggers = [
    'that thing', 'what we discussed', 'our conversation', 'as i said',
    'like i mentioned', 'the thing about', 'going back to', 'continuing from'
  ];
  
  const allTriggers = [...personalTriggers, ...referenceTriggers];
  return allTriggers.some(keyword => lowerMessage.includes(keyword));
}
