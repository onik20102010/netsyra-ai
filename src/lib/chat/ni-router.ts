// NI Automatic Model Router
// Routes tasks to appropriate models based on complexity and type

export type TaskType =
  | 'coding' | 'reasoning' | 'architecture' | 'debugging' | 'refactoring'
  | 'image_generation' | 'image_analysis';

export type TaskComplexity = 'easy' | 'medium' | 'hard' | 'very_hard';

export type ModelRoute = {
  model: string;
  provider: string;
  reason: string;
  fallback?: ModelRoute;
  error?: string;
};

export interface TaskAnalysis {
  type: TaskType;
  complexity: TaskComplexity;
  estimatedLines?: number;
  estimatedFiles?: number;
  requiresReasoning: boolean;
  requiresArchitecture: boolean;
  isDebugging: boolean;
  isRefactoring: boolean;
  hasImages: boolean;
  imageCount?: number;
  confidence: number;
}

// ── AI‑based classifier (primary) ──────────────────────
async function classifyTaskWithAI(
  message: string,
  context?: { conversationHistoryLength?: number; hasAttachedImages?: boolean }
): Promise<{ type: TaskType; complexity: TaskComplexity; confidence: number } | null> {
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
  "type": "coding|reasoning|architecture|debugging|refactoring|image_generation|image_analysis",
  "complexity": "easy|medium|hard|very_hard",
  "confidence": 0.0–1.0
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
        max_tokens: 100,
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

// ── Lightweight fallback (regex) ───────────────────────
function detectTypeAndComplexityFallback(
  message: string
): { type: TaskType; complexity: TaskComplexity } {
  const lower = message.toLowerCase();
  const hasImageKeywords = /image|photo|picture|generate|draw|logo/i.test(lower);

  let type: TaskType = 'coding';
  if (hasImageKeywords && /analyze|describe|what's in|ocr/i.test(lower)) type = 'image_analysis';
  else if (hasImageKeywords) type = 'image_generation';
  else if (/error|bug|fix|not working|crash|debug/i.test(lower)) type = 'debugging';
  else if (/refactor|improve|clean up|optimize|restructure/i.test(lower)) type = 'refactoring';
  else if (/explain|why|how|math|solve|logic|algorithm/i.test(lower)) type = 'reasoning';
  else if (/architecture|design|plan|system/i.test(lower)) type = 'architecture';

  const wordCount = message.split(/\s+/).length;
  let complexity: TaskComplexity = 'easy';
  if (wordCount > 80) complexity = 'very_hard';
  else if (wordCount > 40) complexity = 'hard';
  else if (wordCount > 15) complexity = 'medium';

  return { type, complexity };
}

// ── Main analyze function ─────────────────────────────
export async function analyzeTask(
  message: string,
  context?: {
    codeLength?: number;
    fileCount?: number;
    hasAttachedImages?: boolean;
    imageCount?: number;
    conversationHistoryLength?: number;
  }
): Promise<TaskAnalysis> {
  const ai = await classifyTaskWithAI(message, {
    conversationHistoryLength: context?.conversationHistoryLength,
    hasAttachedImages: context?.hasAttachedImages,
  });

  const { type, complexity } =
    ai && ai.confidence > 0.6 ? ai : detectTypeAndComplexityFallback(message);

  return {
    type,
    complexity,
    estimatedLines: context?.codeLength ?? 50,
    estimatedFiles: context?.fileCount ?? 1,
    requiresReasoning: type === 'reasoning' || type === 'architecture',
    requiresArchitecture: type === 'architecture',
    isDebugging: type === 'debugging',
    isRefactoring: type === 'refactoring',
    hasImages: context?.hasAttachedImages || false,
    imageCount: context?.imageCount || 0,
    confidence: ai?.confidence ?? 0.5,
  };
}

// ── Credit enforcement ────────────────────────────────
export async function deductCredits(
  userId: string,
  creditsNeeded: number,
  supabase: any
): Promise<{ success: boolean; remainingCredits?: number; error?: string }> {
  try {
    const { data: creditsData, error: getError } = await supabase.rpc(
      'get_or_reset_claude_credits',
      { p_user_id: userId }
    );

    if (getError || !creditsData?.length) {
      return { success: false, error: 'Credit balance unavailable' };
    }

    const current = creditsData[0].credits_remaining;

    if (current < creditsNeeded) {
      return {
        success: false,
        remainingCredits: current,
        error: `Insufficient credits. Need ${creditsNeeded}, have ${current}.`,
      };
    }

    const { data: newBalance, error: deductError } = await supabase.rpc(
      'deduct_claude_credits',
      { p_user_id: userId, p_credits: creditsNeeded }
    );

    if (deductError || newBalance === -1) {
      return { success: false, error: 'Failed to deduct credits' };
    }

    return { success: true, remainingCredits: newBalance };
  } catch (error) {
    console.error('Credit deduction error:', error);
    return { success: false, error: 'Credit system error' };
  }
}

// ── Task routing ──────────────────────────────────────
export function routeTask(
  analysis: TaskAnalysis,
  claudeCreditsRemaining?: number
): ModelRoute {
  const { type, complexity } = analysis;

  if (type === 'image_generation')
    return { model: 'gpt-image-1', provider: 'openai', reason: 'Image generation' };
  if (type === 'image_analysis')
    return { model: 'gemini-flash-lite', provider: 'google', reason: 'Image analysis' };

  if (complexity === 'very_hard' && (analysis.isDebugging || analysis.isRefactoring)) {
    const needed = estimateClaudeCredits(analysis);
    if (claudeCreditsRemaining !== undefined && claudeCreditsRemaining < needed) {
      return {
        model: 'deepseek-v4-pro',
        provider: 'deepseek',
        reason: 'Claude credits exhausted – using DeepSeek V4 Pro',
        error: `Claude credits exhausted. Need ${needed}, have ${claudeCreditsRemaining}.`,
      };
    }
    return {
      model: 'claude-sonnet-4.6-coding',
      provider: 'anthropic',
      reason: 'Very hard coding task (debug/refactor)',
      fallback: { model: 'deepseek-v4-pro', provider: 'deepseek', reason: 'Fallback' },
    };
  }

  if (complexity === 'hard' || analysis.requiresReasoning || analysis.requiresArchitecture)
    return { model: 'gpt-5', provider: 'openai', reason: 'Hard reasoning/architecture' };

  if (complexity === 'medium')
    return { model: 'deepseek-v4-pro', provider: 'deepseek', reason: 'Medium complexity' };

  return { model: 'deepseek-v4-flash', provider: 'deepseek', reason: 'Easy task' };
}

// ── Credit estimation ─────────────────────────────────
export function estimateClaudeCredits(analysis: TaskAnalysis): number {
  const { complexity, estimatedLines, estimatedFiles, isDebugging, isRefactoring } = analysis;
  if (complexity === 'very_hard') {
    if ((estimatedFiles ?? 0) > 10) return 8;
    if (isDebugging) return 5;
    if (isRefactoring) return 8;
    return 4;
  }
  if (complexity === 'hard') {
    if ((estimatedLines ?? 0) > 400) return 4;
    if (isDebugging) return 5;
    return 2;
  }
  if (complexity === 'medium') return 2;
  return 1;
}

export function getRoutingExplanation(route: ModelRoute): string {
  return `${route.model} (${route.provider}) – ${route.reason}`;
}