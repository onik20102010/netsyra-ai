// Unified Classifier — merges deterministic Router + AI NI Router
// Runs deterministic signals first (free, sub-millisecond).
// Only invokes AI classifier when confidence < 0.7 OR for NI tier.
// Caches AI classification results for similar queries.

import { extractFeatures, routeModel, type RouteResult, type RoutableTier } from './router';
import type { TaskAnalysis, TaskType, TaskComplexity, ModelRoute } from './ni-router';

// ── In-memory cache for AI classifications ─────────────────
const classificationCache = new Map<string, { result: TaskAnalysis; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_SIZE = 500;

function getCachedClassification(normalized: string): TaskAnalysis | null {
  const entry = classificationCache.get(normalized);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    classificationCache.delete(normalized);
    return null;
  }
  return entry.result;
}

function setCachedClassification(normalized: string, result: TaskAnalysis): void {
  if (classificationCache.size >= MAX_CACHE_SIZE) {
    const firstKey = classificationCache.keys().next().value;
    if (firstKey) classificationCache.delete(firstKey);
  }
  classificationCache.set(normalized, { result, timestamp: Date.now() });
}

function normalizeForCache(message: string): string {
  return message.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 200);
}

// ── AI Classifier (lazy, only called when needed) ──────────
async function classifyWithAI(
  message: string,
  context?: { conversationHistoryLength?: number; hasAttachedImages?: boolean }
): Promise<TaskAnalysis | null> {
  const apiKey = process.env.GROQ_API_KEY_4;
  if (!apiKey) return null;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'groq/compound-mini',
        messages: [
          {
            role: 'system',
            content: `Classify the user's request. Return ONLY valid JSON:
{
  "type": "coding|reasoning|architecture|debugging|refactoring|image_analysis",
  "complexity": "easy|medium|hard|very_hard",
  "confidence": 0.0-1.0,
  "primaryCategory": "coding|reasoning|creative|analysis|operations",
  "primarySubType": "feature-implementation|bug-fix|code-review|optimization|testing|api-integration|database-operations|documentation|refactoring|algorithm-design|problem-solving|explanation|comparison|planning|content-generation|design|brainstorming|storytelling|data-analysis|log-analysis|performance-analysis|security-audit|deployment|configuration|debugging|monitoring|troubleshooting",
  "secondarySubTypes": ["array of up to 3 additional sub-types"]
}`,
          },
          {
            role: 'user',
            content: `Message: "${message}"${
              context?.conversationHistoryLength
                ? `\nHistory: ${context.conversationHistoryLength} messages`
                : ''
            }${context?.hasAttachedImages ? '\nImages attached' : ''}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 150,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    return JSON.parse(content);
  } catch (error) {
    console.error('AI classification failed:', error);
    return null;
  }
}

// ── Deterministic task analysis from router result ──────────
function deterministicToTaskAnalysis(route: RouteResult, message: string): TaskAnalysis {
  const f = route.features!;
  const tier = route.tier;

  let type: TaskType = 'coding';
  let complexity: TaskComplexity = 'easy';

  if (tier === 'code') {
    type = 'coding';
    complexity = f.wordCount > 80 ? 'hard' : f.wordCount > 40 ? 'medium' : 'easy';
  } else if (tier === 'aai') {
    type = 'architecture';
    complexity = 'very_hard';
  } else if (tier === 'pro') {
    type = 'reasoning';
    complexity = f.wordCount > 60 ? 'hard' : 'medium';
  } else if (tier === 'plus') {
    type = 'reasoning';
    complexity = 'medium';
  } else {
    type = 'coding';
    complexity = 'easy';
  }

  if (f.hasCodeFence || f.codeLangHits > 0) type = 'coding';
  if (f.wantsDepth) complexity = 'hard';

  return {
    type,
    complexity,
    estimatedLines: f.wordCount * 2,
    estimatedFiles: f.listItems > 3 ? 3 : 1,
    requiresReasoning: tier === 'pro' || tier === 'aai',
    requiresArchitecture: tier === 'aai',
    isDebugging: /bug|error|fix|debug/i.test(message),
    isRefactoring: /refactor|restructure|clean up/i.test(message),
    hasImages: false,
    confidence: route.confidence || 0.5,
  };
}

// ── Public API ─────────────────────────────────────────────

export interface UnifiedClassification {
  route: RouteResult;
  aiAnalysis: TaskAnalysis | null;
  final: TaskAnalysis;
  usedAI: boolean;
  fromCache: boolean;
}

/**
 * Unified classification: deterministic first, AI only when needed.
 * 1. Always run deterministic router (free, sub-millisecond)
 * 2. If deterministic confidence >= 0.8 → skip AI entirely
 * 3. If NI tier OR confidence < 0.7 → invoke AI classifier
 * 4. Cache AI results for 5 minutes
 * 5. If AI fails → fall back to deterministic
 */
export async function unifiedClassify(
  message: string,
  opts: {
    historyLength?: number;
    minTier?: RoutableTier;
    maxTier?: RoutableTier;
    forceAI?: boolean;
    hasAttachedImages?: boolean;
  } = {}
): Promise<UnifiedClassification> {
  const route = routeModel(message, {
    historyLength: opts.historyLength,
    minTier: opts.minTier,
    maxTier: opts.maxTier,
  });

  const confidence = route.confidence || 0.5;
  const needsAI = opts.forceAI || confidence < 0.7;

  if (!needsAI) {
    const final = deterministicToTaskAnalysis(route, message);
    return { route, aiAnalysis: null, final, usedAI: false, fromCache: false };
  }

  const cacheKey = normalizeForCache(message);
  const cached = getCachedClassification(cacheKey);
  if (cached) {
    return { route, aiAnalysis: cached, final: cached, usedAI: true, fromCache: true };
  }

  const aiResult = await classifyWithAI(message, {
    conversationHistoryLength: opts.historyLength,
    hasAttachedImages: opts.hasAttachedImages,
  });

  if (!aiResult) {
    const final = deterministicToTaskAnalysis(route, message);
    return { route, aiAnalysis: null, final, usedAI: false, fromCache: false };
  }

  setCachedClassification(cacheKey, aiResult);
  return { route, aiAnalysis: aiResult, final: aiResult, usedAI: true, fromCache: false };
}

/**
 * Quick classification — deterministic only, no AI, no cache.
 */
export function quickClassify(message: string): RouteResult {
  return routeModel(message);
}
