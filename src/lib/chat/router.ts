// src/lib/chat/router.ts
// ─────────────────────────────────────────────────────────────────────────────
//  N E T S Y R A   ·   M O N S T E R   R O U T E R
// ─────────────────────────────────────────────────────────────────────────────
// A zero-token, fully-deterministic, weighted multi-signal routing engine.
//
// Given a user message (and optional conversation context) it picks the best
// model tier for "Auto" mode — GPT/Claude-style — using cheap, explainable
// heuristics. No network calls, no model tokens, sub-millisecond, dependency
// free. Manual tier selection still overrides this upstream, and N Live search
// remains gated separately by the diveDeep toggle.
//
// How it works:
//   1. Normalize the message and extract a rich feature vector (length, code,
//      math, questions, structure, imperatives, brevity/depth hints, …).
//   2. Run every message through a weighted signal table; each match adds
//      per-tier points and records a human-readable label.
//   3. Fold in length-, structure-, and history-based adjustments.
//   4. Apply hard overrides (explicit "be brief" / "think deeply" / "agent").
//   5. Argmax over tier scores with a stable priority tie-break, then compute a
//      softmax-style confidence and rank the alternatives.
//
// The public contract is backward compatible: `routeModel(message, opts)` still
// returns an object with `.tier` and `.reason`. Extra fields (confidence,
// scores, features, alternatives, signals) are additive and optional to read.
// ─────────────────────────────────────────────────────────────────────────────

export type RoutableTier = "fast" | "plus" | "pro" | "code" | "aai";

export const ROUTABLE_TIERS: readonly RoutableTier[] = [
  "fast",
  "plus",
  "pro",
  "code",
  "aai",
] as const;

// Tie-break priority when scores are equal (higher index wins ties upward).
// Rationale: a genuine agentic/code request should not silently fall back to a
// chat tier, while ambiguous chatter should prefer the cheaper tier.
const TIER_PRIORITY: Record<RoutableTier, number> = {
  fast: 0,
  plus: 1,
  pro: 2,
  code: 3,
  aai: 4,
};

export interface RouteFeatures {
  wordCount: number;
  charCount: number;
  sentenceCount: number;
  questionCount: number;
  hasCodeFence: boolean;
  hasInlineCode: boolean;
  codeLangHits: number;
  hasUrl: boolean;
  listItems: number;
  conjunctions: number;
  isMultiPart: boolean;
  digitRatio: number;
  uppercaseRatio: number;
  wantsBrevity: boolean;
  wantsDepth: boolean;
  wantsAgentic: boolean;
  isCasual: boolean;
  historyLength: number;
}

export interface RouteResult {
  tier: RoutableTier;
  reason: string;
  // ── additive telemetry (safe to ignore by existing callers) ──
  confidence?: number;
  scores?: Record<RoutableTier, number>;
  signals?: string[];
  features?: RouteFeatures;
  alternatives?: Array<{ tier: RoutableTier; score: number }>;
}

export interface RouteOptions {
  /** Number of prior messages in the thread (depth of an ongoing conversation). */
  historyLength?: number;
  /** Never route below this tier (e.g. a paid user's floor). Optional. */
  minTier?: RoutableTier;
  /** Never route above this tier (e.g. quota-limited ceiling). Optional. */
  maxTier?: RoutableTier;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Signal tables
// ─────────────────────────────────────────────────────────────────────────────
// Each signal contributes weighted points to one or more tiers when it matches.
// Weights are intentionally small and additive so that multiple weak signals
// can combine into a confident decision, while a single strong signal (weight
// >= 4) can dominate on its own.

interface WeightedSignal {
  label: string;
  re: RegExp;
  weights: Partial<Record<RoutableTier, number>>;
}

const SIGNALS: WeightedSignal[] = [
  // ── Code ──────────────────────────────────────────────────────────────────
  { label: "code-fence", re: /```|~~~/, weights: { code: 6 } },
  { label: "inline-code", re: /`[^`]+`/, weights: { code: 2 } },
  {
    label: "code-keywords",
    re: /\b(function|const|let|var|import|export|class|def|return|async|await|public|private|static|void|struct|interface|enum)\b/,
    weights: { code: 3 },
  },
  {
    label: "debug-terms",
    re: /\b(bug|error|exception|traceback|stack ?trace|compile|debug|refactor|segfault|npm|pip install|undefined is not|cannot read propert)\b/,
    weights: { code: 4 },
  },
  {
    label: "languages",
    re: /\b(typescript|javascript|python|java|c\+\+|c#|golang|\bgo\b|rust|php|ruby|kotlin|swift|scala|haskell|bash|shell|sql)\b/,
    weights: { code: 3 },
  },
  {
    label: "frameworks",
    re: /\b(react|next\.?js|node\.?js|express|django|flask|spring|tailwind|prisma|supabase|postgres|mongodb|redis|docker|kubernetes|terraform|graphql|rest api|api endpoint|regex)\b/,
    weights: { code: 3 },
  },
  { label: "code-punct", re: /[{}();]\s*$|=>|\)\s*\{|\bconsole\.log\b/, weights: { code: 2 } },
  {
    label: "code-verbs",
    re: /\b(implement|write (a |the )?(function|method|component|script|query)|fix (this|the|my)|optimi[sz]e (this|the)|unit test|type ?error)\b/,
    weights: { code: 3 },
  },

  // ── Reasoning / depth → Pro ─────────────────────────────────────────────────
  { label: "explain", re: /\b(explain|in detail|walk me through|elaborate|break (it|this) down)\b/, weights: { pro: 3, plus: 1 } },
  { label: "how-why", re: /\b(why (do|does|is|are)|how does|how do|what happens when|what causes)\b/, weights: { pro: 2 } },
  { label: "step-by-step", re: /\b(step[ -]by[ -]step|steps? to|guide|tutorial|walkthrough)\b/, weights: { pro: 3 } },
  { label: "design", re: /\b(architecture|system design|design (a|an|the)|scalab|distributed|microservice|schema|data model)\b/, weights: { pro: 4 } },
  { label: "compare", re: /\b(compare|comparison|pros and cons|trade-?offs?|versus|\bvs\b|difference between|better than)\b/, weights: { pro: 3, plus: 1 } },
  { label: "analyze", re: /\b(analy[sz]e|analysis|evaluate|assess|critique|reasoning|prove|derive|justify)\b/, weights: { pro: 3 } },
  { label: "depth-words", re: /\b(comprehensive|thorough|in-?depth|deep dive|deeply|nuanced|rigorous|complex)\b/, weights: { pro: 3 } },
  { label: "planning", re: /\b(plan|roadmap|learning path|curriculum|strategy|framework|approach for)\b/, weights: { pro: 3, plus: 1 } },

  // ── Math / formal reasoning → Pro ───────────────────────────────────────────
  { label: "math", re: /\b(integral|derivative|matrix|eigen|probability|theorem|proof|equation|calculus|algebra|optimi[sz]ation problem|big-?o)\b/, weights: { pro: 4 } },
  { label: "math-symbols", re: /(∫|∑|√|∞|≠|≤|≥|∂|Σ|π)|\b\d+\s*[\^]\s*\d+\b/, weights: { pro: 3 } },

  // ── Creative / drafting → Plus (Pro if long) ────────────────────────────────
  { label: "creative", re: /\b(write (me )?(a|an|the)?\s*(poem|story|essay|email|letter|song|script|blog|post|caption)|draft|compose|rewrite|paraphrase)\b/, weights: { plus: 3, pro: 1 } },
  { label: "summarize", re: /\b(summari[sz]e|tl;?dr|condense|shorten|key points|bullet points)\b/, weights: { plus: 2 } },
  { label: "translate", re: /\b(translate|in (spanish|french|german|urdu|hindi|arabic|chinese|japanese)|to english)\b/, weights: { plus: 2 } },

  // ── Autonomous / agentic → AAI ──────────────────────────────────────────────
  { label: "agentic", re: /\b(autonomous(ly)?|multi-?step|end-to-end|orchestrate|agentic|act as an agent|on your own)\b/, weights: { aai: 6 } },
  { label: "full-build", re: /\b(build (me )?(a )?(full|complete|entire)|create (a )?(complete|full|whole)|do everything|handle the whole|from scratch to)\b/, weights: { aai: 5, pro: 1 } },
  { label: "research-deep", re: /\b(research (deeply|thoroughly|and (compile|summari[sz]e))|gather (all|the) (data|info|sources)|deep research)\b/, weights: { aai: 4, pro: 1 } },
  { label: "workflow", re: /\b(then (do|create|build|send)|after that|and also (build|create|generate)|multiple steps|several tasks)\b/, weights: { aai: 2 } },
];

// Short greetings / acknowledgements → Fast, no work needed.
const CASUAL_RE = /^(hi+|hello+|hey+|sup|yo|ok(ay)?|k|yes|no|nope|yeah|yep|thanks?|thank you|thx|ty|bye|goodbye|good (morning|night|evening|afternoon)|lol|haha|nice|cool|great|got it)\b[\s!.?]*$/i;

// Explicit user overrides that should dominate soft scoring.
const BREVITY_RE = /\b(be brief|briefly|in short|short answer|quick(ly)?|one line|tl;?dr|just tell me|simple answer|eli5|in a sentence|yes or no)\b/i;
const DEPTH_RE = /\b(think (deeply|hard|step by step|carefully)|be thorough|in great detail|comprehensive|exhaustive|leave nothing out|expert-level)\b/i;
const AGENTIC_RE = /\b(autonomous(ly)?|be an agent|act as an agent|do it (all|end to end)|handle everything)\b/i;

// ─────────────────────────────────────────────────────────────────────────────
//  Feature extraction
// ─────────────────────────────────────────────────────────────────────────────

function normalize(input: string): string {
  return (input || "")
    .normalize("NFKC")
    .replace(/\r\n/g, "\n")
    .trim();
}

export function extractFeatures(message: string, historyLength = 0): RouteFeatures {
  const text = normalize(message);
  const lower = text.toLowerCase();
  const words = text ? text.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const charCount = text.length;

  const sentenceCount = (text.match(/[.!?]+(\s|$)/g) || []).length || (text ? 1 : 0);
  const questionCount = (text.match(/\?/g) || []).length;
  const listItems = (text.match(/(^|\n)\s*(?:[-*•]|\d+[.)])\s+/g) || []).length;
  const conjunctions = (lower.match(/\b(and|also|then|plus|additionally|as well as|after that|followed by)\b/g) || []).length;

  const digits = (text.match(/\d/g) || []).length;
  const uppers = (text.match(/[A-Z]/g) || []).length;
  const letters = (text.match(/[A-Za-z]/g) || []).length || 1;

  return {
    wordCount,
    charCount,
    sentenceCount,
    questionCount,
    hasCodeFence: /```|~~~/.test(text),
    hasInlineCode: /`[^`]+`/.test(text),
    codeLangHits: (lower.match(/\b(typescript|javascript|python|java|rust|golang|\bgo\b|c\+\+|c#|php|ruby|kotlin|swift|sql|bash)\b/g) || []).length,
    hasUrl: /https?:\/\/|www\./i.test(text),
    listItems,
    conjunctions,
    isMultiPart: conjunctions >= 2 || listItems >= 3 || questionCount >= 2,
    digitRatio: charCount ? digits / charCount : 0,
    uppercaseRatio: uppers / letters,
    wantsBrevity: BREVITY_RE.test(lower),
    wantsDepth: DEPTH_RE.test(lower),
    wantsAgentic: AGENTIC_RE.test(lower),
    isCasual: CASUAL_RE.test(text),
    historyLength,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Scoring helpers
// ─────────────────────────────────────────────────────────────────────────────

function emptyScores(): Record<RoutableTier, number> {
  return { fast: 0, plus: 0, pro: 0, code: 0, aai: 0 };
}

function clampTier(tier: RoutableTier, min?: RoutableTier, max?: RoutableTier): RoutableTier {
  let p = TIER_PRIORITY[tier];
  if (min && p < TIER_PRIORITY[min]) p = TIER_PRIORITY[min];
  if (max && p > TIER_PRIORITY[max]) p = TIER_PRIORITY[max];
  return (ROUTABLE_TIERS.find((t) => TIER_PRIORITY[t] === p) as RoutableTier) || tier;
}

/** Softmax-style confidence for the winning tier over the score distribution. */
function confidenceOf(scores: Record<RoutableTier, number>, winner: RoutableTier): number {
  const vals = ROUTABLE_TIERS.map((t) => scores[t]);
  const max = Math.max(...vals);
  const exps = vals.map((v) => Math.exp((v - max) / 2));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  const winnerExp = Math.exp((scores[winner] - max) / 2);
  return Math.round((winnerExp / sum) * 100) / 100;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main entry point
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Route a user message to the most appropriate model tier.
 *
 * Backward compatible: callers may read only `.tier` and `.reason`. Additional
 * telemetry (`confidence`, `scores`, `signals`, `features`, `alternatives`) is
 * populated for logging, debugging, and UI badges.
 *
 * @param message  The latest user message.
 * @param opts     Optional context: history length, and tier floor/ceiling.
 */
export function routeModel(message: string, opts: RouteOptions = {}): RouteResult {
  const historyLength = opts.historyLength ?? 0;
  const f = extractFeatures(message, historyLength);
  const lower = normalize(message).toLowerCase();
  const scores = emptyScores();
  const matched: string[] = [];

  // ── Fast path: empty / casual / trivially short ────────────────────────────
  if (f.wordCount === 0 || f.isCasual || f.wordCount <= 3) {
    const tier = clampTier("fast", opts.minTier, opts.maxTier);
    return {
      tier,
      reason: f.isCasual ? "casual greeting" : "trivially short",
      confidence: 0.98,
      scores: { ...scores, fast: 10 },
      signals: [f.isCasual ? "casual" : "short"],
      features: f,
      alternatives: [],
    };
  }

  // ── 1. Weighted signal accumulation ────────────────────────────────────────
  for (const sig of SIGNALS) {
    if (sig.re.test(lower)) {
      matched.push(sig.label);
      for (const t of ROUTABLE_TIERS) {
        const w = sig.weights[t];
        if (w) scores[t] += w;
      }
    }
  }

  // ── 2. Length-based complexity ─────────────────────────────────────────────
  if (f.wordCount > 80) {
    scores.pro += 3;
    scores.plus += 1;
    matched.push("very-long");
  } else if (f.wordCount > 40) {
    scores.pro += 2;
    scores.plus += 2;
    matched.push("long");
  } else if (f.wordCount > 18) {
    scores.plus += 2;
    matched.push("medium-length");
  } else if (f.wordCount <= 8) {
    scores.fast += 2;
  }

  // ── 3. Structure & multi-part requests ─────────────────────────────────────
  if (f.isMultiPart) {
    scores.pro += 2;
    scores.aai += 1;
    matched.push("multi-part");
  }
  if (f.listItems >= 3) {
    scores.pro += 1;
    matched.push("enumerated");
  }
  if (f.questionCount >= 3) {
    scores.pro += 1;
    matched.push("many-questions");
  }
  if (f.hasUrl) {
    scores.plus += 1;
    matched.push("contains-url");
  }

  // ── 4. Conversation depth (ongoing complex thread) ─────────────────────────
  if (historyLength > 12) {
    scores.pro += 2;
    matched.push("deep-thread");
  } else if (historyLength > 6) {
    scores.pro += 1;
    scores.plus += 1;
    matched.push("ongoing-thread");
  }

  // ── 5. Hard user overrides (dominate soft scoring) ─────────────────────────
  if (f.wantsAgentic) {
    scores.aai += 6;
    matched.push("override:agentic");
  }
  if (f.wantsDepth) {
    scores.pro += 5;
    matched.push("override:depth");
  }
  if (f.wantsBrevity && !f.hasCodeFence && scores.code < 4 && scores.aai < 4) {
    // Explicit brevity pulls toward the cheaper conversational tiers,
    // unless the task is unavoidably code/agentic.
    scores.fast += 4;
    scores.plus += 1;
    scores.pro = Math.max(0, scores.pro - 3);
    matched.push("override:brevity");
  }

  // ── 6. Baseline so a plain factual question still lands somewhere sane ──────
  scores.plus += 1; // gentle default toward the balanced tier

  // ── 7. Argmax with deterministic tie-break ─────────────────────────────────
  // Among tiers sharing the max score, prefer a strong specialist (code/aai
  // with weight >= 4); otherwise pick the cheapest (lowest priority) tier.
  const maxScore = Math.max(...ROUTABLE_TIERS.map((t) => scores[t]));
  const topTiers = ROUTABLE_TIERS.filter((t) => scores[t] === maxScore);
  const specialist = topTiers.find((t) => (t === "aai" || t === "code") && scores[t] >= 4);
  const winner: RoutableTier =
    specialist ?? topTiers.reduce((a, b) => (TIER_PRIORITY[a] <= TIER_PRIORITY[b] ? a : b));

  // ── 8. Apply tier floor/ceiling constraints ────────────────────────────────
  const tier = clampTier(winner, opts.minTier, opts.maxTier);

  // ── 9. Build ranked alternatives + confidence + reason ─────────────────────
  const alternatives = ROUTABLE_TIERS.map((t) => ({ tier: t, score: scores[t] }))
    .filter((a) => a.tier !== tier)
    .sort((a, b) => b.score - a.score);

  const confidence = confidenceOf(scores, tier);
  const topLabels = matched.slice(0, 4).join(", ") || "default";
  const reason = `${tier} · score ${scores[tier]} · [${topLabels}]`;

  return { tier, reason, confidence, scores, signals: matched, features: f, alternatives };
}
