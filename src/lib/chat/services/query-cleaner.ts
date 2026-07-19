// src/lib/services/query-cleaner.ts

const CLEANER_MODEL = {
  endpoint: "https://api.groq.com/openai/v1/chat/completions",
  apiKeyEnv: "GROQ_API_KEY_4",
  model: "groq/compound-mini",
};

export async function cleanSearchQueries(rawMessage: string): Promise<string[]> {
  // Smart split: only split on "and" / "also" when they connect distinct topics
  // Avoid splitting phrases like "and the attachment icon" or "and send button"
  const parts = rawMessage.split(/\b(and|also)\b(?!\s+(?:the|a|an|this|that|my|your)\s+\w+)/i).filter(p => p.trim().length > 3);
  if (parts.length > 1) {
    // Clean each part individually
    const cleaned = await Promise.all(parts.map(p => cleanSearchQuery(p.trim())));
    return cleaned.filter(q => q.length > 0);
  }
  // Fallback to single query
  const single = await cleanSearchQuery(rawMessage);
  return single ? [single] : [];
}

export async function cleanSearchQuery(rawMessage: string): Promise<string> {
  // Fast path: regex-based cleaning for common patterns (no API call)
  const cleaned = rawMessage
    .replace(/^(what do you know about|tell me about|who is|what is|what are|do some web searching|by doing web searching|i want|i need|please|can you|could you|help me|look at this screenshot|so now i want that|write a prompt that i paste in the windsurf agent to get the exact codes that i want|the|a|an|this|that|my|your)\s*/gi, "")
    .replace(/\s+(and|also|or|but|with|for|to|in|on|at|by|from|up|down|keep on the surface even hundred of lines in message bar ok so)\s*/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 50);

  // If the cleaned result is substantial and looks like a valid query, use it directly
  if (cleaned.length >= 3 && cleaned.split(" ").length <= 5) {
    return cleaned;
  }

  // Fallback to simple extraction if regex didn't work well
  const short = rawMessage
    .replace(/^(what do you know about|tell me about|who is|what is|what are|do some web searching|by doing web searching|i want|i need|please|can you|could you|help me|look at this screenshot|so now i want that|write a prompt that i paste in the windsurf agent to get the exact codes that i want)\s*/gi, "")
    .trim()
    .slice(0, 50);

  if (short.length < 5) return rawMessage.slice(0, 50);

  // Only call Groq if we still need help (expensive operation)
  const apiKey = process.env.GROQ_API_KEY_4;
  if (!apiKey) return short;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "groq/compound-mini",
        messages: [
          {
            role: "system",
            content: "Extract ONLY the main search terms (2-5 words max). No articles (the, a, an). No filler words. Examples: 'the attachment icon' → 'attachment icon', 'plus button and send button' → 'plus button send button', 'weather in london' → 'weather London'.",
          },
          { role: "user", content: rawMessage.slice(0, 200) },
        ],
        temperature: 0,
        max_tokens: 10,
      }),
    });
    if (!res.ok) return short;
    const data = await res.json();
    let term = data.choices?.[0]?.message?.content?.trim() || "";
    
    // Validate: if result is too long or contains newlines/paragraphs, use fallback
    if (term.length > 50 || term.includes('\n') || term.includes('•') || term.includes('-')) {
      console.warn(`Query cleaner returned invalid result, using fallback: ${term.slice(0, 50)}...`);
      return short;
    }
    
    return term || short;
  } catch {
    return short;
  }
}