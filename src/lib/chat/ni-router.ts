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
            content: `You are an expert task classifier for an AI model router. Analyze the user's request and classify it precisely.

DECISION RULES:
1. "type" is the broad legacy bucket: coding | reasoning | architecture | debugging | refactoring | image_analysis
   - coding: writing, modifying, or reviewing code
   - reasoning: logical/analytical thinking, math, explanations, comparisons, planning
   - architecture: system design, tech stack decisions, infrastructure planning
   - debugging: finding/fixing errors, tracing bugs, stack traces
   - refactoring: restructuring existing code without changing behavior
   - image_analysis: analyzing/extracting info from attached images
2. "complexity" reflects effort needed: easy | medium | hard | very_hard
   - easy: single-function, <50 lines, straightforward
   - medium: multi-function or moderate logic, 50-200 lines
   - hard: multi-file, architectural decisions, 200-500 lines
   - very_hard: system-wide, security-critical, novel algorithms, 500+ lines
3. "primaryCategory" is the fine-grained domain: coding | reasoning | creative | analysis | operations
4. "primarySubType" is the most specific task type from the allowed list
5. "secondarySubTypes" are up to 3 additional relevant sub-types
6. "confidence" is how certain you are (0.0-1.0). Use 0.9+ for clear-cut cases, 0.5-0.7 for ambiguous ones.

COMPLEXITY SIGNALS TO CONSIDER:
- Message length and detail level
- Number of distinct requirements
- Whether multiple files/systems are involved
- Whether architectural decisions are needed
- Whether security/safety is at stake
- Whether novel algorithms or math are required
- Code block size and count in the message

Return ONLY valid JSON, no markdown:
{
  "type": "coding|reasoning|architecture|debugging|refactoring|image_analysis",
  "complexity": "easy|medium|hard|very_hard",
  "confidence": 0.0,
  "primaryCategory": "coding|reasoning|creative|analysis|operations",
  "primarySubType": "feature-implementation|bug-fix|code-review|optimization|testing|api-integration|database-operations|documentation|refactoring|algorithm-design|problem-solving|explanation|comparison|planning|content-generation|design|brainstorming|storytelling|data-analysis|log-analysis|performance-analysis|security-audit|deployment|configuration|debugging|monitoring|troubleshooting",
  "secondarySubTypes": ["up to 3 sub-types from the same list"]
}`,
          },
          {
            role: 'user',
            content: `Message: "${message}"${
              context?.conversationHistoryLength
                ? `\nConversation history: ${context.conversationHistoryLength} messages`
                : ''
            }${context?.hasAttachedImages ? '\nImages attached: yes' : ''}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 200,
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

    const parsed = JSON.parse(content);

    // Validate and clamp the AI response to prevent bad data from propagating
    const validTypes: TaskType[] = ['coding', 'reasoning', 'architecture', 'debugging', 'refactoring', 'image_analysis'];
    const validComplexities: TaskComplexity[] = ['easy', 'medium', 'hard', 'very_hard'];
    const validCategories: PrimaryCategory[] = ['coding', 'reasoning', 'creative', 'analysis', 'operations'];
    const validSubTypes: SubType[] = [
      'feature-implementation', 'bug-fix', 'code-review', 'optimization', 'testing',
      'api-integration', 'database-operations', 'documentation', 'refactoring',
      'algorithm-design', 'problem-solving', 'explanation', 'comparison', 'planning',
      'content-generation', 'design', 'brainstorming', 'storytelling',
      'data-analysis', 'log-analysis', 'performance-analysis', 'security-audit',
      'deployment', 'configuration', 'debugging', 'monitoring', 'troubleshooting',
    ];

    return {
      type: validTypes.includes(parsed.type) ? parsed.type : 'coding',
      complexity: validComplexities.includes(parsed.complexity) ? parsed.complexity : 'medium',
      confidence: typeof parsed.confidence === 'number' ? Math.min(1, Math.max(0, parsed.confidence)) : 0.5,
      primaryCategory: validCategories.includes(parsed.primaryCategory) ? parsed.primaryCategory : undefined,
      primarySubType: validSubTypes.includes(parsed.primarySubType) ? parsed.primarySubType : undefined,
      secondarySubTypes: Array.isArray(parsed.secondarySubTypes)
        ? parsed.secondarySubTypes.filter((st: string) => validSubTypes.includes(st as SubType)).slice(0, 3) as SubType[]
        : undefined,
    };
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

  // 3.2 Code blocks present + size
  const codeBlocks = message.match(/```[\s\S]*?```/g) || [];
  const codeBlockCount = codeBlocks.length;
  score += Math.min(codeBlockCount * 12, 30);
  // Large code blocks add more complexity
  const totalCodeChars = codeBlocks.reduce((sum, b) => sum + b.length, 0);
  if (totalCodeChars > 2000) score += 15;
  else if (totalCodeChars > 500) score += 8;

  // 3.3 Technical keyword density
  const techKeywords = [
    'async', 'await', 'function', 'class', 'interface', 'database', 'api',
    'server', 'client', 'endpoint', 'sql', 'query', 'migration', 'deploy',
    'config', 'environment', 'production', 'staging', 'rollback',
    'kubernetes', 'docker', 'redis', 'queue', 'webhook', 'oauth', 'jwt',
    'grpc', 'websocket', 'microservice', 'distributed', 'concurrency',
  ];
  const techCount = techKeywords.filter(kw => lower.includes(kw)).length;
  if (techCount > 10) score += 25;
  else if (techCount > 6) score += 18;
  else if (techCount > 3) score += 10;

  // 3.4 Risk / operational complexity indicators
  const riskWords = ['production', 'critical', 'urgent', 'security', 'crash', 'data loss', 'sensitive', 'vulnerability', 'breach', 'compliance', 'gdpr', 'pci'];
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

  // 3.8 Math / algorithm complexity
  const mathSignals = (message.match(/\b(algorithm|complexity|big o|recursive|dynamic programming|graph|tree|sort|search|hash|traverse|dp|memoiz)\b/gi) || []).length;
  if (mathSignals > 2) score += 15;
  else if (mathSignals > 0) score += 8;

  // 3.9 Multi-language / polyglot context
  const langSignals = (message.match(/\b(python|javascript|typescript|rust|go|java|c\+\+|ruby|swift|kotlin|scala|elixir|haskell)\b/gi) || []).length;
  if (langSignals > 2) score += 12; // Multiple languages mentioned = harder

  // 3.10 Architecture / system design signals
  const archSignals = (message.match(/\b(architecture|design pattern|microservice|monolith|scalability|distributed|system design|infrastructure|load balancer|sharding|replication|consensus)\b/gi) || []).length;
  if (archSignals > 1) score += 15;
  else if (archSignals > 0) score += 8;

  // 3.11 Question marks (multiple questions = more complex)
  const questionCount = (message.match(/\?/g) || []).length;
  if (questionCount > 3) score += 8;
  else if (questionCount > 1) score += 4;

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
    creative: 'reasoning',       // creative tasks use reasoning-capable models
    analysis: 'reasoning',       // FIX: analysis is reasoning, NOT image_analysis
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
  // Higher confidence when multiple patterns agree and top match has high weight
  const topWeight = matched[0]?.weight ?? 0;
  const matchCount = matched.length;
  let confidence = 0.35; // base
  confidence += Math.min(topWeight * 0.08, 0.25);  // up to +0.24 for weight-3 matches
  confidence += Math.min(matchCount * 0.05, 0.15); // up to +0.15 for multiple matches
  // Strong signal: high-weight match + multiple corroborating patterns
  if (topWeight >= 3 && matchCount >= 2) confidence += 0.1;
  confidence = Math.min(0.75, confidence); // cap below AI's potential max of 1.0

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

  // ── Confidence-weighted blending ──
  // Instead of a hard threshold, we pick the classifier with higher confidence.
  // When both agree, we trust AI more (it understands nuance). When they disagree,
  // the higher-confidence one wins. If AI fails entirely, fallback is used.
  let selected: typeof fallback;
  let blendedConfidence: number;

  if (!ai) {
    // AI classifier failed — use fallback
    selected = fallback;
    blendedConfidence = fallback.confidence;
  } else if (ai.confidence >= fallback.confidence) {
    // AI is more confident (or equal) — prefer AI for nuance
    selected = ai;
    blendedConfidence = ai.confidence;
    // Boost confidence if both classifiers agree on type and complexity
    if (ai.type === fallback.type && ai.complexity === fallback.complexity) {
      blendedConfidence = Math.min(1, blendedConfidence + 0.1);
    }
  } else {
    // Fallback is more confident (rare — AI returned low confidence)
    selected = fallback;
    blendedConfidence = fallback.confidence;
  }

  // ── Image override: if images are attached, force image_analysis type ──
  const hasImages = context?.hasAttachedImages || false;
  if (hasImages) {
    selected = {
      ...selected,
      type: 'image_analysis',
      primaryCategory: 'analysis',
    };
  }

  // ── Context-aware complexity boost ──
  // Long conversations and large code inputs increase effective complexity
  let effectiveComplexity = selected.complexity;
  const historyLen = context?.conversationHistoryLength ?? 0;
  const codeLen = context?.codeLength ?? 0;
  if (historyLen > 20 && effectiveComplexity === 'easy') effectiveComplexity = 'medium';
  if (historyLen > 50 && effectiveComplexity === 'medium') effectiveComplexity = 'hard';
  if (codeLen > 500 && effectiveComplexity === 'easy') effectiveComplexity = 'medium';
  if (codeLen > 2000 && effectiveComplexity !== 'very_hard') {
    effectiveComplexity = codeLen > 5000 ? 'very_hard' : 'hard';
  }

  return {
    type: selected.type,
    complexity: effectiveComplexity,
    estimatedLines: context?.codeLength ?? 50,
    estimatedFiles: context?.fileCount ?? 1,
    requiresReasoning: selected.type === 'reasoning' || selected.type === 'architecture',
    requiresArchitecture: selected.type === 'architecture',
    isDebugging: selected.type === 'debugging',
    isRefactoring: selected.type === 'refactoring',
    hasImages,
    imageCount: context?.imageCount || 0,
    confidence: blendedConfidence,
    // Advanced analysis fields — prefer AI's, fall back to regex's
    primaryCategory: selected.primaryCategory || fallback.primaryCategory,
    primarySubType: selected.primarySubType || fallback.primarySubType,
    secondarySubTypes: selected.secondarySubTypes || fallback.secondarySubTypes,
  };
}

// ── Estimate tokens needed for a task ───────────────────
export function estimateTokensNeeded(analysis: TaskAnalysis): number {
  const { complexity, estimatedLines, estimatedFiles, primarySubType, primaryCategory } = analysis;

  // Base token estimation — varies by category
  let tokens = 500;
  if (primaryCategory === 'creative') tokens = 700;       // creative needs more output room
  else if (primaryCategory === 'reasoning') tokens = 600; // reasoning needs thinking space
  else if (primaryCategory === 'analysis') tokens = 800;  // analysis needs structured output
  else if (primaryCategory === 'operations') tokens = 550;

  // Sub-type-specific base adjustments
  const subTypeBoosts: Partial<Record<SubType, number>> = {
    'algorithm-design': 400,
    'security-audit': 500,
    'data-analysis': 300,
    'content-generation': 300,
    'storytelling': 400,
    'planning': 250,
    'documentation': 200,
  };
  if (primarySubType && subTypeBoosts[primarySubType]) {
    tokens += subTypeBoosts[primarySubType]!;
  }

  // Add tokens based on estimated lines
  if (estimatedLines) {
    tokens += estimatedLines * 2; // ~2 tokens per line of code
  }

  // Add tokens based on file count
  if (estimatedFiles && estimatedFiles > 1) {
    tokens += estimatedFiles * 100; // Context overhead for multiple files
  }

  // Add tokens for images
  if (analysis.hasImages && analysis.imageCount) {
    tokens += analysis.imageCount * 250; // ~250 tokens per image
  }

  // Add complexity multiplier
  if (complexity === 'very_hard') tokens *= 2.2;
  else if (complexity === 'hard') tokens *= 1.6;
  else if (complexity === 'medium') tokens *= 1.25;

  return Math.ceil(tokens);
}

// ── Task routing (no token limits — pure complexity-based) ──
export function routeTask(analysis: TaskAnalysis): ModelRoute {
  const { type, complexity, primarySubType, primaryCategory } = analysis;

  // ── Image analysis: always Gemini ──
  if (type === 'image_analysis')
    return {
      model: 'gemini-flash-lite',
      provider: 'google',
      reason: 'Image analysis — Gemini Flash Lite for multimodal input',
      fallback: { model: 'gpt-5', provider: 'openai', reason: 'Fallback: GPT-5 for image reasoning' },
    };

  // ── Security audits: always Opus (highest accuracy) ──
  if (primarySubType === 'security-audit' && complexity !== 'easy') {
    return {
      model: 'claude-opus-4.6',
      provider: 'anthropic',
      reason: 'Security audit — Claude Opus 4.6 for maximum accuracy and thoroughness',
      fallback: { model: 'gpt-5', provider: 'openai', reason: 'Fallback: GPT-5 for security reasoning' },
    };
  }

  // ── Architecture / system design: GPT-5 with Opus fallback ──
  if (analysis.requiresArchitecture || primarySubType === 'planning') {
    return {
      model: 'gpt-5',
      provider: 'openai',
      reason: 'Architecture/planning — GPT-5 for system design reasoning',
      fallback: { model: 'claude-opus-4.6', provider: 'anthropic', reason: 'Fallback: Opus 4.6 for deep architecture' },
    };
  }

  // ── Algorithm design: GPT-5 (strong at math/algorithms) ──
  if (primarySubType === 'algorithm-design') {
    return {
      model: 'gpt-5',
      provider: 'openai',
      reason: 'Algorithm design — GPT-5 for mathematical reasoning',
      fallback: { model: 'claude-opus-4.6', provider: 'anthropic', reason: 'Fallback: Opus 4.6 for algorithm verification' },
    };
  }

  // ── Creative tasks: GPT-5 (best at nuanced creative writing) ──
  if (primaryCategory === 'creative') {
    return {
      model: 'gpt-5',
      provider: 'openai',
      reason: 'Creative task — GPT-5 for nuanced creative generation',
      fallback: { model: 'claude-sonnet-4.6', provider: 'anthropic', reason: 'Fallback: Sonnet 4.6 for creative writing' },
    };
  }

  // ── Data/log/performance analysis: GPT-5 with Sonnet fallback ──
  if (primaryCategory === 'analysis' && complexity !== 'easy') {
    return {
      model: 'gpt-5',
      provider: 'openai',
      reason: 'Data analysis — GPT-5 for analytical reasoning and pattern detection',
      fallback: { model: 'claude-sonnet-4.6', provider: 'anthropic', reason: 'Fallback: Sonnet 4.6 for structured analysis' },
    };
  }

  // ── Reasoning/explanation/comparison: GPT-5 ──
  if (primaryCategory === 'reasoning' || analysis.requiresReasoning) {
    if (complexity === 'very_hard') {
      return {
        model: 'gpt-5',
        provider: 'openai',
        reason: 'Very hard reasoning — GPT-5 for deep logical analysis',
        fallback: { model: 'claude-opus-4.6', provider: 'anthropic', reason: 'Fallback: Opus 4.6 for complex reasoning' },
      };
    }
    if (complexity === 'hard') {
      return {
        model: 'gpt-5',
        provider: 'openai',
        reason: 'Hard reasoning — GPT-5 for advanced reasoning',
        fallback: { model: 'claude-sonnet-4.6', provider: 'anthropic', reason: 'Fallback: Sonnet 4.6 for reasoning' },
      };
    }
    // Easy/medium reasoning — DeepSeek Pro is cost-effective
    return {
      model: 'deepseek-v4-pro',
      provider: 'deepseek',
      reason: 'Medium reasoning — DeepSeek V4 Pro (cost-effective for reasoning)',
      fallback: { model: 'gpt-5', provider: 'openai', reason: 'Fallback: GPT-5 for reasoning' },
    };
  }

  // ── Coding tasks: route by complexity and sub-type ──
  if (primaryCategory === 'coding' || type === 'coding' || type === 'debugging' || type === 'refactoring') {
    // Very hard coding (debugging/refactoring multi-file) → Opus
    if (complexity === 'very_hard') {
      return {
        model: 'claude-opus-4.6',
        provider: 'anthropic',
        reason: 'Very hard coding — Claude Opus 4.6 for complex debugging/refactoring',
        fallback: { model: 'gpt-5', provider: 'openai', reason: 'Fallback: GPT-5 for complex code' },
      };
    }
    // Hard coding → Sonnet (great at code, faster than Opus)
    if (complexity === 'hard') {
      // Code review specifically → Opus (better at catching subtle issues)
      if (primarySubType === 'code-review') {
        return {
          model: 'claude-opus-4.6',
          provider: 'anthropic',
          reason: 'Hard code review — Opus 4.6 for catching subtle issues',
          fallback: { model: 'claude-sonnet-4.6', provider: 'anthropic', reason: 'Fallback: Sonnet 4.6' },
        };
      }
      return {
        model: 'claude-sonnet-4.6',
        provider: 'anthropic',
        reason: 'Hard coding — Claude Sonnet 4.6 for complex implementation',
        fallback: { model: 'deepseek-v4-pro', provider: 'deepseek', reason: 'Fallback: DeepSeek V4 Pro' },
      };
    }
    // Medium coding → DeepSeek Pro (excellent at code, cost-effective)
    if (complexity === 'medium' || (analysis.estimatedLines && analysis.estimatedLines > 100)) {
      return {
        model: 'deepseek-v4-pro',
        provider: 'deepseek',
        reason: 'Medium coding — DeepSeek V4 Pro (strong code, cost-effective)',
        fallback: { model: 'claude-sonnet-4.6', provider: 'anthropic', reason: 'Fallback: Sonnet 4.6' },
      };
    }
    // Easy coding → DeepSeek Flash
    return {
      model: 'deepseek-v4-flash',
      provider: 'deepseek',
      reason: 'Easy coding — DeepSeek V4 Flash (fast, cost-effective)',
      fallback: { model: 'deepseek-v4-pro', provider: 'deepseek', reason: 'Fallback: DeepSeek V4 Pro' },
    };
  }

  // ── Operations tasks ──
  if (primaryCategory === 'operations') {
    if (complexity === 'very_hard' || complexity === 'hard') {
      return {
        model: 'claude-sonnet-4.6',
        provider: 'anthropic',
        reason: 'Hard operations — Sonnet 4.6 for careful step-by-step procedures',
        fallback: { model: 'gpt-5', provider: 'openai', reason: 'Fallback: GPT-5 for operations' },
      };
    }
    return {
      model: 'deepseek-v4-pro',
      provider: 'deepseek',
      reason: 'Medium operations — DeepSeek V4 Pro',
      fallback: { model: 'deepseek-v4-flash', provider: 'deepseek', reason: 'Fallback: DeepSeek V4 Flash' },
    };
  }

  // ── Default: easy task → DeepSeek Flash ──
  return {
    model: 'deepseek-v4-flash',
    provider: 'deepseek',
    reason: 'Easy task — DeepSeek V4 Flash (fast, cost-effective)',
    fallback: { model: 'deepseek-v4-pro', provider: 'deepseek', reason: 'Fallback: DeepSeek V4 Pro' },
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