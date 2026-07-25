// Pro Conversation Summary System
// Chat-specific incremental summary generation for Pro plan users
// Maintains detailed conversation history with 1500 character limit

import { createServerSupabaseClient } from "@/lib/supabase/server";

interface ProConversationSummary {
  id: string;
  conversation_id: string;
  summary: string;
  user_overview: string;
  likes_dislikes: string;
  interests: string;
  frequent_topics: Record<string, number>;
  direct_requests: string[];
  message_count: number;
  last_updated_at: string;
  created_at: string;
}

const PRO_CONVERSATION_SUMMARY_PROMPT = `You are an advanced conversation memory system, similar to how ChatGPT maintains context in long conversations. Your job is to build and maintain a running summary of this specific conversation, updated incrementally as each new message arrives.

## What to capture (in order of priority):

### 1. User Overview
- Who the user is in the context of THIS conversation
- Their apparent expertise level and background
- The main goal or purpose of this conversation
- Key decisions or conclusions reached so far

### 2. Preferences & Opinions
- What the user likes or dislikes (tools, approaches, styles)
- Opinions they've expressed on topics discussed
- Their communication preferences (detail level, format, tone)
- Any frustrations or pain points they've shared

### 3. Interests & Passions
- Topics they show genuine enthusiasm about
- Areas where they ask deeper follow-up questions
- Subjects they return to or explore in detail

### 4. Recurring Topics (with frequency)
- Track topics mentioned 3+ times
- Note the context in which they come up
- Prioritize topics mentioned 10+ times as "core interests"

### 5. Explicit Memory Requests
- Things the user directly asked you to remember
- Information they flagged as important
- References they want preserved for later

## Writing style:
- Write in natural, flowing prose like a human taking notes
- Be specific and concrete, not vague
- Use the user's own terminology when they have strong preferences
- Structure with clear sections but keep the writing natural
- Prioritize depth over breadth: 3-4 well-described facts > 10 shallow ones

## Update strategy:
- **Add**: New information that reveals something meaningful about the user
- **Keep**: Existing information that's still accurate and relevant
- **Refine**: Update existing entries when new information provides better context
- **Drop**: Information that's become irrelevant or was based on a single mention
- **Merge**: Combine related observations into richer, more nuanced entries

## Hard rules:
- Maximum 1500 characters including spaces and punctuation
- This summary is for THIS conversation only - do not include cross-chat context
- Preserve direct user requests as highest priority
- When at capacity, drop the least important/relevant information first
- Track mention frequency: topics mentioned 10+ times must be preserved`;

export async function getProConversationSummary(
  conversationId: string
): Promise<ProConversationSummary | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("pro_conversation_summaries")
    .select("*")
    .eq("conversation_id", conversationId)
    .single();

  if (error || !data) return null;
  return data as ProConversationSummary;
}

export async function updateProConversationSummary(
  conversationId: string,
  newMessage: { role: string; content: string },
  existingSummary: ProConversationSummary | null
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  
  // Get conversation message count
  const { count: messageCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("conversation_id", conversationId);

  if (!messageCount || messageCount < 30) {
    // Only start summarizing after 30 messages
    return;
  }

  // Build context for summary update
  const existingSummaryText = existingSummary ? `
## Current conversation memory:
${existingSummary.summary}

### Stored sections:
- Overview: ${existingSummary.user_overview}
- Likes/Dislikes: ${existingSummary.likes_dislikes}
- Interests: ${existingSummary.interests}
- Frequent topics: ${JSON.stringify(existingSummary.frequent_topics)}
- Direct requests: ${existingSummary.direct_requests.join(" | ")}
` : "No existing memory. Create the initial conversation memory.";

  const summaryContext = `
${existingSummaryText}

## New message to integrate:
${newMessage.role.toUpperCase()}: ${newMessage.content}

## Task:
Update the conversation memory by incorporating this new message. Follow the system prompt rules:
- Add new, meaningful information about the user
- Keep what's still accurate from the current memory
- Refine or merge related observations
- Drop anything that's become irrelevant
- Stay under 1500 characters
- Track mention frequency (topics mentioned 10+ times are core interests)
`;

  try {
    // Use Groq API key 4 for summary generation
    const apiKey = process.env.GROQ_API_KEY_4;
    if (!apiKey) {
      console.error("GROQ_API_KEY_4 is not configured");
      return;
    }

    // Use a capable model for Pro users
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: PRO_CONVERSATION_SUMMARY_PROMPT },
          { role: "user", content: summaryContext },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error("Failed to update pro conversation summary:", response.statusText);
      return;
    }

    const data = await response.json();
    const newSummary = data.choices?.[0]?.message?.content?.trim();

    if (!newSummary) {
      console.error("Empty summary generated");
      return;
    }

    // Ensure summary is under 1500 characters
    const truncatedSummary = newSummary.length > 1500 ? newSummary.slice(0, 1500) : newSummary;

    // Parse the summary into structured components
    const structuredSummary = parseStructuredSummary(newSummary);
    
    // Update frequent topics based on new message
    const updatedFrequentTopics = updateFrequentTopics(
      newMessage.content,
      existingSummary?.frequent_topics || {}
    );

    // Check for direct requests in new message
    const updatedDirectRequests = updateDirectRequests(
      newMessage.content,
      existingSummary?.direct_requests || []
    );

    // Upsert the summary
    await supabase
      .from("pro_conversation_summaries")
      .upsert(
        {
          conversation_id: conversationId,
          summary: truncatedSummary,
          user_overview: structuredSummary.user_overview || existingSummary?.user_overview || "",
          likes_dislikes: structuredSummary.likes_dislikes || existingSummary?.likes_dislikes || "",
          interests: structuredSummary.interests || existingSummary?.interests || "",
          frequent_topics: updatedFrequentTopics,
          direct_requests: updatedDirectRequests,
          message_count: messageCount,
          last_updated_at: new Date().toISOString(),
        },
        { onConflict: "conversation_id" }
      );

    console.log("Pro conversation summary updated for conversation:", conversationId);
  } catch (error) {
    console.error("Error updating pro conversation summary:", error);
  }
}

function parseStructuredSummary(summary: string): {
  user_overview: string;
  likes_dislikes: string;
  interests: string;
} {
  const sections: any = {
    user_overview: "",
    likes_dislikes: "",
    interests: "",
  };

  const lines = summary.split('\n');
  let currentSection = "";

  lines.forEach(line => {
    if (line.startsWith("## User Overview")) {
      currentSection = "user_overview";
    } else if (line.startsWith("## Likes, Dislikes")) {
      currentSection = "likes_dislikes";
    } else if (line.startsWith("## Interests")) {
      currentSection = "interests";
    } else if (line.startsWith("##") && currentSection) {
      currentSection = ""; // End of current section
    } else if (currentSection && line.trim()) {
      sections[currentSection] += line.trim() + " ";
    }
  });

  return sections;
}

function updateFrequentTopics(message: string, existingTopics: Record<string, number>): Record<string, number> {
  const updatedTopics = { ...existingTopics };
  const words = message.toLowerCase().split(/\s+/);
  
  // Extract meaningful phrases (2-3 words)
  for (let i = 0; i < words.length - 1; i++) {
    const twoWordPhrase = `${words[i]} ${words[i + 1]}`;
    if (twoWordPhrase.length > 5) { // Only meaningful phrases
      updatedTopics[twoWordPhrase] = (updatedTopics[twoWordPhrase] || 0) + 1;
    }
  }

  // Remove topics mentioned less than 3 times
  Object.keys(updatedTopics).forEach(topic => {
    if (updatedTopics[topic] < 3) {
      delete updatedTopics[topic];
    }
  });

  return updatedTopics;
}

function updateDirectRequests(message: string, existingRequests: string[]): string[] {
  const updatedRequests = [...existingRequests];
  const lowerMessage = message.toLowerCase();
  
  // Detect direct requests to remember
  const rememberKeywords = [
    'remember this', 'don\'t forget', 'keep in mind', 'note that',
    'important to remember', 'make sure to remember', 'save this'
  ];

  if (rememberKeywords.some(keyword => lowerMessage.includes(keyword))) {
    // Extract the request (simplified)
    const request = message.trim();
    if (!updatedRequests.includes(request)) {
      updatedRequests.push(request);
    }
  }

  // Keep only last 10 direct requests
  if (updatedRequests.length > 10) {
    updatedRequests.splice(0, updatedRequests.length - 10);
  }

  return updatedRequests;
}

export async function buildProMessageContext(
  conversationId: string,
  recentMessages: Array<{ role: string; content: string }>,
  totalMessageCount: number
): Promise<Array<{ role: string; content: string }>> {
  const MESSAGE_THRESHOLD = 30;
  
  // If conversation is short, return messages as-is
  if (totalMessageCount <= MESSAGE_THRESHOLD) {
    return recentMessages;
  }

  // Get existing summary
  const summary = await getProConversationSummary(conversationId);
  
  if (!summary) {
    // No summary exists yet, return recent messages
    return recentMessages;
  }

  // Build context with summary + recent 30 messages
  const summaryText = `
## CONVERSATION SUMMARY
${summary.summary}

## USER OVERVIEW
${summary.user_overview}

## LIKES/DISLIKES
${summary.likes_dislikes}

## INTERESTS
${summary.interests}

## FREQUENTLY DISCUSSED TOPICS
${Object.entries(summary.frequent_topics)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([topic, count]) => `- ${topic} (mentioned ${count} times)`)
  .join('\n')}

## DIRECT REQUESTS TO REMEMBER
${summary.direct_requests.map(req => `- ${req}`).join('\n')}
`;

  return [
    {
      role: "system",
      content: `This is a summary of the earlier conversation (beyond the last 30 messages). Use this context when the user references past information or topics not covered in recent messages.\n\n${summaryText}`,
    },
    ...recentMessages.slice(-30), // Always keep last 30 messages
  ];
}
