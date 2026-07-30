import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const TIMEOUT_MS = 30000;
const MAX_MESSAGES = 50;
const MAX_CONTENT_LENGTH = 8000;

const VALID_ROLES = new Set(['system', 'user', 'assistant']);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body;

    // SECURITY: Only use GROQ_API_KEY_2 from server-side env, no fallbacks
    const groqApiKey = process.env.GROQ_API_KEY_2;

    if (!groqApiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY_2 is not configured in .env.local' },
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

    // Single model, single key — no fallback chain
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
          model: GROQ_MODEL,
          messages: sanitizedMessages,
          max_tokens: 4096,
          temperature: 0.7,
        }),
        signal: controller.signal,
      });
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
          { headers: { 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' } }
        );
      }

      return NextResponse.json(
        { error: 'AI returned an empty response.' },
        { status: 500 }
      );
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        return NextResponse.json(
          { error: `AI timed out after ${TIMEOUT_MS}ms.` },
          { status: 504 }
        );
      }
      throw err;
    }
  } catch (error) {
    console.error('Groq route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
