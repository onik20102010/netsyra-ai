import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getRouterConfig } from '@/lib/routers/router-factory';
import { checkImageAnalysisLimit, incrementImageAnalysisUsage } from '@/lib/chat/image-analysis-limiter';

const TIMEOUT_MS = 45000;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // ── Get user's plan and router config ──
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    const userPlan = sub?.plan || 'free';
    const routerConfig = getRouterConfig(userPlan);

    if (!routerConfig.imageAnalysisEnabled) {
      return NextResponse.json(
        { error: 'Image analysis is not available on your plan.' },
        { status: 403 }
      );
    }

    // ── Check image analysis limits ──
    const limitCheck = await checkImageAnalysisLimit(
      user.id,
      routerConfig.imageAnalysisDailyLimit,
      routerConfig.imageAnalysisMonthlyTokenLimit
    );

    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: limitCheck.reason || 'Image analysis limit reached.' },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const images = formData.getAll('images') as File[];

    if (!images || images.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    const maxImages = userPlan === 'free' ? 2 : 10;
    if (images.length > maxImages) {
      return NextResponse.json({ error: `Maximum ${maxImages} images allowed per message` }, { status: 400 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const meshApiKey = process.env.MESH_API_KEY_2; // For paid plans

    // Free plan uses Gemini API key, paid plans use Mesh API key
    const apiKey = userPlan === 'free' ? geminiApiKey : meshApiKey;

    if (!apiKey) {
      return NextResponse.json(
        { error: `No ${userPlan === 'free' ? 'Gemini' : 'Mesh'} API key configured for vision processing` },
        { status: 500 }
      );
    }

    // ── Convert images to base64 (with compression via sharp if available) ──
    const imageContents = await Promise.all(
      images.map(async (image) => {
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const mimeType = image.type || 'image/png';

        // Compress image to max 768px to reduce token cost
        try {
          const sharp = (await import('sharp')).default;
          const compressed = await sharp(buffer)
            .resize(768, 768, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();
          return {
            base64: compressed.toString('base64'),
            mimeType: 'image/jpeg',
          };
        } catch {
          // sharp not available, use original
          return { base64: buffer.toString('base64'), mimeType };
        }
      })
    );

    // ── Build Gemini request body ──
    const parts: any[] = [
      {
        text: 'Describe this image: who/what is in it, visible text/names, setting, and key details for identification. Be concise.',
      },
      ...imageContents.map((img) => ({
        inline_data: {
          mime_type: img.mimeType,
          data: img.base64,
        },
      })),
    ];

    // ── Use plan-specific model ──
    const modelName = routerConfig.imageAnalysisModel;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      console.log(`🤖 Using model: ${modelName} | API Key: ${userPlan === 'free' ? 'GEMINI_API_KEY' : 'MESH_API_KEY_2'} | Endpoint: generativelanguage.googleapis.com | Plan: ${userPlan}`);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 1024,
            },
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`❌ LLM Error: ${modelName} | API Key: GEMINI_API_KEY | Provider: gemini | Error: ${response.status} - ${errorText}`);
        return NextResponse.json(
          { error: `Failed to process image: ${response.status} - ${errorText}` },
          { status: 503 }
        );
      }

      const data = await response.json();
      let description = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      description = description.trim();

      if (description) {
        console.log(`✅ LLM Response: ${modelName} | API Key: GEMINI_API_KEY | Provider: gemini | Content length: ${description.length} chars`);

        // ── Increment usage (estimate tokens: description length / 4) ──
        const tokensUsed = Math.ceil(description.length / 4);
        await incrementImageAnalysisUsage(
          user.id,
          tokensUsed,
          routerConfig.imageAnalysisDailyLimit,
          routerConfig.imageAnalysisMonthlyTokenLimit
        );

        return NextResponse.json(
          { description },
          { headers: { 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' } }
        );
      }

      return NextResponse.json(
        { error: 'Failed to process image: No description returned.' },
        { status: 503 }
      );
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        console.warn(`❌ LLM Error: ${modelName} | API Key: GEMINI_API_KEY | Provider: gemini | Error: timed out after ${TIMEOUT_MS}ms`);
        return NextResponse.json(
          { error: 'Image processing timed out.' },
          { status: 504 }
        );
      }
      console.warn(`❌ LLM Error: ${modelName} | API Key: GEMINI_API_KEY | Provider: gemini | Error: ${err.message}`);
      return NextResponse.json(
        { error: `Failed to process image: ${err.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Image processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
