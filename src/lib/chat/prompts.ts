// prompts.ts – LLM‑Driven Adaptive Prompt Builder (truncated, intent‑focused)
// Uses a cheap LLM to select the most relevant sections from the monolithic
// SYSTEM_PROMPT. The selector sees a short truncated preview of the user message
// (first 1200 chars) and outputs ONLY the needed section titles. max_tokens=200
// keeps the selector lightweight while still allowing rich selections.

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
  console.log(`📚 Parsed ${sections.length} sections from SYSTEM_PROMPT`);
  return sections;
}

// ── 2. Core sections – always included (by EXACT title) ─
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

// ── 3. Complexity estimation ────────────────────────────
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

// ── 4. LLM Section Selector (truncated, max 200 tokens output) ──
async function selectSectionsViaLLM(
  fullMessage: string,
  availableTitles: string[]
): Promise<string[] | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn('🔑 No GROQ_API_KEY, selector disabled');
    return null;
  }

  const startTime = Date.now();

  // Truncate to first 1200 chars (~300 tokens) – enough to capture intent
  const MAX_CHARS = 1200;
  const preview =
    fullMessage.length <= MAX_CHARS
      ? fullMessage
      : fullMessage.slice(0, MAX_CHARS) + '…';

  const titlesList = availableTitles.map(t => `"${t}"`).join(', ');

  const selectorPrompt = `You are an intent classifier. Based on the START of the user message below, select the section titles that are most relevant to the request.
Return ONLY a JSON array of strings, e.g. ["SAFETY & BOUNDARIES", "CODE GENERATION STANDARDS"].
Available sections: [${titlesList}]

User message (truncated): "${preview}"`;

  console.log(`🤖 Selector input length: ${preview.length} chars`);

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: selectorPrompt }],
        temperature: 0.1,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      }),
    });

    const elapsed = Date.now() - startTime;

    if (!res.ok) {
      console.warn(`❌ Selector API error: ${res.status} (${res.statusText})`);
      return null;
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.warn('❌ Selector returned empty content');
      return null;
    }

    // Token usage from response
    const usage = data.usage || {};
    console.log(
      `✅ Selector finished in ${elapsed}ms | tokens: prompt=${usage.prompt_tokens || '?'}, completion=${usage.completion_tokens || '?'}, total=${usage.total_tokens || '?'}`
    );

    // ── Robust parsing: LLM may return a JSON array or an object with an array field ──
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.warn('⚠️ Selector returned invalid JSON:', content.slice(0, 200));
      return null;
    }

    let titles: string[] = [];

    if (Array.isArray(parsed)) {
      // Good: direct array
      titles = parsed.filter((t: unknown) => typeof t === 'string');
    } else if (parsed && typeof parsed === 'object') {
      // Object: look for the first array property (commonly "sections")
      const obj = parsed as Record<string, unknown>;
      for (const key of Object.keys(obj)) {
        if (Array.isArray(obj[key])) {
          titles = (obj[key] as unknown[]).filter((t: unknown) => typeof t === 'string');
          break;
        }
      }
    }

    // Filter to valid section titles (case‑insensitive)
    const titleSet = new Set(availableTitles.map(t => t.toLowerCase()));
    const validTitles = titles
      .filter(t => titleSet.has(t.toLowerCase()))
      .slice(0, 15);

    if (validTitles.length > 0) {
      console.log(`📌 Selected sections: ${validTitles.join(', ')}`);
      return validTitles;
    }

    console.warn('⚠️ Selector returned no valid section titles in:', content);
    return null;
  } catch (err) {
    console.warn('❌ Selector failed:', err);
    return null;
  }
}

// ── 5. Build the final prompt (async) ───────────────────
export async function buildPrompt(
  tier: string,
  userMessage: string,
  extras: string[] = [],
  complexityOverride?: ComplexityLevel
): Promise<string> {
  const sections = getSections();
  const allTitles = sections.map(s => s.title);

  // ── LLM‑driven selection ──
  let selectedTitles: string[] | null = null;
  try {
    selectedTitles = await selectSectionsViaLLM(userMessage, allTitles);
  } catch {
    // fallback to full prompt below
  }

  let filteredSections: typeof sections;

  if (selectedTitles && selectedTitles.length > 0) {
    const selectedSet = new Set(selectedTitles.map(t => t.toLowerCase()));
    const core = sections.filter(s => isCoreSection(s.title));
    const llmPicks = sections.filter(
      s => !isCoreSection(s.title) && selectedSet.has(s.title.toLowerCase())
    );
    const extraSections = extras.length
      ? sections.filter(s => extras.includes(s.title))
      : [];
    filteredSections = [...core, ...llmPicks, ...extraSections];
    const seen = new Set<string>();
    filteredSections = filteredSections.filter(s => {
      const key = s.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    console.log(
      `📋 Final prompt sections: ${filteredSections.map(s => s.title).join(', ')}`
    );
  } else {
    console.log('⚠️ Selector returned no titles, using full SYSTEM_PROMPT');
    filteredSections = sections;
  }

  // ── Complexity cap ──
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
    `📏 Final prompt: ${finalSections.length} sections, ~${estimatePromptTokens(prompt)} tokens`
  );

  return prompt;
}

// ── 6. Utility ──────────────────────────────────────────
export function estimatePromptTokens(prompt: string): number {
  return Math.ceil(prompt.split(/\s+/).length * 1.3);
}