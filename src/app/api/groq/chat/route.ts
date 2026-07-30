import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const TIMEOUT_MS = 30000; // 30 seconds
const MAX_MESSAGES = 50;
const MAX_CONTENT_LENGTH = 8000;

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

const VALID_ROLES = new Set(['system', 'user', 'assistant']);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body;

    // SECURITY: Only use server-side env variables, never accept client keys
    const groqApiKey = process.env.GROQ_API_KEY_2 || process.env.GROQ_API_KEY;
    const groqKeyEnv = process.env.GROQ_API_KEY_2 ? "GROQ_API_KEY_2" : "GROQ_API_KEY";

    if (!groqApiKey) {
      return NextResponse.json(
        { error: 'Server API key not configured.' },
        { status: 500 }
      );
    }

    // INPUT VALIDATION
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required and must not be empty.' },
        { status: 400 }
      );
    }

    if (messages.length > MAX_MESSAGES) {
      return NextResponse.json(
        { error: `Too many messages. Maximum allowed is ${MAX_MESSAGES}.` },
        { status: 413 }
      );
    }

    // STRICT SANITIZATION: Strip everything except role and content, validate both
    const sanitizedMessages = messages.map((msg: any) => {
      const role = typeof msg.role === 'string' && VALID_ROLES.has(msg.role) ? msg.role : 'user';
      const content = typeof msg.content === 'string' ? msg.content.slice(0, MAX_CONTENT_LENGTH) : '';
      return { role, content };
    });

    // Ensure at least one user message exists
    if (!sanitizedMessages.some(m => m.role === 'user')) {
      return NextResponse.json(
        { error: 'At least one user message is required.' },
        { status: 400 }
      );
    }

    // Try each model
    for (const model of GROQ_MODELS) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        console.log(`🤖 Using model: ${model} | API Key: ${groqKeyEnv} | Endpoint: ${GROQ_API_URL}`);
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
          console.warn(`❌ LLM Error: ${model} | API Key: ${groqKeyEnv} | Provider: groq | Error: ${response.status} - ${errorText}`);
          continue; // Try next model
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        if (content) {
          console.log(`✅ LLM Response: ${model} | API Key: ${groqKeyEnv} | Provider: groq | Content length: ${content.length} chars`);
          return NextResponse.json(
            { content },
            { headers: { 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' } }
          );
        }
      } catch (err: any) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') {
          console.warn(`❌ LLM Error: ${model} | API Key: ${groqKeyEnv} | Provider: groq | Error: timed out after ${TIMEOUT_MS}ms`);
        } else {
          console.warn(`❌ LLM Error: ${model} | API Key: ${groqKeyEnv} | Provider: groq | Error: ${err.message}`);
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
