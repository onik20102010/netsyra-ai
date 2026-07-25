// NI Automatic Model Router
// Routes tasks to appropriate models based on complexity and type

// ── Advanced type system ─────────────────────────────────
type PrimaryCategory = 'coding' | 'reasoning' | 'creative' | 'analysis' | 'operations';
type SubType =
  // coding
  | 'feature-implementation' | 'bug-fix' | 'code-review' | 'optimization' | 'testing'
  | 'api-integration' | 'database-operations' | 'documentation' | 'refactoring'
  // reasoning
  | 'algorithm-design' | 'problem-solving' | 'explanation' | 'comparison' | 'planning'
  // creative
  | 'content-generation' | 'design' | 'brainstorming' | 'storytelling'
  // analysis
  | 'data-analysis' | 'log-analysis' | 'performance-analysis' | 'security-audit'
  // operations
  | 'deployment' | 'configuration' | 'debugging' | 'monitoring' | 'troubleshooting';
type ComplexityLevel = 'trivial' | 'easy' | 'moderate' | 'complex' | 'very_complex' | 'expert';

// ── Legacy types (for backward compatibility) ─────────────
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
  noTokenLimit?: boolean; // Flag to skip token tracking for default fallback
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
  // Advanced analysis fields
  primaryCategory?: PrimaryCategory;
  primarySubType?: SubType;
  secondarySubTypes?: SubType[];
}

// ── AI‑based classifier (primary) ──────────────────────
async function classifyTaskWithAI(
  message: string,
  context?: { conversationHistoryLength?: number; hasAttachedImages?: boolean }
): Promise<{ 
  type: TaskType; 
  complexity: TaskComplexity; 
  confidence: number;
  primaryCategory?: PrimaryCategory;
  primarySubType?: SubType;
  secondarySubTypes?: SubType[];
} | null> {
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
  "confidence": 0.0–1.0,
  "primaryCategory": "coding|reasoning|creative|analysis|operations",
  "primarySubType": "feature-implementation|bug-fix|code-review|optimization|testing|api-integration|database-operations|documentation|refactoring|algorithm-design|problem-solving|explanation|comparison|planning|content-generation|design|brainstorming|storytelling|data-analysis|log-analysis|performance-analysis|security-audit|deployment|configuration|debugging|monitoring|troubleshooting",
  "secondarySubTypes": ["array of up to 3 additional sub-types from the same list"]
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

// ── Advanced fallback (regex) with multi-factor analysis ─────────
function detectTypeAndComplexityFallback(
  message: string
): { type: TaskType; complexity: TaskComplexity; primaryCategory?: PrimaryCategory; primarySubType?: SubType; secondarySubTypes?: SubType[]; confidence: number } {
  const lower = message.toLowerCase();
  const words = message.split(/\s+/);
  const wordCount = words.length;

  // ─── 1. Sub‑type detection ──────────────────────────────
  const patterns: Array<{ subType: SubType; regex: RegExp; weight: number }> = [
    // Coding
    { subType: 'bug-fix',               regex: /(bug|error|fix|not working|crash|debug)\b/i, weight: 3 },
    { subType: 'optimization',          regex: /(optimize|improve performance|speed up|reduce complexity)\b/i, weight: 2 },
    { subType: 'refactoring',           regex: /(refactor|restructure|clean up|rewrite)\b/i, weight: 2 },
    { subType: 'code-review',           regex: /(review|code review|pr feedback|check my code)\b/i, weight: 2 },
    { subType: 'testing',               regex: /(test|unit test|integration test|jest|cypress|pytest)\b/i, weight: 2 },
    { subType: 'api-integration',       regex: /(api|endpoint|rest|graphql|fetch|axios)\b/i, weight: 2 },
    { subType: 'database-operations',   regex: /(sql|database|migration|schema|query|supabase|postgres)\b/i, weight: 2 },
    { subType: 'documentation',         regex: /(document|readme|comment|jsdoc|explain code)\b/i, weight: 1 },
    { subType: 'feature-implementation',regex: /(implement|feature|add|create)\s+(?!bug|test)/i, weight: 2 },
    // Reasoning
    { subType: 'algorithm-design',      regex: /(algorithm|complexity|big o|design pattern)\b/i, weight: 3 },
    { subType: 'problem-solving',       regex: /(solve|puzzle|challenge|leetcode)\b/i, weight: 2 },
    { subType: 'explanation',           regex: /(explain|how does|what is|why does|describe)\b/i, weight: 2 },
    { subType: 'comparison',            regex: /(compare|difference|vs|versus|better|pros and cons)\b/i, weight: 2 },
    { subType: 'planning',              regex: /(plan|roadmap|steps|break down)\b/i, weight: 2 },
    // Creative
    { subType: 'content-generation',    regex: /(write|compose|story|article|blog post|poem|email|message)\b/i, weight: 2 },
    { subType: 'design',                regex: /(design|ui|ux|layout|mockup|color palette)\b/i, weight: 2 },
    { subType: 'brainstorming',         regex: /(brainstorm|ideas|suggest|improve)\b/i, weight: 2 },
    { subType: 'storytelling',          regex: /(story|narrative|character|plot)\b/i, weight: 2 },
    // Analysis
    { subType: 'data-analysis',         regex: /(analyze|data|statistics|trend|insight)\b/i, weight: 2 },
    { subType: 'log-analysis',          regex: /(log|trace|stack trace|error log)\b/i, weight: 2 },
    { subType: 'performance-analysis',  regex: /(performance|profiling|bottleneck|load time)\b/i, weight: 2 },
    { subType: 'security-audit',        regex: /(security|vulnerability|xss|csrf|sql injection|auth bypass)\b/i, weight: 3 },
    // Operations
    { subType: 'deployment',            regex: /(deploy|ship|release|ci|cd|pipeline)\b/i, weight: 2 },
    { subType: 'configuration',         regex: /(config|setup|install|environment variable)\b/i, weight: 2 },
    { subType: 'debugging',             regex: /(debug|breakpoint|step through|trace|isolate)\b/i, weight: 3 },
    { subType: 'monitoring',            regex: /(monitor|alert|dashboard|metrics|health check)\b/i, weight: 2 },
    { subType: 'troubleshooting',       regex: /(troubleshoot|issue|why isn't|help with|resolve)\b/i, weight: 2 },
  ];

  // Collect matches with weights (multi‑label)
  const matched = patterns
    .filter(p => p.regex.test(message))
    .map(p => ({ subType: p.subType, weight: p.weight }));

  // If no sub-type matched, default to 'feature-implementation'
  if (matched.length === 0) {
    matched.push({ subType: 'feature-implementation', weight: 1 });
  }

  // Sort by weight descending to pick primary
  matched.sort((a, b) => b.weight - a.weight);
  const primarySubType = matched[0].subType;
  const secondarySubTypes = matched.slice(1, 4).map(m => m.subType);

  // ─── 2. Determine primary category from sub‑type ──────────
  const categoryMap: Record<SubType, PrimaryCategory> = {
    'feature-implementation': 'coding',
    'bug-fix': 'coding',
    'code-review': 'coding',
    'optimization': 'coding',
    'testing': 'coding',
    'api-integration': 'coding',
    'database-operations': 'coding',
    'documentation': 'coding',
    'refactoring': 'coding',
    'algorithm-design': 'reasoning',
    'problem-solving': 'reasoning',
    'explanation': 'reasoning',
    'comparison': 'reasoning',
    'planning': 'reasoning',
    'content-generation': 'creative',
    'design': 'creative',
    'brainstorming': 'creative',
    'storytelling': 'creative',
    'data-analysis': 'analysis',
    'log-analysis': 'analysis',
    'performance-analysis': 'analysis',
    'security-audit': 'analysis',
    'deployment': 'operations',
    'configuration': 'operations',
    'debugging': 'operations',
    'monitoring': 'operations',
    'troubleshooting': 'operations',
  };
  const primaryCategory = categoryMap[primarySubType];

  // ─── 3. Multi‑factor complexity scoring (0–100) ───────────
  let score = 0;

  // 3.1 Word count (lexical complexity)
  if (wordCount <= 10) score += 0;
  else if (wordCount <= 25) score += 10;
  else if (wordCount <= 50) score += 20;
  else if (wordCount <= 80) score += 30;
  else score += 40;

  // 3.2 Code blocks present?
  const codeBlockCount = (message.match(/```[\s\S]*?```/g) || []).length;
  score += Math.min(codeBlockCount * 15, 30);

  // 3.3 Technical keyword density
  const techKeywords = [
    'async', 'await', 'function', 'class', 'interface', 'database', 'api',
    'server', 'client', 'endpoint', 'sql', 'query', 'migration', 'deploy',
    'config', 'environment', 'production', 'staging', 'rollback'
  ];
  const techCount = techKeywords.filter(kw => lower.includes(kw)).length;
  if (techCount > 8) score += 20;
  else if (techCount > 4) score += 10;

  // 3.4 Risk / operational complexity indicators
  const riskWords = ['production', 'critical', 'urgent', 'security', 'crash', 'data loss', 'sensitive'];
  if (riskWords.some(rw => lower.includes(rw))) score += 15;

  // 3.5 Multiple files / modules mentioned
  const fileMentions = (message.match(/\b(file|files|module|modules|directory|directories|component)\b/gi) || []).length;
  if (fileMentions > 3) score += 15;
  else if (fileMentions > 1) score += 10;

  // 3.6 Dependency / integration complexity
  const integrationMentions = (message.match(/\b(import|require|package|dependency|library|framework)\b/gi) || []).length;
  if (integrationMentions > 2) score += 10;

  // 3.7 Multistep / sequential instructions
  if (/(\d\.\s|step\s|first\s|then\s|next\s|finally\s)/i.test(message)) score += 10;

  // Clamp to 0–100
  score = Math.min(100, Math.max(0, score));

  // Map score to complexity level (6 levels)
  let advancedComplexity: ComplexityLevel;
  if (score <= 15) advancedComplexity = 'trivial';
  else if (score <= 35) advancedComplexity = 'easy';
  else if (score <= 55) advancedComplexity = 'moderate';
  else if (score <= 75) advancedComplexity = 'complex';
  else if (score <= 90) advancedComplexity = 'very_complex';
  else advancedComplexity = 'expert';

  // ─── 4. Map to legacy types for backward compatibility ───────
  const typeMap: Record<PrimaryCategory, TaskType> = {
    coding: 'coding',
    reasoning: 'reasoning',
    creative: 'image_generation',
    analysis: 'image_analysis',
    operations: 'debugging',
  };

  const complexityMap: Record<ComplexityLevel, TaskComplexity> = {
    trivial: 'easy',
    easy: 'easy',
    moderate: 'medium',
    complex: 'hard',
    very_complex: 'very_hard',
    expert: 'very_hard',
  };

  // ─── 5. Confidence calculation based on pattern matches ───────
  const confidence = Math.min(0.6, matched.length * 0.15);

  return {
    type: typeMap[primaryCategory] || 'coding',
    complexity: complexityMap[advancedComplexity],
    primaryCategory,
    primarySubType,
    secondarySubTypes,
    confidence,
  };
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

  const fallback = detectTypeAndComplexityFallback(message);

  // Determine which classifier to use based on AI confidence
  const useAI = ai && ai.confidence > 0.6;
  const selected = useAI ? ai : fallback;

  return {
    type: selected.type,
    complexity: selected.complexity,
    estimatedLines: context?.codeLength ?? 50,
    estimatedFiles: context?.fileCount ?? 1,
    requiresReasoning: selected.type === 'reasoning' || selected.type === 'architecture',
    requiresArchitecture: selected.type === 'architecture',
    isDebugging: selected.type === 'debugging',
    isRefactoring: selected.type === 'refactoring',
    hasImages: context?.hasAttachedImages || false,
    imageCount: context?.imageCount || 0,
    confidence: selected.confidence,
    // Advanced analysis fields - use AI's if available, otherwise fallback's
    primaryCategory: selected.primaryCategory || fallback.primaryCategory,
    primarySubType: selected.primarySubType || fallback.primarySubType,
    secondarySubTypes: selected.secondarySubTypes || fallback.secondarySubTypes,
  };
}

// ── Token enforcement ─────────────────────────────────
export async function checkAndDeductTokens(
  userId: string,
  modelType: 'claude-opus-4.6' | 'claude-sonnet-4.6' | 'deepseek-v4-pro' | 'gpt-5' | 'gpt-5-mini',
  tokensNeeded: number,
  supabase: any
): Promise<{ success: boolean; remainingTokens?: number; error?: string }> {
  try {
    // Determine which function to use based on model type
    const isGPT5 = modelType === 'gpt-5' || modelType === 'gpt-5-mini';
    const rpcFunction = isGPT5 ? 'get_or_reset_gpt5_token_usage' : 'get_or_reset_ni_token_usage';
    
    // Get current token usage
    const { data: usageData, error: getError } = await supabase.rpc(
      rpcFunction,
      { p_user_id: userId, p_model_type: modelType }
    );

    if (getError || !usageData?.length) {
      return { success: false, error: 'Token balance unavailable' };
    }

    const remaining = usageData[0].remaining_tokens;

    if (remaining < tokensNeeded) {
      return {
        success: false,
        remainingTokens: remaining,
        error: `Insufficient ${modelType} tokens. Need ${tokensNeeded}, have ${remaining}.`,
      };
    }

    // Deduct tokens
    const deductFunction = isGPT5 ? 'deduct_gpt5_tokens' : 'deduct_ni_tokens';
    const { data: newBalance, error: deductError } = await supabase.rpc(
      deductFunction,
      { p_user_id: userId, p_model_type: modelType, p_tokens: tokensNeeded }
    );

    if (deductError || newBalance === -1) {
      return { success: false, error: 'Failed to deduct tokens' };
    }

    return { success: true, remainingTokens: newBalance };
  } catch (error) {
    console.error('Token deduction error:', error);
    return { success: false, error: 'Token system error' };
  }
}

// ── Check if all NI token limits are exhausted ─────────
export async function checkAllLimitsExhausted(
  userId: string,
  supabase: any
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc(
      'check_ni_limits_exhausted',
      { p_user_id: userId }
    );
    if (error) return false;
    return data;
  } catch (error) {
    console.error('Error checking limits:', error);
    return false;
  }
}

// ── Check if all GPT-5 token limits are exhausted ────────
export async function checkGPT5LimitsExhausted(
  userId: string,
  supabase: any
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc(
      'check_gpt5_limits_exhausted',
      { p_user_id: userId }
    );
    if (error) return false;
    return data;
  } catch (error) {
    console.error('Error checking GPT-5 limits:', error);
    return false;
  }
}

// ── Get remaining tokens for all models ─────────────────
export async function getTotalNiRemaining(
  userId: string,
  supabase: any
): Promise<{ opus: number; sonnet: number; deepseek: number; total: number }> {
  try {
    const { data, error } = await supabase.rpc(
      'get_total_ni_remaining',
      { p_user_id: userId }
    );
    if (error || !data?.length) return { opus: 0, sonnet: 0, deepseek: 0, total: 0 };
    return {
      opus: data[0].opus_remaining || 0,
      sonnet: data[0].sonnet_remaining || 0,
      deepseek: data[0].deepseek_remaining || 0,
      total: data[0].total_remaining || 0,
    };
  } catch (error) {
    console.error('Error getting remaining tokens:', error);
    return { opus: 0, sonnet: 0, deepseek: 0, total: 0 };
  }
}

// ── Get remaining tokens for all GPT-5 models ────────────
export async function getTotalGPT5Remaining(
  userId: string,
  supabase: any
): Promise<{ gpt5: number; mini: number; total: number }> {
  try {
    const { data, error } = await supabase.rpc(
      'get_total_gpt5_remaining',
      { p_user_id: userId }
    );
    if (error || !data?.length) return { gpt5: 0, mini: 0, total: 0 };
    return {
      gpt5: data[0].gpt5_remaining || 0,
      mini: data[0].mini_remaining || 0,
      total: data[0].total_remaining || 0,
    };
  } catch (error) {
    console.error('Error getting GPT-5 remaining tokens:', error);
    return { gpt5: 0, mini: 0, total: 0 };
  }
}

// ── Estimate tokens needed for a task ───────────────────
export function estimateTokensNeeded(analysis: TaskAnalysis): number {
  const { complexity, estimatedLines, estimatedFiles } = analysis;
  
  // Base token estimation
  let tokens = 500; // Base tokens for any request
  
  // Add tokens based on estimated lines
  if (estimatedLines) {
    tokens += estimatedLines * 2; // ~2 tokens per line of code
  }
  
  // Add tokens based on file count
  if (estimatedFiles && estimatedFiles > 1) {
    tokens += estimatedFiles * 100; // Context overhead for multiple files
  }
  
  // Add complexity multiplier
  if (complexity === 'very_hard') tokens *= 2;
  else if (complexity === 'hard') tokens *= 1.5;
  else if (complexity === 'medium') tokens *= 1.2;
  
  return Math.ceil(tokens);
}

// ── Task routing with token-based fallback ────────────────
export function routeTask(
  analysis: TaskAnalysis,
  tokenLimits?: {
    opusRemaining?: number;
    sonnetRemaining?: number;
    deepseekRemaining?: number;
    gpt5Remaining?: number;
    gpt5MiniRemaining?: number;
  }
): ModelRoute {
  const { type, complexity, primarySubType, primaryCategory } = analysis;
  const tokensNeeded = estimateTokensNeeded(analysis);

  if (type === 'image_generation')
    return { model: 'gpt-image-1', provider: 'openai', reason: 'Image generation' };
  if (type === 'image_analysis')
    return { model: 'gemini-flash-lite', provider: 'google', reason: 'Image analysis' };

  // Reasoning, planning, creative, teaching tasks - use GPT-5
  if (primaryCategory === 'reasoning' || primaryCategory === 'creative' || 
      analysis.requiresReasoning || analysis.requiresArchitecture) {
    // Try GPT-5 first
    if (tokenLimits?.gpt5Remaining !== undefined && tokenLimits.gpt5Remaining >= tokensNeeded) {
      return {
        model: 'gpt-5',
        provider: 'openai',
        reason: 'Reasoning/creative task - using GPT-5 for advanced capabilities',
        fallback: {
          model: 'gpt-5-mini',
          provider: 'openai',
          reason: 'Fallback to GPT-5-mini if GPT-5 exhausted',
        },
      };
    }

    // Fallback to GPT-5-mini
    if (tokenLimits?.gpt5MiniRemaining !== undefined && tokenLimits.gpt5MiniRemaining >= tokensNeeded) {
      return {
        model: 'gpt-5-mini',
        provider: 'openai',
        reason: 'GPT-5 exhausted, using GPT-5-mini',
      };
    }

    // All GPT-5 limits exhausted, return error
    return {
      model: 'gpt-5-mini',
      provider: 'openai',
      reason: 'GPT-5 token limits exhausted',
      error: 'Your daily GPT-5 token limits have been exhausted. Please wait 24 hours for reset.',
    };
  }

  // Security-audit tasks always get highest priority (use Opus)
  if (primarySubType === 'security-audit' && complexity !== 'easy') {
    if (tokenLimits?.opusRemaining !== undefined && tokenLimits.opusRemaining >= tokensNeeded) {
      return {
        model: 'claude-opus-4.6',
        provider: 'anthropic',
        reason: 'Security audit - using Claude Opus 4.6 for maximum accuracy',
        fallback: {
          model: 'claude-sonnet-4.6',
          provider: 'anthropic',
          reason: 'Fallback to Claude Sonnet 4.6',
          fallback: {
            model: 'deepseek-v4-pro',
            provider: 'deepseek',
            reason: 'Final fallback to DeepSeek V4 Pro',
          },
        },
      };
    }
  }

  // Deployment and operations tasks prioritize Sonnet for reliability
  if (primaryCategory === 'operations' && complexity !== 'easy') {
    if (tokenLimits?.sonnetRemaining !== undefined && tokenLimits.sonnetRemaining >= tokensNeeded) {
      return {
        model: 'claude-sonnet-4.6',
        provider: 'anthropic',
        reason: 'Operations task - using Claude Sonnet 4.6 for reliability',
        fallback: {
          model: 'deepseek-v4-pro',
          provider: 'deepseek',
          reason: 'Fallback to DeepSeek V4 Pro',
        },
      };
    }
  }

  // Very hard coding tasks - prioritize Opus 4.6, fallback to Sonnet, then DeepSeek
  if (complexity === 'very_hard' && (analysis.isDebugging || analysis.isRefactoring)) {
    // Try Opus 4.6 first
    if (tokenLimits?.opusRemaining !== undefined && tokenLimits.opusRemaining >= tokensNeeded) {
      return {
        model: 'claude-opus-4.6',
        provider: 'anthropic',
        reason: 'Very hard coding task - using Claude Opus 4.6',
        fallback: {
          model: 'claude-sonnet-4.6',
          provider: 'anthropic',
          reason: 'Fallback to Claude Sonnet 4.6 if Opus exhausted',
          fallback: {
            model: 'deepseek-v4-pro',
            provider: 'deepseek',
            reason: 'Final fallback to DeepSeek V4 Pro',
          },
        },
      };
    }

    // Fallback to Sonnet 4.6
    if (tokenLimits?.sonnetRemaining !== undefined && tokenLimits.sonnetRemaining >= tokensNeeded) {
      return {
        model: 'claude-sonnet-4.6',
        provider: 'anthropic',
        reason: 'Opus exhausted, using Claude Sonnet 4.6',
        fallback: {
          model: 'deepseek-v4-pro',
          provider: 'deepseek',
          reason: 'Final fallback to DeepSeek V4 Pro',
        },
      };
    }

    // Final fallback to DeepSeek V4 Pro
    if (tokenLimits?.deepseekRemaining !== undefined && tokenLimits.deepseekRemaining >= tokensNeeded) {
      return {
        model: 'deepseek-v4-pro',
        provider: 'deepseek',
        reason: 'Opus and Sonnet exhausted, using DeepSeek V4 Pro',
      };
    }

    // All limits exhausted
    return {
      model: 'deepseek-v4-pro',
      provider: 'deepseek',
      reason: 'All NI token limits exhausted',
      error: 'Your daily NI token limits have been exhausted. Please wait 24 hours for reset.',
    };
  }

  // Hard tasks - use Sonnet 4.6, fallback to DeepSeek
  if (complexity === 'hard') {
    if (tokenLimits?.sonnetRemaining !== undefined && tokenLimits.sonnetRemaining >= tokensNeeded) {
      return {
        model: 'claude-sonnet-4.6',
        provider: 'anthropic',
        reason: 'Hard task - using Claude Sonnet 4.6',
        fallback: {
          model: 'deepseek-v4-pro',
          provider: 'deepseek',
          reason: 'Fallback to DeepSeek V4 Pro if Sonnet exhausted',
        },
      };
    }

    if (tokenLimits?.deepseekRemaining !== undefined && tokenLimits.deepseekRemaining >= tokensNeeded) {
      return {
        model: 'deepseek-v4-pro',
        provider: 'deepseek',
        reason: 'Sonnet exhausted, using DeepSeek V4 Pro',
      };
    }

    return {
      model: 'deepseek-v4-pro',
      provider: 'deepseek',
      reason: 'Token limits exhausted',
      error: 'Your daily NI token limits have been exhausted. Please wait 24 hours for reset.',
    };
  }

  // Medium tasks - use DeepSeek V4 Pro
  if (complexity === 'medium' || (analysis.estimatedLines && analysis.estimatedLines > 100)) {
    if (tokenLimits?.deepseekRemaining !== undefined && tokenLimits.deepseekRemaining >= tokensNeeded) {
      return {
        model: 'deepseek-v4-pro',
        provider: 'deepseek',
        reason: 'Medium complexity task - using DeepSeek V4 Pro',
      };
    }

    return {
      model: 'deepseek-v4-pro',
      provider: 'deepseek',
      reason: 'Token limits exhausted',
      error: 'Your daily NI token limits have been exhausted. Please wait 24 hours for reset.',
    };
  }

  // Easy tasks - use DeepSeek V4 Flash
  return {
    model: 'deepseek-v4-flash',
    provider: 'deepseek',
    reason: 'Easy task - using DeepSeek V4 Flash',
    noTokenLimit: true, // No token tracking for default fallback
  };
}

// ── Credit estimation (legacy, kept for compatibility) ──
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