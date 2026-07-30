// Accurate Token Counter — replaces rough estimateTokensNeeded()
// Uses character-based estimation compatible with cl100k_base encoding.
// For production, install tiktoken: npm install tiktoken

// ── BPE-based token estimation (tiktoken-compatible) ────────
let tiktokenModule: any = null;

async function loadTiktoken() {
  if (tiktokenModule) return tiktokenModule;
  try {
    // @ts-ignore — tiktoken is optional
    // eval prevents Turbopack/webpack from statically resolving this optional dep
    tiktokenModule = await (0, eval)('import("tiktoken")');
    return tiktokenModule;
  } catch {
    return null;
  }
}

// ── Character-based fallback ───────────────────────────────
function estimateTokensFallback(text: string, type: 'text' | 'code' = 'text'): number {
  if (!text) return 0;
  const chars = text.length;
  const codeBlockCount = (text.match(/```/g) || []).length;
  const hasCode = codeBlockCount >= 2;
  if (hasCode || type === 'code') return Math.ceil(chars / 2.5);
  return Math.ceil(chars / 3.5);
}

// ── Accurate token count using tiktoken ─────────────────────
async function countWithTiktoken(text: string, model: string = 'gpt-4'): Promise<number> {
  const tk = await loadTiktoken();
  if (!tk) return estimateTokensFallback(text);
  try {
    const encoding = tk.encoding_for_model(model);
    const tokens = encoding.encode(text);
    encoding.free();
    return tokens.length;
  } catch {
    return estimateTokensFallback(text);
  }
}

// ── Public API ──────────────────────────────────────────────

export interface TokenEstimate {
  tokens: number;
  method: 'tiktoken' | 'fallback';
  cost?: number;
}

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-5': { input: 0.015, output: 0.06 },
  'gpt-5-mini': { input: 0.0015, output: 0.006 },
  'claude-opus-4.6': { input: 0.015, output: 0.075 },
  'claude-sonnet-4.6': { input: 0.003, output: 0.015 },
  'deepseek-v4-pro': { input: 0.002, output: 0.008 },
  'deepseek-v4-flash': { input: 0.0005, output: 0.002 },
  'gemini-2.5-flash': { input: 0.00015, output: 0.0006 },
  'gemini-2.5-pro': { input: 0.00125, output: 0.005 },
  'llama-3.1-8b-instant': { input: 0.00005, output: 0.0001 },
  'llama-3.3-70b-versatile': { input: 0.0002, output: 0.0004 },
};

export async function countTokens(text: string, model?: string): Promise<TokenEstimate> {
  if (model) {
    const tokens = await countWithTiktoken(text, model);
    const pricing = MODEL_PRICING[model];
    return { tokens, method: tiktokenModule ? 'tiktoken' : 'fallback', cost: pricing ? (tokens / 1000) * pricing.input : undefined };
  }
  return { tokens: estimateTokensFallback(text), method: 'fallback' };
}

export function countTokensSync(text: string, type: 'text' | 'code' = 'text'): number {
  return estimateTokensFallback(text, type);
}

export async function countMessageTokens(
  messages: Array<{ role: string; content: string }>,
  model?: string
): Promise<TokenEstimate> {
  const overhead = messages.length * 4;
  let totalText = '';
  for (const msg of messages) totalText += msg.content + '\n';
  const textEstimate = await countTokens(totalText, model);
  return { tokens: textEstimate.tokens + overhead, method: textEstimate.method, cost: textEstimate.cost };
}

export async function estimateTokensNeeded(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  expectedResponseLength: number = 500
): Promise<TokenEstimate> {
  const systemTokens = countTokensSync(systemPrompt);
  const messageEstimate = await countMessageTokens(messages);
  const responseTokens = countTokensSync('x'.repeat(expectedResponseLength));
  return { tokens: systemTokens + messageEstimate.tokens + responseTokens, method: messageEstimate.method, cost: messageEstimate.cost };
}

export function selectEfficientModel(
  taskType: 'simple_qa' | 'code' | 'reasoning' | 'creative' | 'analysis',
  tokenBudget: number
): { model: string; provider: string; reason: string } {
  if (taskType === 'simple_qa') return { model: 'deepseek-v4-flash', provider: 'deepseek', reason: 'Simple Q&A — cheapest model' };
  if (taskType === 'code') {
    if (tokenBudget > 4000) return { model: 'claude-sonnet-4.6', provider: 'anthropic', reason: 'Complex code — Sonnet for reliability' };
    return { model: 'deepseek-v4-pro', provider: 'deepseek', reason: 'Code task — DeepSeek Pro (cost-efficient)' };
  }
  if (taskType === 'reasoning') {
    if (tokenBudget > 8000) return { model: 'claude-opus-4.6', provider: 'anthropic', reason: 'Very complex reasoning — Opus' };
    return { model: 'gpt-5', provider: 'openai', reason: 'Complex reasoning — GPT-5' };
  }
  if (taskType === 'creative') return { model: 'gpt-5-mini', provider: 'openai', reason: 'Creative task — GPT-5 Mini (balanced)' };
  if (taskType === 'analysis') {
    if (tokenBudget > 4000) return { model: 'claude-sonnet-4.6', provider: 'anthropic', reason: 'Deep analysis — Sonnet' };
    return { model: 'deepseek-v4-pro', provider: 'deepseek', reason: 'Analysis — DeepSeek Pro' };
  }
  return { model: 'deepseek-v4-flash', provider: 'deepseek', reason: 'Default efficient model' };
}

export interface TokenBudget {
  daily: number;
  used: number;
  remaining: number;
  reserved: number;
  perRequest: { systemPrompt: number; context: number; response: number; total: number };
}

/**
 * Trim conversation context messages to fit within a model's context window.
 * System messages are always kept. Context messages are kept from most recent
 * to oldest until the token budget is exhausted. Older messages that don't fit
 * are dropped.
 *
 * @param apiMessages - Full message array (system + context messages)
 * @param contextWindowSize - Model's total context window in tokens
 * @param responseTokenBudget - Tokens reserved for the model's response
 * @returns Trimmed message array that fits within the context window
 */
export function trimContextByTokens(
  apiMessages: Array<{ role: string; content: string }>,
  contextWindowSize: number,
  responseTokenBudget: number
): Array<{ role: string; content: string }> {
  const systemMessages = apiMessages.filter(m => m.role === "system");
  const contextMessages = apiMessages.filter(m => m.role !== "system");

  const systemTokens = systemMessages.reduce((sum, m) => sum + countTokensSync(m.content), 0);
  const availableForContext = contextWindowSize - systemTokens - responseTokenBudget;

  if (availableForContext <= 0) {
    console.log(`📏 Context trim: only system prompt fits (${systemTokens} tokens system, ${contextWindowSize} window, ${responseTokenBudget} reserved for response)`);
    return systemMessages;
  }

  const selectedContext: Array<{ role: string; content: string }> = [];
  let usedTokens = 0;
  let droppedCount = 0;

  for (let i = contextMessages.length - 1; i >= 0; i--) {
    const msgTokens = countTokensSync(contextMessages[i].content);
    if (usedTokens + msgTokens > availableForContext) {
      droppedCount = i + 1;
      break;
    }
    selectedContext.unshift(contextMessages[i]);
    usedTokens += msgTokens;
  }

  if (droppedCount > 0) {
    console.log(`📏 Context trim: kept ${selectedContext.length} messages (${usedTokens} tokens), dropped ${droppedCount} older messages (window: ${contextWindowSize}, system: ${systemTokens}, response budget: ${responseTokenBudget})`);
  }

  return [...systemMessages, ...selectedContext];
}

export function calculateTokenBudget(
  dailyLimit: number,
  usedToday: number,
  systemPrompt: string,
  contextMessages: Array<{ role: string; content: string }>,
  maxResponseTokens: number
): TokenBudget {
  const reserved = Math.floor(dailyLimit * 0.1);
  const available = dailyLimit - usedToday - reserved;
  const systemTokens = countTokensSync(systemPrompt);
  const contextTokens = contextMessages.reduce((sum, m) => sum + countTokensSync(m.content), 0);
  const responseTokens = maxResponseTokens;
  return {
    daily: dailyLimit,
    used: usedToday,
    remaining: Math.max(0, available),
    reserved,
    perRequest: { systemPrompt: systemTokens, context: contextTokens, response: responseTokens, total: systemTokens + contextTokens + responseTokens },
  };
}
