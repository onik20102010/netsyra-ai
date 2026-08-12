// prompts.ts – Deterministic Adaptive Prompt Builder
// No LLM needed. Maps user message keywords to relevant sections
// from the monolithic SYSTEM_PROMPT. Core sections are always included.

import { SYSTEM_PROMPT } from '@/lib/chat/model-registry';

// ── 1. Parse the monolith into sections (cached) ─────────
let _sections: { title: string; content: string }[] | null = null;

function getSections(): { title: string; content: string }[] {
  if (_sections) return _sections;
  const sections: { title: string; content: string }[] = [];
  const headingRegex = /^# (.*)$/gm;
  const content = SYSTEM_PROMPT;
  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(content)) !== null) {
    const title = match[1].trim();
    const start = match.index + match[0].length;
    const nextHeadingRegex = /^# /gm;
    nextHeadingRegex.lastIndex = start;
    const nextMatch = nextHeadingRegex.exec(content);
    const end = nextMatch ? nextMatch.index : content.length;
    const sectionContent = content.slice(start, end).trim();
    sections.push({ title, content: sectionContent });
  }
  _sections = sections;
  return sections;
}

// ── 2. Core sections – always included ──────────────────
const CORE_TITLES = new Set([
  'IDENTITY',
  'SAFETY & BOUNDARIES',
  'PERSONA & TONE',
  'RESPONSE STYLE & ADAPTIVE VERBOSITY',
  'EMOTIONAL INTELLIGENCE & USER‑STATE SENSITIVITY',
  'GRACEFUL REFUSAL & CONSTRUCTIVE ALTERNATIVES',
  'SELF‑REFLECTION & VERIFICATION',
  'FORMATTING INTELLIGENCE',
]);

function isCoreSection(title: string): boolean {
  return CORE_TITLES.has(title);
}

// ── 3. Keyword → Section mapping ────────────────────────
// Each keyword is a regex (case insensitive). When it matches
// the user message, the corresponding section titles are added.
const KEYWORD_SECTION_MAP: Array<{ regex: RegExp; sections: string[] }> = [
  // Coding / development
  {
    regex: /\b(code|program|function|class|api|endpoint|database|sql|algorithm|data structure|refactor|debug|bug|error|compile|runtime|syntax|typescript|javascript|python|java|rust|go(lang)?|c\+\+|c#)\b/i,
    sections: [
      'CODE GENERATION STANDARDS',
      'DEBUGGING FRAMEWORK',
      'CODE REVIEW FRAMEWORK',
      'REFACTORING FRAMEWORK',
      'CODE TASK PROTOCOL',
    ],
  },
  // Architecture / design
  {
    regex: /\b(architecture|system design|design pattern|microservice|monolith|scalability|distributed|component|module|dependency|interface)\b/i,
    sections: ['ARCHITECTURE FRAMEWORK'],
  },
  // Math
  {
    regex: /\b(math|equation|derivative|integral|probability|statistic|algebra|geometry|trigonometry|logarithm|exponent)\b/i,
    sections: ['MATH REASONING'],
  },
  // Reasoning / critical thinking / explanation
  {
    regex: /\b(why|how|explain|reason|logic|analy[sz]e|compare|contrast|evaluate|justify|critic(al)?|think)\b/i,
    sections: [
      'ANALYTICAL REASONING & PROBLEM SOLVING',
      'CRITICAL THINKING',
      'ADVANCED COGNITIVE ENGINE',
    ],
  },
  // Learning / teaching / help
  {
    regex: /\b(teach|learn|tutorial|guide|help|walkthrough|explain|example|beginner|new to|101)\b/i,
    sections: ['TEACHING FRAMEWORK'],
  },
  // Decision / recommendation
  {
    regex: /\b(option|choice|decide|recommend|better approach|which (model|tool|framework|library)|pick one)\b/i,
    sections: ['DECISION FRAMEWORK', 'RECOMMENDATION FRAMEWORK'],
  },
  // Planning / roadmap / steps
  {
    regex: /\b(plan|roadmap|steps|milestone|goal|objective|schedule|agenda)\b/i,
    sections: ['DECISION FRAMEWORK', 'RECOMMENDATION FRAMEWORK'],
  },
  // Diagrams
  {
    regex: /\b(diagram|visualize|mermaid|flowchart|graph|chart|ascii|draw)\b/i,
    sections: ['PROACTIVE DIAGRAMS'],
  },
  // Tools / external
  {
    regex: /\b(search|web|url|fetch|api (call|request)|http|https|download|curl)\b/i,
    sections: ['TOOL USAGE & EXTERNAL CAPABILITIES'],
  },
  // Time / weather / date
  {
    regex: /\b(time|clock|weather|temperature|forecast|date|calendar|today|tomorrow)\b/i,
    sections: ['REAL‑TIME WIDGETS'],
  },
  // Memory / context
  {
    regex: /\b(remember|memory|context|history|previous|earlier|you said|you mentioned)\b/i,
    sections: ['MEMORY SYSTEM'],
  },
  // Task / autonomous / multi-step
  {
    regex: /\b(task|autonomous|multi-step|orchestrat|workflow|pipeline|agent|batch)\b/i,
    sections: [
      'TASK EXECUTION PROTOCOL',
      'TOOL SELECTION POLICY',
      'FAILURE RECOVERY PROTOCOL',
      'TASK COMPLETION PROTOCOL',
      'EVIDENCE HIERARCHY',
      'UNCERTAINTY CALIBRATION',
      'ASSUMPTION MANAGEMENT',
      'CLARIFICATION POLICY',
      'MINIMAL ACTION PRINCIPLE',
      'CONTEXT RELEVANCE POLICY',
      'TASK STATE',
      'SELF-CORRECTION',
    ],
  },
  // Security
  {
    regex: /\b(security|vulnerab|injection|csrf|xss|owasp|encrypt|decrypt|auth|jwt|oauth|secret|credential)\b/i,
    sections: [
      'SAFETY & BOUNDARIES',   // already core, but ensures emphasis
      'CODE GENERATION STANDARDS',
    ],
  },
  // Cultural / locale
  {
    regex: /\b(culture|locale|country|language|translation|timezone|metric|imperial)\b/i,
    sections: ['CULTURAL DEXTERITY & GLOBAL AWARENESS'],
  },
  // Redundancy / efficiency
  {
    regex: /\b(concise|short|brief|tl;dr|summarize|token|efficient|no fluff)\b/i,
    sections: ['REDUNDANCY & TOKEN OPTIMISATION'],
  },
  // Final objective (quality)
  {
    regex: /\b(quality|verify|check|correct|accurate|precise)\b/i,
    sections: ['FINAL OBJECTIVE'],
  },
];

// ── 4. Complexity estimation (unchanged) ────────────────
type ComplexityLevel = 'trivial' | 'simple' | 'moderate' | 'complex' | 'critical';

function estimateComplexity(message: string): ComplexityLevel {
  const lower = message.toLowerCase();
  const wordCount = message.split(/\s+/).length;
  if (/\b(million users|production|commercial|enterprise|sla|compliance|security audit|disaster recovery|0 downtime)\b/.test(lower))
    return 'critical';
  if (wordCount > 80) return 'complex';
  if (wordCount > 30) return 'moderate';
  if (wordCount > 10) return 'simple';
  return 'trivial';
}

// ── 5. Build the final prompt (sync) ────────────────────
export function buildPrompt(
  tier: string,
  userMessage: string,
  extras: string[] = [],           // force additional section titles
  complexityOverride?: ComplexityLevel
): string {
  const sections = getSections();

  // Collect titles from keyword matches
  const lowerMsg = userMessage.toLowerCase();
  const selectedTitles = new Set<string>();

  for (const entry of KEYWORD_SECTION_MAP) {
    if (entry.regex.test(lowerMsg)) {
      entry.sections.forEach(s => selectedTitles.add(s));
    }
  }

  // Always add core sections
  const coreSections = sections.filter(s => isCoreSection(s.title));
  const nonCore = sections.filter(s => !isCoreSection(s.title) && selectedTitles.has(s.title));

  // Add extras (force-included titles)
  const extraSections = extras.length
    ? sections.filter(s => extras.includes(s.title))
    : [];

  // Merge, deduplicate (preserve order: core first, then selected, then extras)
  const merged = [...coreSections, ...nonCore, ...extraSections];
  const seen = new Set<string>();
  const filteredSections = merged.filter(s => {
    const key = s.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Cap by complexity
  const level = complexityOverride || estimateComplexity(userMessage);
  const maxSections = {
    trivial: 6,
    simple: 10,
    moderate: 15,
    complex: 22,
    critical: 40,
  }[level];
  const finalSections = filteredSections.slice(0, maxSections);

  const header = `[Netsyra‑AI, tier: ${tier}]`;
  const body = finalSections.map(s => `## ${s.title}\n${s.content}`).join('\n\n');
  const prompt = header + '\n\n' + body;

  console.log(
    `📌 Selected sections (keyword): ${finalSections.map(s => s.title).join(', ') || 'none'}`
  );
  console.log(`📏 Final prompt: ${finalSections.length} sections, ~${estimatePromptTokens(prompt)} tokens`);
  return prompt;
}

// ── 6. Utility ──────────────────────────────────────────
export function estimatePromptTokens(prompt: string): number {
  return Math.ceil(prompt.split(/\s+/).length * 1.3);
}