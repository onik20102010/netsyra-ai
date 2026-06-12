// src/lib/verifier.ts
export async function verifyAnswer(
  answer: string,
  sources: string[],
  userMessage: string
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return answer; // skip verification if no key

  const combinedSources = sources.join("\n\n");

  const prompt = `You are an answer verifier. Given the user's question, the AI's draft answer, and the retrieved sources, verify that every factual claim in the answer is supported by the sources.

If the answer is fully supported, return it EXACTLY as is with NO changes.
If any part is unsupported, remove or correct ONLY that part and return the fixed answer.
Never add unsupported information. Never add prefixes like "Corrected:" or "Verified:".

User question: "${userMessage}"

Sources:
${combinedSources}

Draft answer:
${answer}

Verified answer:`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) return answer;
    const data = await response.json();
    const verified = data.choices[0].message.content.trim();

    // Use verified answer if it's not empty and not just the original
    if (verified && verified.length > 10 && verified !== answer) {
      return verified;
    }
    return answer;
  } catch {
    return answer;
  }
}