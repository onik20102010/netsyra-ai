// d:\netsyra\src\app\api\groq\chat\route.ts
import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

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

    // Use provided API key or fall back to environment variable (GROQ_API_KEY_2 takes priority)
    const groqApiKey = apiKey || process.env.GROQ_API_KEY_2 || process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;

    if (!groqApiKey) {
      return NextResponse.json(
        { error: 'API key is required. Please set GROQ_API_KEY or NEXT_PUBLIC_GROQ_API_KEY in your environment.' },
        { status: 400 }
      );
    }

    // Try each model in order until one succeeds
    for (const model of GROQ_MODELS) {
      try {
        console.log(`Trying model: ${model}`);
        
        // Sanitize messages - remove timestamp and attachedFiles properties
        const sanitizedMessages = messages.map((msg: any) => {
  // Explicitly strip timestamp and attachedFiles even if they are undefined
  const { timestamp, attachedFiles, ...rest } = msg;
  return rest;
});
        
        // Create timeout controller
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        
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
          const error = await response.text();
          console.warn(`Model ${model} failed: ${response.status} - ${error}`);
          continue; // Try next model
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        
        if (content) {
          console.log(`Successfully used model: ${model}`);
          return NextResponse.json({ content });
        }
      } catch (error) {
        console.warn(`Error with model ${model}:`, error);
        continue; // Try next model
      }
    }

    return NextResponse.json(
      { error: 'All Groq models failed. Please check your API key and try again.' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error in Groq API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
