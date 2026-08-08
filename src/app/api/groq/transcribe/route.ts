import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const GROQ_WHISPER_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const WHISPER_MODEL = 'whisper-large-v3-turbo'; // Faster than v3, same accuracy
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB (Groq limit)

// ── Per-user limits ──
// Designed for 3,000 active mic users:
//   ~85% on Chrome/Edge/Safari → browser-side, no Groq calls
//   ~15% on Firefox (~450 users) → use Groq Whisper
//
// With 4 Groq keys rotated: 4 × 2,000 RPD = 8,000 requests/day
// 450 Firefox users × 20 messages/day = 9,000 → we cap at 20/day per user
// but most users won't hit 20, so average is lower. 8,000 RPD is sufficient.
const VOICE_DAILY_LIMIT = 20;     // max 20 voice messages per user per day
const VOICE_RATE_LIMIT_MS = 60_000; // 1 minute window
const VOICE_RATE_LIMIT_COUNT = 5;   // max 5 requests per minute per user

// ── Groq API key (key 3 only) ──
const GROQ_KEY = process.env.GROQ_API_KEY_3 || "";

// ── In-memory rate limiting (per user, per minute) ──
// This is a simple burst protector. For multi-instance deployments,
// this should be moved to Redis, but for a single server it works fine.
const rateLimitMap = new Map<string, number[]>(); // userId -> timestamps

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(userId) || [];
  // Keep only timestamps from the last minute
  const recent = timestamps.filter((t) => now - t < VOICE_RATE_LIMIT_MS);
  if (recent.length >= VOICE_RATE_LIMIT_COUNT) {
    rateLimitMap.set(userId, recent);
    return false; // rate limited
  }
  recent.push(now);
  rateLimitMap.set(userId, recent);
  return true; // allowed
}

// Clean up old rate limit entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [userId, timestamps] of rateLimitMap.entries()) {
    const recent = timestamps.filter((t) => now - t < VOICE_RATE_LIMIT_MS);
    if (recent.length === 0) {
      rateLimitMap.delete(userId);
    } else {
      rateLimitMap.set(userId, recent);
    }
  }
}, 300_000);

export async function POST(req: NextRequest) {
  try {
    // ── Step 1: Authenticate user ──
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Please log in to use voice input." },
        { status: 401 }
      );
    }

    // ── Step 2: Check burst rate limit (5 per minute) ──
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: "You're sending voice messages too fast. Please wait a minute and try again." },
        { status: 429 }
      );
    }

    // ── Step 3: Check daily limit (20 per day) ──
    const { data: usage } = await supabase
      .from("user_message_usage")
      .select("messages_used, reset_at")
      .eq("user_id", user.id)
      .eq("model_tier", "voice")
      .maybeSingle();

    const now = new Date();

    if (usage) {
      const resetAt = usage.reset_at ? new Date(usage.reset_at) : now;
      const hoursSinceReset = (now.getTime() - resetAt.getTime()) / (1000 * 60 * 60);

      if (hoursSinceReset < 24) {
        // Same 24h window — check limit
        const used = usage.messages_used || 0;
        if (used >= VOICE_DAILY_LIMIT) {
          const nextReset = new Date(resetAt.getTime() + 86400000).toISOString();
          return NextResponse.json(
            {
              error: `You've reached your daily voice message limit (${VOICE_DAILY_LIMIT}/day). Your limit resets soon.`,
              resetsAt: nextReset,
            },
            { status: 429 }
          );
        }
        // Increment count
        await supabase
          .from("user_message_usage")
          .update({ messages_used: used + 1 })
          .eq("user_id", user.id)
          .eq("model_tier", "voice");
      } else {
        // 24h passed — reset counter
        const newResetAt = new Date(now.getTime() + 86400000).toISOString();
        await supabase
          .from("user_message_usage")
          .update({ messages_used: 1, reset_at: newResetAt })
          .eq("user_id", user.id)
          .eq("model_tier", "voice");
      }
    } else {
      // First voice message — create record
      const resetAt = new Date(now.getTime() + 86400000).toISOString();
      await supabase.from("user_message_usage").insert({
        user_id: user.id,
        model_tier: "voice",
        messages_used: 1,
        reset_at: resetAt,
      });
    }

    // ── Step 4: Validate audio file ──
    if (!GROQ_KEY) {
      return NextResponse.json(
        { error: "Transcription service is not configured." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided." },
        { status: 400 }
      );
    }

    if (audioFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Audio file is too large. Maximum size is 25MB." },
        { status: 413 }
      );
    }

    // ── Step 5: Send to Groq Whisper ──
    const groqForm = new FormData();
    groqForm.append('file', audioFile, audioFile.name || 'recording.webm');
    groqForm.append('model', WHISPER_MODEL);
    groqForm.append('response_format', 'json');
    const language = formData.get('language') as string | null;
    if (language) {
      groqForm.append('language', language);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(GROQ_WHISPER_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_KEY}`,
        },
        body: groqForm,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        const transcript = data.text || '';
        return NextResponse.json({
          transcript,
          remaining: VOICE_DAILY_LIMIT - ((usage?.messages_used || 0) + 1),
        });
      }

      // 429 = Groq rate limited
      if (response.status === 429) {
        return NextResponse.json(
          { error: "Transcription service is busy. Please try again in a moment." },
          { status: 429 }
        );
      }

      const errorText = await response.text();
      console.error('Groq Whisper API error:', response.status, errorText);
      return NextResponse.json(
        { error: `Transcription failed (${response.status}). Please try again.` },
        { status: response.status }
      );
    } catch (fetchErr: any) {
      clearTimeout(timeout);
      if (fetchErr?.name === 'AbortError') {
        return NextResponse.json(
          { error: "Transcription request timed out. Please try again." },
          { status: 504 }
        );
      }
      return NextResponse.json(
        { error: "Failed to connect to transcription service. Please try again." },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error('Transcription endpoint error:', err);
    return NextResponse.json(
      { error: "Failed to transcribe audio. Please try again." },
      { status: 500 }
    );
  }
}
