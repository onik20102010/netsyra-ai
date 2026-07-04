import { CURATED_SOURCES, type CuratedSource } from "./curated-sources";

const ROUTER_MODEL = {
  endpoint: "https://api.groq.com/openai/v1/chat/completions",
  apiKeyEnv: "GROQ_API_KEY_4",
  model: "groq/compound-mini",
};

export async function routeToCuratedSources(query: string): Promise<CuratedSource[]> {
  const apiKey = process.env[ROUTER_MODEL.apiKeyEnv];
  if (!apiKey || CURATED_SOURCES.length === 0) return [];

  // Build a list of available sources
  const sourceList = CURATED_SOURCES.map(
    (s, i) => `${i + 1}. ${s.title} → ${s.url}`
  ).join("\n");

  try {
    console.log(`🧠 Curated router called for: "${query}"`);
    console.log(`   Available sources: ${CURATED_SOURCES.map(s => s.title).join(", ")}`);

    const res = await fetch(ROUTER_MODEL.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: ROUTER_MODEL.model,
        messages: [
          {
            role: "system",
            content:
              `You are a search router. Given a user query, decide which of the following curated sources are relevant. Return ONLY a JSON array of the source numbers (e.g., [1,3]). If none are relevant, return [].\n\nAvailable sources:\n${sourceList}`,
          },
          { role: "user", content: query },
        ],
        temperature: 0,
        max_tokens: 50,
      }),
    });

    console.log(`   Router response status: ${res.status}`);

    if (!res.ok) {
      console.log("⚠️ Curated router LLM call failed – falling back to keyword matching");
      const lowerQuery = query.toLowerCase();
      return CURATED_SOURCES.filter((s) =>
        s.title.toLowerCase().includes(lowerQuery) ||
        s.url.toLowerCase().includes(lowerQuery)
      );
    }

    const data = await res.json();
    console.log(`   Router raw output: ${data.choices?.[0]?.message?.content}`);
    const raw = data.choices?.[0]?.message?.content?.trim() || "[]";
    // Extract JSON array from the response
    const match = raw.match(/\[.*\]/);
    if (!match) {
      console.log("⚠️ Curated router LLM call failed – falling back to keyword matching");
      const lowerQuery = query.toLowerCase();
      return CURATED_SOURCES.filter((s) =>
        s.title.toLowerCase().includes(lowerQuery) ||
        s.url.toLowerCase().includes(lowerQuery)
      );
    }

    const indices: number[] = JSON.parse(match[0]);
    return indices
      .map((i) => CURATED_SOURCES[i - 1])
      .filter(Boolean);
  } catch {
    console.log("⚠️ Curated router LLM call failed – falling back to keyword matching");
    const lowerQuery = query.toLowerCase();
    return CURATED_SOURCES.filter((s) =>
      s.title.toLowerCase().includes(lowerQuery) ||
      s.url.toLowerCase().includes(lowerQuery)
    );
  }
}
