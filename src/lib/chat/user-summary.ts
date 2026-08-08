// User Summary System for Free Plan
// Creates and maintains a 200-character summary of user info across all chats
// Stores only: profession, field, preferences, active projects
//
// NEW BEHAVIOR:
// - NO summary per individual chat
// - Summary is ONLY written to Supabase when the user has described the same
//   thing (same topic/profession/project) across 5+ DIFFERENT conversations
// - This prevents wasting API calls on users who just ask one-off questions

import { createServerSupabaseClient } from "@/lib/supabase/server";

interface UserSummary {
  id: string;
  user_id: string;
  summary: string;
  interaction_counts: Record<string, number>;
  last_updated_at: string;
  message_count_at_update: number;
}

const USER_SUMMARY_PROMPT = `You are a personal memory system. Your job is to distill the user's conversation history into a very concise profile.

## What to capture (only user identity info):
1. **Profession/Field**: What the user does — programmer, doctor, engineer, student, etc.
2. **Active Projects**: What they're currently working on
3. **Key Preferences**: What they prefer (tools, languages, approaches)

## What to ignore:
- One-off questions, greetings, small talk
- Information already in their profile (name, goal, custom instructions)
- Temporary or trivial details

## Writing style:
- Write in natural, flowing sentences
- Be specific: "User is a React developer building a SaaS dashboard" not "User likes coding"
- Update incrementally: keep what's still true, drop what's outdated, add what's new

## Hard rules:
- Maximum 200 characters including spaces and punctuation
- Never duplicate profile information (name, goal, custom instructions)
- If the existing summary is good, only add genuinely new information
- When at capacity, drop the least important fact to make room for new ones`;

// LLM prompt to detect if user describes the same thing across multiple chats
const CROSS_CHAT_DETECTION_PROMPT = `You are a pattern detection system. Analyze user messages from MULTIPLE different conversations and determine if the user has described the SAME topic, profession, project, or preference repeatedly across different chats.

Return a JSON object:
{
  "hasRecurringPattern": true/false,
  "recurringTopic": "brief description of what keeps coming up, or empty string"
}

Rules:
- "hasRecurringPattern" = true ONLY if the user talks about the same thing (e.g., same project, same profession, same tool) in 3+ of the conversations shown
- One-off questions like "what's the weather" or "tell me a joke" do NOT count
- The user must be describing something about THEMSELVES or THEIR WORK repeatedly
- If the messages are just random questions with no personal pattern, return false
- If the user mentions "my project" or "I'm building" or "I work with" in multiple chats, that counts`;

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

/**
 * Count how many distinct conversations a user has.
 */
async function countUserConversations(userId: string): Promise<number> {
  const supabase = await createServerSupabaseClient();
  const { count, error } = await supabase
    .from("conversations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  return error ? 0 : (count || 0);
}

/**
 * Fetch the first user message from each of the user's recent conversations.
 * This gives us a sample of what the user talks about across different chats.
 */
async function fetchCrossChatUserMessages(
  userId: string,
  maxConversations: number = 10
): Promise<string[]> {
  const supabase = await createServerSupabaseClient();

  // Get the user's recent conversations
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(maxConversations);

  if (!conversations || conversations.length === 0) return [];

  const messages: string[] = [];

  // For each conversation, get the first 2 user messages
  for (const conv of conversations) {
    const { data: userMsgs } = await supabase
      .from("messages")
      .select("content")
      .eq("conversation_id", conv.id)
      .eq("user_id", userId)
      .eq("role", "user")
      .order("created_at", { ascending: true })
      .limit(2);

    if (userMsgs && userMsgs.length > 0) {
      messages.push(userMsgs.map(m => m.content).join(' '));
    }
  }

  return messages;
}

/**
 * Use LLM to detect if the user describes the same thing across multiple chats.
 * Returns true only if there's a recurring personal pattern.
 */
async function detectCrossChatPattern(
  crossChatMessages: string[]
): Promise<{ hasRecurringPattern: boolean; recurringTopic: string }> {
  if (crossChatMessages.length < 5) {
    return { hasRecurringPattern: false, recurringTopic: "" };
  }

  const apiKey = process.env.GROQ_API_KEY_4;
  if (!apiKey) {
    console.error("GROQ_API_KEY_4 is not configured");
    return { hasRecurringPattern: false, recurringTopic: "" };
  }

  const messagesContext = crossChatMessages
    .map((msg, i) => `CHAT ${i + 1}: ${msg.slice(0, 200)}`)
    .join('\n---\n');

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: CROSS_CHAT_DETECTION_PROMPT },
          { role: "user", content: `Analyze these user messages from ${crossChatMessages.length} different conversations:\n\n${messagesContext}` },
        ],
        temperature: 0.1,
        max_tokens: 200,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.error("Pattern detection failed:", response.statusText);
      return { hasRecurringPattern: false, recurringTopic: "" };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) return { hasRecurringPattern: false, recurringTopic: "" };

    const parsed = JSON.parse(content);
    return {
      hasRecurringPattern: !!parsed.hasRecurringPattern,
      recurringTopic: parsed.recurringTopic || "",
    };
  } catch (error) {
    console.error("Error in pattern detection:", error);
    return { hasRecurringPattern: false, recurringTopic: "" };
  }
}

/**
 * Generate user summary — ONLY writes to Supabase when:
 * 1. User has 5+ different conversations
 * 2. LLM detects the user describes the same thing across those conversations
 *
 * This prevents wasting API calls on users who just ask one-off questions.
 */
export async function generateUserSummary(
  userId: string,
  conversationHistory: Array<{ role: string; content: string }>,
  totalMessageCount: number
): Promise<void> {
  // ── Step 1: Check if user has 5+ different conversations ──
  const conversationCount = await countUserConversations(userId);
  if (conversationCount < 5) {
    // User hasn't had enough different chats yet — no summary
    return;
  }

  // ── Step 2: Fetch what the user talks about across different chats ──
  const crossChatMessages = await fetchCrossChatUserMessages(userId, 10);
  if (crossChatMessages.length < 5) {
    return;
  }

  // ── Step 3: Use LLM to detect if user describes the same thing repeatedly ──
  const { hasRecurringPattern, recurringTopic } = await detectCrossChatPattern(crossChatMessages);
  if (!hasRecurringPattern) {
    // User asks random questions with no recurring personal pattern — skip
    return;
  }

  console.log(`✅ Cross-chat pattern detected for user ${userId}: "${recurringTopic}"`);

  // ── Step 4: Pattern confirmed — generate/update the summary ──
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

  // Build context for summary generation — include cross-chat messages + current chat
  const userMessages = conversationHistory
    .filter(m => m.role === 'user')
    .slice(-10)
    .map(m => m.content)
    .join('\n---\n');

  const crossChatContext = crossChatMessages
    .map((msg, i) => `CHAT ${i + 1}: ${msg.slice(0, 200)}`)
    .join('\n---\n');

  const summaryContext = `
## Current memory:
${existingSummary}

${profileInfo}

## Recurring topic detected across ${crossChatMessages.length} chats:
${recurringTopic}

## Messages from different chats:
${crossChatContext}

## Recent user messages from current chat (last 10):
${userMessages}

## Task:
The user has described the same thing across multiple different chats. Review all the messages and update the memory. Follow the system prompt rules:
- Add new, genuinely important information about the user
- Keep what's still accurate from the current memory
- Remove anything that's become outdated or irrelevant
- Stay under 200 characters
- Never duplicate profile info
`;

  try {
    const apiKey = process.env.GROQ_API_KEY_4;
    if (!apiKey) {
      console.error("GROQ_API_KEY_4 is not configured");
      return;
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: USER_SUMMARY_PROMPT },
          { role: "user", content: summaryContext },
        ],
        temperature: 0.3,
        max_tokens: 400,
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

    const truncatedSummary = newSummary.length > 200 ? newSummary.slice(0, 200) : newSummary;

    // Update interaction counts
    const newInteractionCounts = { ...interactionCounts };
    conversationHistory.slice(-10).forEach(msg => {
      if (msg.role === 'user') {
        const words = msg.content.toLowerCase().split(/\s+/);
        words.forEach(word => {
          if (word.length > 3) {
            newInteractionCounts[word] = (newInteractionCounts[word] || 0) + 1;
          }
        });
      }
    });

    // Upsert the summary to Supabase
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

    console.log("User summary updated for user:", userId, "— triggered by cross-chat pattern");
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
