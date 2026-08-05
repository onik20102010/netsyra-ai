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
  | 'image_analysis';

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
  if (!apiKey) {
    console.warn(`❌ Missing API key: GROQ_API_KEY_4 for NI router classifier (groq/compound-mini)`);
    return null;
  }

  try {
    console.log(`🤖 Using model: groq/compound-mini (NI classifier) | API Key: GROQ_API_KEY_4 | Endpoint: api.groq.com`);
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

    if (!res.ok) {
      console.warn(`❌ LLM Error: groq/compound-mini (NI classifier) | API Key: GROQ_API_KEY_4 | Provider: groq | Error: ${res.status}`);
      return null;
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    console.log(`✅ LLM Response: groq/compound-mini (NI classifier) | API Key: GROQ_API_KEY_4 | Provider: groq | Content length: ${content.length} chars`);
    return JSON.parse(content);
  } catch (error) {
    console.warn(`❌ LLM Error: groq/compound-mini (NI classifier) | API Key: GROQ_API_KEY_4 | Provider: groq | Error: ${error}`);
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
    creative: 'reasoning',
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

// ── Task routing (no token limits — pure complexity-based) ──
export function routeTask(analysis: TaskAnalysis): ModelRoute {
  const { type, complexity, primarySubType, primaryCategory } = analysis;

  if (type === 'image_analysis')
    return { model: 'gemini-flash-lite', provider: 'google', reason: 'Image analysis' };

  // Reasoning, planning, creative, teaching tasks - use GPT-5
  if (primaryCategory === 'reasoning' || primaryCategory === 'creative' ||
      analysis.requiresReasoning || analysis.requiresArchitecture) {
    return {
      model: 'gpt-5',
      provider: 'openai',
      reason: 'Reasoning/creative task - using GPT-5 for advanced capabilities',
    };
  }

  // Security-audit tasks always get highest priority (use Opus)
  if (primarySubType === 'security-audit' && complexity !== 'easy') {
    return {
      model: 'claude-opus-4.6',
      provider: 'anthropic',
      reason: 'Security audit - using Claude Opus 4.6 for maximum accuracy',
    };
  }

  // Very hard coding tasks - use Opus 4.6
  if (complexity === 'very_hard' && (analysis.isDebugging || analysis.isRefactoring)) {
    return {
      model: 'claude-opus-4.6',
      provider: 'anthropic',
      reason: 'Very hard coding task - using Claude Opus 4.6',
    };
  }

  // Hard tasks - use Sonnet 4.6
  if (complexity === 'hard') {
    return {
      model: 'claude-sonnet-4.6',
      provider: 'anthropic',
      reason: 'Hard task - using Claude Sonnet 4.6',
    };
  }

  // Medium tasks - use DeepSeek V4 Pro
  if (complexity === 'medium' || (analysis.estimatedLines && analysis.estimatedLines > 100)) {
    return {
      model: 'deepseek-v4-pro',
      provider: 'deepseek',
      reason: 'Medium complexity task - using DeepSeek V4 Pro',
    };
  }

  // Easy tasks - use DeepSeek V4 Flash
  return {
    model: 'deepseek-v4-flash',
    provider: 'deepseek',
    reason: 'Easy task - using DeepSeek V4 Flash',
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