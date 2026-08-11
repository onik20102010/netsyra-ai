// prompts.ts – Adaptive Prompt Builder (monolith‑compatible)
// Reads the full SYSTEM_PROMPT from model-registry.ts and automatically
// selects the sections most relevant to the user's request.
// No static task categories – purely message‑driven.

import { SYSTEM_PROMPT } from '@/lib/chat/model-registry'; // adjust path

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

// ── 2. Simple relevance score (shared words) ────────────
function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 2);
}

function scoreRelevance(message: string, sectionContent: string): number {
  const messageTokens = new Set(tokenize(message));
  const sectionTokens = tokenize(sectionContent);
  let score = 0;
  for (const token of sectionTokens) {
    if (messageTokens.has(token)) score += 1;
  }
  return score;
}

// ── 3. Core sections – always included (by EXACT title) ─
const CORE_TITLES: Set<string> = new Set([
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

// ── 4. Complexity estimation ────────────────────────────
type ComplexityLevel = 'trivial' | 'simple' | 'moderate' | 'complex' | 'critical';

function estimateComplexity(message: string): ComplexityLevel {
  const lower = message.toLowerCase();
  const wordCount = message.split(/\s+/).length;
  // Critical hints
  if (/\b(million users|production|commercial|enterprise|sla|compliance|security audit|disaster recovery|0 downtime)\b/.test(lower))
    return 'critical';
  if (wordCount > 80) return 'complex';
  if (wordCount > 30) return 'moderate';
  if (wordCount > 10) return 'simple';
  return 'trivial';
}

// ── 5. Build the final prompt ───────────────────────────
export function buildPrompt(
  tier: string,
  userMessage: string,       // the raw user request
  extras: string[] = [],     // force additional section titles (exact matches)
  complexityOverride?: ComplexityLevel
): string {
  const sections = getSections();

  // Score each section against the user's message
  const scored = sections.map(sec => ({
    ...sec,
    score: scoreRelevance(userMessage, sec.content),
  }));
  scored.sort((a, b) => b.score - a.score);

  // Always keep core sections
  const coreSections = sections.filter(sec => isCoreSection(sec.title));
  // Others, sorted by relevance
  const others = scored.filter(sec => !coreSections.includes(sec));

  // Merge: core first, then top relevant
  const selected = [...coreSections, ...others];

  // Limit based on complexity
  const level = complexityOverride || estimateComplexity(userMessage);
  const maxSections = {
    trivial: 6,
    simple: 10,
    moderate: 15,
    complex: 22,
    critical: 40,
  }[level];

  const finalSections = selected.slice(0, maxSections);

  // Build the prompt text (no self‑introductive header)
  const header = `[Netsyra‑AI, tier: ${tier}]`;
  const body = finalSections.map(s => `## ${s.title}\n${s.content}`).join('\n\n');
  return header + '\n\n' + body;
}

// ── 6. Utility ──────────────────────────────────────────
export function estimatePromptTokens(prompt: string): number {
  return Math.ceil(prompt.split(/\s+/).length * 1.3);
}