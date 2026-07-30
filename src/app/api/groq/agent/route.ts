import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const TIMEOUT_MS = 30000;
const MAX_CONTENT_LENGTH = 12000;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 2000;

const VALID_ROLES = new Set(['system', 'user', 'assistant']);

async function callGroqWithRetry(
  groqApiKey: string,
  requestBody: Record<string, any>,
  maxRetries: number = MAX_RETRIES
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      // Retry on 429 rate limit
      if (response.status === 429 && attempt < maxRetries) {
        const errorBody = await response.json().catch(() => ({}));
        const retryAfter = errorBody.error?.message?.match(/try again in ([\d.]+)s/i);
        const delay = retryAfter
          ? Math.ceil(parseFloat(retryAfter[1]) * 1000)
          : RETRY_BASE_DELAY * Math.pow(2, attempt);
        console.warn(`Agent: 429 rate limit, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      return response;
    } catch (err: any) {
      clearTimeout(timeout);
      if (attempt < maxRetries && err.name !== 'AbortError') {
        await new Promise(resolve => setTimeout(resolve, RETRY_BASE_DELAY * Math.pow(2, attempt)));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries exceeded');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, temperature, json_mode, stream } = body;

    // SECURITY: Only use GROQ_API_KEY_2 from server-side env
    const groqApiKey = process.env.GROQ_API_KEY_2;

    if (!groqApiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY_2 is not configured in .env.local' },
        { status: 500 }
      );
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required.' },
        { status: 400 }
      );
    }

    // Sanitize messages
    const sanitizedMessages = messages.map((msg: any) => {
      const role = typeof msg.role === 'string' && VALID_ROLES.has(msg.role) ? msg.role : 'user';
      const content = typeof msg.content === 'string' ? msg.content.slice(0, MAX_CONTENT_LENGTH) : '';
      return { role, content };
    });

    const requestBody: Record<string, any> = {
      model: GROQ_MODEL,
      messages: sanitizedMessages,
      max_tokens: 4096,
      temperature: typeof temperature === 'number' ? temperature : 0.1,
    };

    if (json_mode) {
      requestBody.response_format = { type: 'json_object' };
    }

    // --- Streaming mode: return SSE stream ---
    if (stream) {
      requestBody.stream = true;

      const encoder = new TextEncoder();
      const streamResponse = new ReadableStream({
        async start(controller) {
          let groqResponse: Response;
          try {
            groqResponse = await callGroqWithRetry(groqApiKey, requestBody);
          } catch (err: any) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
            controller.close();
            return;
          }

          if (!groqResponse.ok) {
            const errorText = await groqResponse.text();
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: `Agent request failed (${groqResponse.status})` })}\n\n`));
            controller.close();
            return;
          }

          const reader = groqResponse.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6).trim();
                  if (data === '[DONE]') {
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                    return;
                  }
                  // Forward the SSE event as-is
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                }
              }
            }
          } catch (err) {
            console.error('Agent stream error:', err);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(streamResponse, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // --- Non-streaming mode ---
    const response = await callGroqWithRetry(groqApiKey, requestBody);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Agent Groq API error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { error: `Agent request failed (${response.status}). Please try again.` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'Agent returned an empty response.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { content },
      { headers: { 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return NextResponse.json(
        { error: `Agent timed out after ${TIMEOUT_MS}ms.` },
        { status: 504 }
      );
    }
    console.error('Agent route error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
