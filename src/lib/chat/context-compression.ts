// Context Compression Service
// Keeps recent turns verbatim and compresses older turns into a rolling summary.
// This reduces token cost on long conversations without losing continuity.

interface ChatMsg {
  role: string;
  content: string;
}

// Keep this many of the most recent messages verbatim.
const RECENT_TURNS = 6;
// Only compress when the conversation exceeds this many messages.
const COMPRESS_THRESHOLD = 12;

const CONVERSATION_SUMMARY_PROMPT = `You are a conversation compression system. Condense the earlier part of a chat between a user and an AI assistant into a compact briefing so the assistant can continue seamlessly.

Capture ONLY what is needed to maintain continuity:
- Open questions, tasks, or goals still in progress
- Decisions made and constraints agreed upon
- Key facts, names, values, code, or entities referenced
- The user's intent and any preferences expressed

Rules:
- Be terse and factual. No filler, no meta-commentary.
- Output plain text (no markdown headings/lists), under 180 words.
- Preserve exact identifiers, numbers, and code tokens when relevant.`;

/**
 * Summarize older turns into a compact briefing using a lightweight model.
 * Returns null on failure so callers can fall back to the raw history.
 */
async function summarizeOlderTurns(older: ChatMsg[]): Promise<string | null> {
  const transcript = older
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: CONVERSATION_SUMMARY_PROMPT },
          { role: "user", content: `EARLIER CONVERSATION:\n${transcript}\n\nProduce the compact briefing now.` },
        ],
        temperature: 0.2,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      console.error("Context compression failed:", response.statusText);
      return null;
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content?.trim();
    return summary || null;
  } catch (error) {
    console.error("Error compressing context:", error);
    return null;
  }
}

/**
 * Compress a conversation history.
 * - Short conversations pass through unchanged.
 * - Long conversations return only the recent turns plus a rolling summary of
 *   the older turns, which the caller should inject into the system prompt.
 */
export async function compressHistory(
  messages: ChatMsg[]
): Promise<{ recent: ChatMsg[]; summary: string | null }> {
  if (messages.length <= COMPRESS_THRESHOLD) {
    return { recent: messages, summary: null };
  }

  const recent = messages.slice(-RECENT_TURNS);
  const older = messages.slice(0, -RECENT_TURNS);

  const summary = await summarizeOlderTurns(older);
  if (!summary) {
    // Compression failed — fall back to full history to avoid losing context.
    return { recent: messages, summary: null };
  }

  console.log(
    `🗜️ Context compressed: ${older.length} older turns → summary (${summary.length} chars), ${recent.length} recent turns kept`
  );
  return { recent, summary };
}
