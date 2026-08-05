// Model selection fallback logic for Plus Pro plan
// Analyzes message complexity and selects appropriate model

export type ComplexityLevel = 'low' | 'medium' | 'high' | 'very_high';
export type RequestType = 'general' | 'coding' | 'debugging' | 'document_analysis';

export interface ModelSelectionResult {
  modelKey: string;
  reason: string;
  complexity: ComplexityLevel;
  requestType: RequestType;
}

/**
 * Analyzes the user message to determine complexity and request type
 */
export function analyzeMessageComplexity(message: string): {
  complexity: ComplexityLevel;
  requestType: RequestType;
} {
  const lowerMessage = message.toLowerCase();
  const messageLength = message.length;

  // Determine request type
  let requestType: RequestType = 'general';

  // Debugging indicators
  const debuggingKeywords = [
    'debug', 'error', 'bug', 'fix', 'broken', 'not working',
    'exception', 'crash', 'fail', 'issue', 'troubleshoot',
    'why is this not', 'how to fix', 'stack trace', 'runtime error'
  ];

  // Coding indicators
  const codingKeywords = [
    'code', 'function', 'class', 'implement', 'write code',
    'programming', 'algorithm', 'data structure', 'api',
    'react', 'typescript', 'javascript', 'python', 'java'
  ];

  // Document analysis indicators
  const documentKeywords = [
    'document', 'file', 'pdf', 'text', 'article', 'paper',
    'analyze', 'summarize', 'extract', 'read', 'parse',
    'large', 'lengthy', 'long text'
  ];

  if (debuggingKeywords.some(kw => lowerMessage.includes(kw))) {
    requestType = 'debugging';
  } else if (codingKeywords.some(kw => lowerMessage.includes(kw))) {
    requestType = 'coding';
  } else if (documentKeywords.some(kw => lowerMessage.includes(kw))) {
    requestType = 'document_analysis';
  }

  // Determine complexity level
  let complexity: ComplexityLevel = 'low';

  // Very high complexity indicators
  const veryHighKeywords = [
    'complex', 'difficult', 'challenging', 'advanced',
    'intricate', 'sophisticated', 'nuanced', 'subtle',
    'deep understanding', 'comprehensive', 'thorough analysis',
    'strategic', 'architectural', 'system design'
  ];

  // High complexity indicators
  const highKeywords = [
    'explain', 'why', 'how does', 'understand', 'analyze',
    'compare', 'evaluate', 'assess', 'reasoning', 'logic',
    'theory', 'concept', 'principle', 'mechanism'
  ];

  // Medium complexity indicators
  const mediumKeywords = [
    'what is', 'define', 'describe', 'list', 'example',
    'basic', 'simple', 'overview', 'introduction', 'summary'
  ];

  if (veryHighKeywords.some(kw => lowerMessage.includes(kw))) {
    complexity = 'very_high';
  } else if (highKeywords.some(kw => lowerMessage.includes(kw))) {
    complexity = 'high';
  } else if (mediumKeywords.some(kw => lowerMessage.includes(kw))) {
    complexity = 'medium';
  }

  // Adjust complexity based on message length
  if (messageLength > 1000) {
    complexity = complexity === 'low' ? 'medium' : complexity;
  }
  if (messageLength > 3000) {
    complexity = complexity === 'medium' ? 'high' : complexity;
  }

  return { complexity, requestType };
}

/**
 * Selects the appropriate model based on complexity and request type
 * Fallback logic for Plus Pro plan:
 * - Low/medium complexity + large documents/codes → deepseek
 * - General reasoning + very complex/difficult → GPT 5.6 Luna
 * - Debugging + very hard coding → Claude Opus 4.8
 */
export function selectPlusProModel(message: string): ModelSelectionResult {
  const { complexity, requestType } = analyzeMessageComplexity(message);

  // Debugging and very hard coding → Opus
  if (requestType === 'debugging' || (requestType === 'coding' && complexity === 'very_high')) {
    return {
      modelKey: 'plus_pro_opus',
      reason: 'Debugging or very hard coding task - using Claude Opus 4.8',
      complexity,
      requestType
    };
  }

  // General reasoning and very complex/difficult → Luna
  if (complexity === 'very_high' || complexity === 'high') {
    return {
      modelKey: 'plus_pro_luna',
      reason: 'Complex reasoning task - using GPT 5.6 Luna',
      complexity,
      requestType
    };
  }

  // Low to medium complexity, large documents/codes → DeepSeek
  if (requestType === 'document_analysis' || requestType === 'coding' || message.length > 500) {
    return {
      modelKey: 'plus_pro_deepseek',
      reason: 'Low to medium complexity or large content - using DeepSeek V4 Pro',
      complexity,
      requestType
    };
  }

  // Default to DeepSeek for general low complexity
  return {
    modelKey: 'plus_pro_deepseek',
    reason: 'General low complexity task - using DeepSeek V4 Pro',
    complexity,
    requestType
  };
}

/**
 * Checks if a specific model has available tokens
 */
export async function checkModelTokenAvailability(
  supabase: any,
  userId: string,
  modelKey: string,
  modelTier: string,
  dailyLimit: number,
  monthlyLimit: number
): Promise<boolean> {
  const { checkTokenLimits } = await import('./token-usage');
  
  try {
    const result = await checkTokenLimits(
      supabase,
      userId,
      modelTier,
      dailyLimit,
      monthlyLimit,
      modelKey
    );
    return result.allowed;
  } catch (error) {
    console.error(`Failed to check token availability for ${modelKey}:`, error);
    return false;
  }
}

/**
 * Selects the best available model with fallback based on token availability
 */
export async function selectAvailablePlusProModel(
  supabase: any,
  userId: string,
  message: string,
  modelTier: string,
  perModelLimits: Record<string, { daily: number; monthly: number }>
): Promise<ModelSelectionResult> {
  const primarySelection = selectPlusProModel(message);

  // Check if primary model has tokens available
  const primaryLimits = perModelLimits[primarySelection.modelKey];
  if (!primaryLimits) {
    // Model key not in perModelLimits — fall back to first available
    return selectFirstAvailable(supabase, userId, modelTier, perModelLimits, primarySelection);
  }

  const primaryAvailable = await checkModelTokenAvailability(
    supabase,
    userId,
    primarySelection.modelKey,
    modelTier,
    primaryLimits.daily,
    primaryLimits.monthly
  );

  if (primaryAvailable) {
    return primarySelection;
  }

  // Fallback order based on token limits (highest limit first)
  const fallbackOrder = [
    'plus_pro_deepseek', // 204K daily
    'plus_pro_luna',     // 47K daily
    'plus_pro_opus'      // 27K daily
  ];

  for (const modelKey of fallbackOrder) {
    if (modelKey === primarySelection.modelKey) continue;

    const limits = perModelLimits[modelKey];
    if (!limits) continue;

    const available = await checkModelTokenAvailability(
      supabase,
      userId,
      modelKey,
      modelTier,
      limits.daily,
      limits.monthly
    );

    if (available) {
      return {
        modelKey,
        reason: `Primary model out of tokens - falling back to ${modelKey}`,
        complexity: primarySelection.complexity,
        requestType: primarySelection.requestType
      };
    }
  }

  // All models out of tokens
  return {
    modelKey: primarySelection.modelKey,
    reason: 'All models out of tokens - will be blocked by limit check',
    complexity: primarySelection.complexity,
    requestType: primarySelection.requestType
  };
}

/**
 * Fallback: select the first model with available tokens.
 * Used when the primary selection's modelKey is not in perModelLimits.
 */
async function selectFirstAvailable(
  supabase: any,
  userId: string,
  modelTier: string,
  perModelLimits: Record<string, { daily: number; monthly: number }>,
  primarySelection: ModelSelectionResult
): Promise<ModelSelectionResult> {
  for (const modelKey of Object.keys(perModelLimits)) {
    const limits = perModelLimits[modelKey];
    const available = await checkModelTokenAvailability(
      supabase, userId, modelKey, modelTier, limits.daily, limits.monthly
    );
    if (available) {
      return {
        modelKey,
        reason: `Primary model not in limits config — using ${modelKey}`,
        complexity: primarySelection.complexity,
        requestType: primarySelection.requestType
      };
    }
  }
  return {
    modelKey: primarySelection.modelKey,
    reason: 'All models out of tokens - will be blocked by limit check',
    complexity: primarySelection.complexity,
    requestType: primarySelection.requestType
  };
}
