import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const TIMEOUT_MS = 30000; // 30 seconds

const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'openai/gpt-oss-120b',
  'qwen/qwen3.6-27b',
  'qwen/qwen3-32b',
  'groq/compound',
  'groq/compound-mini',
  'llama-3.1-8b-instant',
  'openai/gpt-oss-20b',
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, apiKey } = body;

    // Environment variables are secure on the server
    const groqApiKey = apiKey || process.env.GROQ_API_KEY_2 || process.env.GROQ_API_KEY;

    if (!groqApiKey) {
      return NextResponse.json(
        { error: 'API key is missing. Set GROQ_API_KEY_2 or GROQ_API_KEY in .env.local' },
        { status: 400 }
      );
    }

    // STRICT SANITIZATION: Strip EVERY field except 'role' and 'content'
    const sanitizedMessages = messages.map((msg: any) => ({
      role: msg.role || 'user',
      content: msg.content || ''
    }));

    // Try each model
    for (const model of GROQ_MODELS) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const response = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqApiKey}`,
          },
          body: JSON.stringify({
            model: model,
            messages: sanitizedMessages,
            max_tokens: 4096,
            temperature: 0.7,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`Model ${model} failed: ${response.status} - ${errorText}`);
          continue; // Try next model
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        if (content) {
          return NextResponse.json({ content });
        }
      } catch (err: any) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') {
          console.warn(`Model ${model} timed out after ${TIMEOUT_MS}ms`);
        } else {
          console.warn(`Model ${model} threw error:`, err.message);
        }
        continue;
      }
    }

    return NextResponse.json(
      { error: 'All AI models failed. Please try again later.' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Groq route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
