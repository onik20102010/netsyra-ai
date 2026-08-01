import { NextRequest, NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "groq/compound";
const GROQ_MODEL_FALLBACK = "groq/compound-mini";
const TIMEOUT_MS = 45000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, cvData } = body;

    const groqApiKey = process.env.GROQ_API_KEY_3;

    if (!groqApiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY_3 is not configured in .env.local" },
        { status: 500 }
      );
    }

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required." },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a professional CV writer and career coach. You write in a warm, natural, human tone — never robotic or generic. You create compelling, concise content that sounds like a real person wrote it. You do NOT output any HTML, CSS, or design code. You only output plain text content.

Rules:
- Write in first person for summaries (e.g., "I am a dedicated...") 
- Write in action-oriented language for experience descriptions
- Keep summaries to 2-3 sentences max
- Keep experience descriptions to 1-2 sentences
- Use natural, conversational language — avoid buzzwords and clichés
- Tailor the tone to the person's actual experience level and field
- Do not use phrases like "passionate about", "results-driven", "team player" — use specific, real language
- Output ONLY the requested text content, no preamble or explanation`;

    const userContent = `${prompt}

CV Data:
${JSON.stringify(cvData, null, 2)}`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages,
          max_tokens: 2048,
          temperature: 0.8,
        }),
        signal: controller.signal,
      });
    } catch {
      // Fallback to compound-mini if compound fails
      clearTimeout(timeout);
      const controller2 = new AbortController();
      const timeout2 = setTimeout(() => controller2.abort(), TIMEOUT_MS);
      response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL_FALLBACK,
          messages,
          max_tokens: 2048,
          temperature: 0.8,
        }),
        signal: controller2.signal,
      });
      clearTimeout(timeout2);
    }

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Groq API error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { error: `AI request failed (${response.status}). Please try again.` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (content) {
      return NextResponse.json(
        { content },
        {
          headers: {
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    return NextResponse.json(
      { error: "AI returned an empty response." },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("CV Builder AI route error:", error);
    if (error.name === "AbortError") {
      return NextResponse.json(
        { error: "AI request timed out. Please try again." },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
