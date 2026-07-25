import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { checkImageAnalysisLimitsExhausted, deductImageAnalysisCredit } from '@/lib/chat/ni-router';

const TIMEOUT_MS = 45000;

// Gemini vision models (Groq has no vision models available with current keys)
const GEMINI_VISION_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.5-flash-lite',
];

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if image analysis limits are exhausted
    const isExhausted = await checkImageAnalysisLimitsExhausted(user.id, supabase);
    if (isExhausted) {
      return NextResponse.json(
        { error: 'Your image analysis limits have been exhausted. Daily limit: 30 images, Monthly limit: 600 images.' },
        { status: 429 }
      );
    }

    // Deduct credit before processing
    const creditResult = await deductImageAnalysisCredit(user.id, supabase);
    if (!creditResult.success) {
      return NextResponse.json(
        { error: creditResult.error || 'Failed to deduct image analysis credit' },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const images = formData.getAll('images') as File[];

    if (!images || images.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    if (images.length > 2) {
      return NextResponse.json({ error: 'Maximum 2 images allowed' }, { status: 400 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'No Gemini API key configured for vision processing' },
        { status: 500 }
      );
    }

    // Convert images to base64
    const imageContents = await Promise.all(
      images.map(async (image) => {
        const bytes = await image.arrayBuffer();
        const base64 = Buffer.from(bytes).toString('base64');
        const mimeType = image.type || 'image/png';
        return { base64, mimeType };
      })
    );

    // Build Gemini request body
    const parts: any[] = [
      {
        text: 'Describe what you see in this image concisely. Include: main subjects, text content, colors, and context. Keep it under 10 lines.',
      },
      ...imageContents.map((img) => ({
        inline_data: {
          mime_type: img.mimeType,
          data: img.base64,
        },
      })),
    ];

    let lastError = '';

    for (const modelName of GEMINI_VISION_MODELS) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024,
              },
            }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeout);

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`Gemini vision model ${modelName} failed: ${response.status} - ${errorText}`);
          lastError = `${response.status}: ${errorText}`;
          continue;
        }

        const data = await response.json();
        let description = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        description = description.trim();

        if (description) {
          console.log(`Vision success: model=${modelName}`);
          return NextResponse.json(
            { description },
            { headers: { 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' } }
          );
        }
      } catch (err: any) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') {
          console.warn(`Gemini vision model ${modelName} timed out`);
          lastError = 'timeout';
        } else {
          console.warn(`Gemini vision model ${modelName} error:`, err.message);
          lastError = err.message;
        }
        continue;
      }
    }

    console.error('All vision model attempts failed. Last error:', lastError);
    return NextResponse.json(
      { error: 'Failed to process images. All vision models unavailable.' },
      { status: 503 }
    );
  } catch (error) {
    console.error('Image processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
