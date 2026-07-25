// Unified Memory System — single pipeline for all summary types
// Replaces three separate API calls with one batched pipeline.
// Queue-based incremental updates instead of per-message processing.

import { createServerSupabaseClient } from '@/lib/supabase/server';

// ── Types ───────────────────────────────────────────────────
interface PendingMessage {
  role: string;
  content: string;
  timestamp: number;
}

interface SummaryQueueEntry {
  userId: string;
  conversationId: string;
  pendingMessages: PendingMessage[];
  lastProcessedAt: number;
  plan: 'free' | 'pro';
}

// ── In-memory queue ────────────────────────────────────────
const summaryQueue = new Map<string, SummaryQueueEntry>();

// Processing thresholds
const FREE_BATCH_SIZE = 5;    // Free: process every 5 messages
const PRO_BATCH_SIZE = 10;    // Pro: process every 10 messages
const FREE_MAX_CHARS = 500;   // Free user summary max chars
const PRO_USER_MAX_CHARS = 1000;  // Pro user summary max chars
const PRO_CONV_MAX_CHARS = 1500;  // Pro conversation summary max chars
const MAX_QUEUE_AGE_MS = 5 * 60 * 1000; // Process if older than 5 min

// ── Queue management ───────────────────────────────────────
function getQueueKey(userId: string, conversationId: string): string {
  return `${userId}:${conversationId}`;
}

/**
 * Add a message to the summary processing queue.
 * Does NOT trigger processing — that happens when the batch is full or on a timer.
 */
export function queueMessage(
  userId: string,
  conversationId: string,
  role: string,
  content: string,
  plan: 'free' | 'pro' = 'free'
): void {
  const key = getQueueKey(userId, conversationId);
  let entry = summaryQueue.get(key);

  if (!entry) {
    entry = {
      userId,
      conversationId,
      pendingMessages: [],
      lastProcessedAt: Date.now(),
      plan,
    };
    summaryQueue.set(key, entry);
  }

  entry.pendingMessages.push({
    role,
    content,
    timestamp: Date.now(),
  });
}

/**
 * Check if a queue entry should be processed now.
 */
export function shouldProcessQueue(userId: string, conversationId: string): boolean {
  const key = getQueueKey(userId, conversationId);
  const entry = summaryQueue.get(key);
  if (!entry || entry.pendingMessages.length === 0) return false;

  const batchSize = entry.plan === 'pro' ? PRO_BATCH_SIZE : FREE_BATCH_SIZE;
  const ageMs = Date.now() - entry.lastProcessedAt;

  return entry.pendingMessages.length >= batchSize || ageMs >= MAX_QUEUE_AGE_MS;
}

/**
 * Process the queue for a user+conversation.
 * Generates summaries in a single Groq API call.
 * Returns the generated summaries or null if nothing to process.
 */
export async function processQueue(
  userId: string,
  conversationId: string,
  plan: 'free' | 'pro' = 'free'
): Promise<{
  userSummary?: string;
  conversationSummary?: string;
} | null> {
  const key = getQueueKey(userId, conversationId);
  const entry = summaryQueue.get(key);
  if (!entry || entry.pendingMessages.length === 0) return null;

  const messages = [...entry.pendingMessages];
  entry.pendingMessages = [];
  entry.lastProcessedAt = Date.now();

  const apiKey = process.env.GROQ_API_KEY_4;
  if (!apiKey) {
    console.warn('GROQ_API_KEY_4 not set, skipping summary generation');
    return null;
  }

  const transcript = messages
    .map(m => `${m.role.toUpperCase()}: ${m.content.slice(0, 300)}`)
    .join('\n');

  const supabase = await createServerSupabaseClient();

  try {
    if (plan === 'free') {
      // Free plan: only user-level summary (cross-chat)
      const existingSummary = await getExistingUserSummary(supabase, userId);
      const userSummary = await generateUserSummary(apiKey, transcript, existingSummary, FREE_MAX_CHARS);
      if (userSummary) {
        await storeUserSummary(supabase, userId, userSummary);
      }
      return { userSummary: userSummary || undefined };
    } else {
      // Pro plan: user-level + conversation-level summaries
      const existingUserSummary = await getExistingProUserSummary(supabase, userId);
      const existingConvSummary = await getExistingProConvSummary(supabase, conversationId);

      // Generate both in one call
      const result = await generateProSummaries(
        apiKey,
        transcript,
        existingUserSummary,
        existingConvSummary,
        PRO_USER_MAX_CHARS,
        PRO_CONV_MAX_CHARS
      );

      if (result.userSummary) {
        await storeProUserSummary(supabase, userId, result.userSummary);
      }
      if (result.conversationSummary) {
        await storeProConvSummary(supabase, conversationId, userId, result.conversationSummary);
      }

      return result;
    }
  } catch (error) {
    console.error('Summary processing failed:', error);
    return null;
  }
}

// ── Free plan: User summary generation ─────────────────────
async function getExistingUserSummary(supabase: any, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('user_summaries')
    .select('summary')
    .eq('user_id', userId)
    .maybeSingle();
  return data?.summary || null;
}

async function storeUserSummary(supabase: any, userId: string, summary: string): Promise<void> {
  await supabase
    .from('user_summaries')
    .upsert({ user_id: userId, summary, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
}

async function generateUserSummary(
  apiKey: string,
  transcript: string,
  existingSummary: string | null,
  maxChars: number
): Promise<string | null> {
  const existingNote = existingSummary
    ? `\nExisting summary to update (not replace): ${existingSummary}`
    : '';

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `You are a user profile summarizer. Create a concise cross-chat summary of what this user cares about, works on, and prefers. Write in natural language like: "User is working on... They prefer... They frequently discuss..." Max ${maxChars} chars including spaces. Update the existing summary — keep valuable old info, add new insights, remove outdated details.`,
        },
        {
          role: 'user',
          content: `Recent messages:\n${transcript}${existingNote}\n\nGenerate updated user summary (max ${maxChars} chars):`,
        },
      ],
      temperature: 0.3,
      max_tokens: Math.ceil(maxChars / 3),
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || null;
}

// ── Pro plan: Dual summary generation ──────────────────────
async function getExistingProUserSummary(supabase: any, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('pro_user_summaries')
    .select('summary')
    .eq('user_id', userId)
    .maybeSingle();
  return data?.summary || null;
}

async function getExistingProConvSummary(supabase: any, conversationId: string): Promise<string | null> {
  const { data } = await supabase
    .from('pro_conversation_summaries')
    .select('summary')
    .eq('conversation_id', conversationId)
    .maybeSingle();
  return data?.summary || null;
}

async function storeProUserSummary(supabase: any, userId: string, summary: string): Promise<void> {
  await supabase
    .from('pro_user_summaries')
    .upsert({ user_id: userId, summary, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
}

async function storeProConvSummary(supabase: any, conversationId: string, userId: string, summary: string): Promise<void> {
  await supabase
    .from('pro_conversation_summaries')
    .upsert(
      { conversation_id: conversationId, user_id: userId, summary, updated_at: new Date().toISOString() },
      { onConflict: 'conversation_id' }
    );
}

async function generateProSummaries(
  apiKey: string,
  transcript: string,
  existingUserSummary: string | null,
  existingConvSummary: string | null,
  userMaxChars: number,
  convMaxChars: number
): Promise<{ userSummary?: string; conversationSummary?: string }> {
  const existingUserNote = existingUserSummary
    ? `\nExisting user summary: ${existingUserSummary}`
    : '';
  const existingConvNote = existingConvSummary
    ? `\nExisting conversation summary: ${existingConvSummary}`
    : '';

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a dual-summary generator. Create TWO summaries from the conversation transcript:

1. USER SUMMARY (max ${userMaxChars} chars): Cross-chat profile. Professional context, projects, technical preferences, communication style. Natural language.

2. CONVERSATION SUMMARY (max ${convMaxChars} chars): This specific chat. Key topics, decisions, code discussed, open questions. Structured but concise.

Return as JSON:
{
  "userSummary": "...",
  "conversationSummary": "..."
}`,
        },
        {
          role: 'user',
          content: `Transcript:\n${transcript}${existingUserNote}${existingConvNote}\n\nGenerate both summaries as JSON:`,
        },
      ],
      temperature: 0.3,
      max_tokens: Math.ceil((userMaxChars + convMaxChars) / 2),
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) return {};
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) return {};

  try {
    const parsed = JSON.parse(content);
    return {
      userSummary: parsed.userSummary,
      conversationSummary: parsed.conversationSummary,
    };
  } catch {
    return {};
  }
}

// ── Dynamic window sizing ───────────────────────────────────
export type QueryComplexity = 'trivial' | 'followup' | 'normal' | 'complex';

/**
 * Determine how many recent messages to include based on query complexity.
 * GPT-style dynamic window sizing.
 */
export function getDynamicWindowSize(
  queryComplexity: QueryComplexity,
  plan: 'free' | 'pro' = 'free'
): number {
  const windows = {
    free: {
      trivial: 2,
      followup: 5,
      normal: 8,
      complex: 12,
    },
    pro: {
      trivial: 3,
      followup: 8,
      normal: 15,
      complex: 30,
    },
  };

  return windows[plan][queryComplexity];
}

/**
 * Detect query complexity from message content.
 */
export function detectQueryComplexity(
  message: string,
  historyLength: number
): QueryComplexity {
  const lower = message.toLowerCase();
  const wordCount = message.split(/\s+/).length;

  // Trivial: greetings, single words, very short
  if (wordCount <= 3 || /^(hi+|hello+|hey+|sup|yo|ok|yes|no|thanks?|bye)\b/i.test(lower)) {
    return 'trivial';
  }

  // Followup: references previous context
  if (/\b(it|that|this|those|these|they|he|she|the (above|previous|same|last)|you mentioned|as (you |)said|earlier)\b/i.test(lower) && historyLength > 2) {
    return 'followup';
  }

  // Complex: long, multi-part, technical
  if (
    wordCount > 80 ||
    (message.match(/\?/g) || []).length >= 3 ||
    /```/.test(message) ||
    /\b(implement|architecture|design (a|the)|refactor|debug|optimize|analyze|complex|comprehensive)\b/i.test(lower)
  ) {
    return 'complex';
  }

  return 'normal';
}

/**
 * Check if the user has switched topics (for window reset).
 */
export function detectTopicSwitch(
  currentMessage: string,
  previousMessages: Array<{ role: string; content: string }>,
  threshold: number = 0.3
): boolean {
  if (previousMessages.length === 0) return false;

  // Simple keyword-based topic detection
  const currentWords = new Set(currentMessage.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const recentWords = new Set(
    previousMessages.slice(-3).flatMap(m => m.content.toLowerCase().split(/\s+/).filter(w => w.length > 3))
  );

  if (currentWords.size === 0 || recentWords.size === 0) return false;

  const intersection = [...currentWords].filter(w => recentWords.has(w)).length;
  const similarity = intersection / Math.max(currentWords.size, 1);

  return similarity < threshold;
}
