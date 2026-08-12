// prompts.ts – Prompt Compiler v5.2 + Mandatory Policies & Debug (fixed)
// Implicit prerequisites, constraint precedence, protected‑budget warnings,
// mandatory policies for freshness, security, debugging, architecture.
// Hard user constraints CANNOT be overridden by mandatory policies.
// Detailed selector logging with trim diagnostics.

import { SYSTEM_PROMPT } from '@/lib/chat/model-registry';

// ── 1. Parse sections (cached) ──────────────────────────
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

// ── 2. Core sections (immutable) ─────────────────────────
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

// ── 3. Objective types and dependencies ──────────────────
type ObjectiveType =
  | 'answer'
  | 'explain'
  | 'teach'
  | 'debug'
  | 'design'
  | 'generate'
  | 'analyze'
  | 'compare'
  | 'recommend'
  | 'plan'
  | 'research'
  | 'transform'
  | 'execute'
  | 'summarize';

interface Objective {
  type: ObjectiveType;
  priority: number;
  dependsOn: ObjectiveType[];
}

const OBJECTIVE_DEPENDENCIES: Record<ObjectiveType, ObjectiveType[]> = {
  generate: ['design'],
  execute: ['generate'],
  analyze: ['research'],
  recommend: ['compare'],
  transform: ['generate', 'design'],
  debug: ['analyze'],
  teach: ['explain'],
  plan: ['analyze'],
  compare: ['analyze'],
  design: [],
  explain: [],
  answer: [],
  research: [],
  summarize: [],
};

// ── 4. Extract & expand objectives ────────────────────────
function detectObjectives(message: string): Map<ObjectiveType, number> {
  const lower = message.toLowerCase();
  const detected = new Map<ObjectiveType, number>();
  const add = (t: ObjectiveType, w: number) => detected.set(t, (detected.get(t) || 0) + w);

  if (/\b(design|architect|architecture|system design|design a|design the|blueprint)\b/i.test(lower)) add('design', 4);
  if (/\b(why|how|explain|describe|what is|what are|meaning of)\b/i.test(lower)) add('explain', 3);
  if (/\b(teach|learn|tutorial|guide|beginner|eli5|new to|101|walkthrough)\b/i.test(lower)) add('teach', 3);
  if (/\b(debug|fix|not working|bug|error|crash|traceback|stack trace|resolve)\b/i.test(lower)) add('debug', 4);
  if (/\b(write|create|generate|build|code|implement|script|function)\b/i.test(lower)) add('generate', 3);
  if (/\b(analy[sz]e|review|audit|assess|evaluate|examine)\b/i.test(lower)) add('analyze', 3);
  if (/\b(compare|versus|vs\.?|differences? between|pros and cons|better|worse)\b/i.test(lower)) add('compare', 3);
  if (/\b(recommend|suggest|best|which (one|tool|framework|library|language|model)|what should I use)\b/i.test(lower)) add('recommend', 3);
  if (/\b(plan|roadmap|steps|milestone|schedule|agenda|next steps)\b/i.test(lower)) add('plan', 3);
  if (/\b(research|search|find|look up|latest|current|news|today|dive deep)\b/i.test(lower)) add('research', 3);
  if (/\b(convert|transform|translate|rewrite|refactor|clean up|modernize)\b/i.test(lower)) add('transform', 3);
  if (/\b(run|execute|test|perform|do (this|it)|apply)\b/i.test(lower)) add('execute', 3);
  if (/\b(summarize|summary|tl;dr|condense|shorten|key points|bullet points)\b/i.test(lower)) add('summarize', 3);
  if (detected.size === 0) add('answer', 1);

  return detected;
}

function extractObjectives(message: string): Objective[] {
  const detected = detectObjectives(message);
  const initial: Objective[] = Array.from(detected.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([type], idx) => ({ type, priority: idx + 1, dependsOn: OBJECTIVE_DEPENDENCIES[type] || [] }));

  const allTypes = new Set(detected.keys());
  let changed = true;
  while (changed) {
    changed = false;
    for (const obj of initial) {
      for (const prereq of obj.dependsOn) {
        if (!allTypes.has(prereq)) {
          initial.push({
            type: prereq,
            priority: initial.length + 1,
            dependsOn: OBJECTIVE_DEPENDENCIES[prereq] || [],
          });
          allTypes.add(prereq);
          changed = true;
        }
      }
    }
  }

  initial.sort((a, b) => a.priority - b.priority);
  for (let i = 0; i < initial.length; i++) initial[i].priority = i + 1;
  return initial;
}

// ── 5. Constraint precedence engine ──────────────────────
enum ConstraintPriority {
  DOMAIN_DEFAULT = 10,
  TASK_REQUIREMENT = 20,
  USER_INSTRUCTION = 30,
  HARD_CONSTRAINT = 40,
}

interface SectionDecision {
  decision: 'FORBIDDEN' | 'REQUIRED' | 'ALLOWED';
  priority: ConstraintPriority;
}

function setIfHigher(
  map: Map<string, SectionDecision>,
  section: string,
  decision: 'FORBIDDEN' | 'REQUIRED' | 'ALLOWED',
  priority: ConstraintPriority
) {
  const existing = map.get(section);
  if (!existing || priority > existing.priority) {
    map.set(section, { decision, priority });
  }
}

function buildSectionDecisions(
  message: string,
  objectives: Objective[],
  domains: Domain[],
  behavior: BehaviorFlags,
  scores: Map<string, number>
): Map<string, SectionDecision> {
  const lower = message.toLowerCase();
  const decisions = new Map<string, SectionDecision>();

  // Hard user constraints
  if (/\b(no code|don'?t (give|write|show) (me )?code|without code|code not needed)\b/i.test(lower)) {
    setIfHigher(decisions, 'CODE GENERATION STANDARDS', 'FORBIDDEN', ConstraintPriority.HARD_CONSTRAINT);
  }
  if (/\b(no (web )?search|don'?t search|without search(ing)?|offline)\b/i.test(lower)) {
    setIfHigher(decisions, 'TOOL USAGE & EXTERNAL CAPABILITIES', 'FORBIDDEN', ConstraintPriority.HARD_CONSTRAINT);
  }
  if (/\b(no diagram|don'?t (draw|visualize|make a diagram)|without diagram)\b/i.test(lower)) {
    setIfHigher(decisions, 'PROACTIVE DIAGRAMS', 'FORBIDDEN', ConstraintPriority.HARD_CONSTRAINT);
  }
  if (/\b(don'?t explain|no explanation|without expla(nation|ining)|just the (answer|fix|change))\b/i.test(lower)) {
    setIfHigher(decisions, 'ANALYTICAL REASONING & PROBLEM SOLVING', 'FORBIDDEN', ConstraintPriority.HARD_CONSTRAINT);
    setIfHigher(decisions, 'CRITICAL THINKING', 'FORBIDDEN', ConstraintPriority.HARD_CONSTRAINT);
    setIfHigher(decisions, 'ADVANCED COGNITIVE ENGINE', 'FORBIDDEN', ConstraintPriority.HARD_CONSTRAINT);
  }
  if (/\b(just (answer|tell me|the answer)|only the answer|straight answer)\b/i.test(lower)) {
    setIfHigher(decisions, 'REDUNDANCY & TOKEN OPTIMISATION', 'REQUIRED', ConstraintPriority.USER_INSTRUCTION);
  }

  // Task requirements (primary objective with weight >= 4 -> REQUIRED)
  const primaryObj = objectives.find(o => o.priority === 1);
  if (primaryObj) {
    const boost = OBJECTIVE_SECTION_BOOST[primaryObj.type] || [];
    for (const { title, weight } of boost) {
      if (weight >= 4) {
        setIfHigher(decisions, title, 'REQUIRED', ConstraintPriority.TASK_REQUIREMENT);
      }
    }
  }

  // Domain defaults
  const domainSections = new Set<string>();
  for (const domain of domains) {
    const list = domainSectionMap[domain] || [];
    for (const title of list) domainSections.add(title);
  }
  for (const title of domainSections) {
    setIfHigher(decisions, title, 'ALLOWED', ConstraintPriority.DOMAIN_DEFAULT);
  }

  return decisions;
}

// ── 6. Domain classifier ─────────────────────────────────
type Domain = 'coding' | 'math' | 'security' | 'architecture' | 'writing' | 'research' | 'business' | 'general';

function classifyDomain(message: string): Domain[] {
  const lower = message.toLowerCase();
  const domains: Domain[] = [];
  if (/\b(code|program|function|class|api|endpoint|database|sql|algorithm|bug|debug|compile|runtime|syntax|typescript|javascript|python|java|rust|go(lang)?|c\+\+|c#|react|next\.?js|vue|angular|svelte|express|django|flask|spring|tailwind|prisma|supabase)\b/i.test(lower)) domains.push('coding');
  if (/\b(math|equation|derivative|integral|probability|statistic|algebra|geometry|trigonometry|logarithm|exponent|solve)\b/i.test(lower)) domains.push('math');
  if (/\b(security|vulnerab|injection|csrf|xss|owasp|encrypt|decrypt|auth|jwt|oauth|secret|credential|penetrat|hack|breach)\b/i.test(lower)) domains.push('security');
  if (/\b(architecture|system design|design pattern|microservice|monolith|scalability|distributed|component|module|dependency|interface|pipeline|workflow|orchestrat|event-driven)\b/i.test(lower)) domains.push('architecture');
  if (/\b(write|story|article|blog|email|letter|poem|creative|draft)\b/i.test(lower)) domains.push('writing');
  if (/\b(research|study|paper|survey|findings|data|analysis|statistics|trends)\b/i.test(lower)) domains.push('research');
  if (/\b(business|marketing|sales|revenue|customer|product|pricing|strategy|startup|company)\b/i.test(lower)) domains.push('business');
  if (domains.length === 0) domains.push('general');
  return domains;
}

// ── 7. Behavior flags ────────────────────────────────────
interface BehaviorFlags {
  needs_reasoning: boolean;
  needs_verification: boolean;
  needs_examples: boolean;
  needs_web: boolean;
  needs_tools: boolean;
  code_domain: boolean;
  code_required: boolean;
  needs_citations: boolean;
  needs_step_by_step: boolean;
  needs_comparison: boolean;
  needs_memory: boolean;
  needs_clarification: boolean;
  needs_diagram: boolean;
}

function detectBehavior(message: string, domains: Domain[]): BehaviorFlags {
  const lower = message.toLowerCase();
  const codeDomain = domains.includes('coding');
  const codeRequired =
    /\b(write|create|implement|code|build) (a |the |an )?(function|method|class|component|module|script|endpoint|api)\b/i.test(lower) ||
    (codeDomain && /\b(how (do|can|to) I (code|write|implement|create)|give me the code|show the code|example code)\b/i.test(lower));

  return {
    needs_reasoning: /\b(why|reason|logic|critic(al)?|analy[sz]e|compare|prove)\b/i.test(lower),
    needs_verification: /\b(verify|check|test|validate|correct)\b/i.test(lower),
    needs_examples: /\b(example|demo|sample|illustrate)\b/i.test(lower),
    needs_web: /\b(search|web|latest|current|news|today|look up)\b/i.test(lower),
    needs_tools: /\b(scrape|download|fetch|api call|curl)\b/i.test(lower),
    code_domain: codeDomain,
    code_required: codeRequired,
    needs_citations: /\b(cite|source|reference|according to)\b/i.test(lower),
    needs_step_by_step: /\b(step by step|walkthrough|guide)\b/i.test(lower),
    needs_comparison: /\b(compare|versus|vs|pros and cons)\b/i.test(lower),
    needs_memory: /\b(remember|memory|previous|earlier|you said|you mentioned)\b/i.test(lower),
    needs_clarification: /\b(what do you mean|clarify|elaborate|confusing|unclear)\b/i.test(lower),
    needs_diagram: /\b(diagram|visualize|mermaid|flowchart|graph|chart|ascii|draw)\b/i.test(lower),
  };
}

// ── 8. Complexity estimation ─────────────────────────────
type ComplexityLevel = 'trivial' | 'simple' | 'moderate' | 'complex' | 'critical';

function refineComplexity(message: string, objectives: Objective[], domains: Domain[], behavior: BehaviorFlags): ComplexityLevel {
  const lower = message.toLowerCase();
  const wordCount = message.split(/\s+/).length;
  let baseScore = 0;
  if (wordCount > 80) baseScore = 3;
  else if (wordCount > 30) baseScore = 2;
  else if (wordCount > 10) baseScore = 1;

  if (objectives.length >= 3) baseScore += 2;
  else if (objectives.length >= 2) baseScore += 1;

  if (/\b(algorithm|complexity|big o|race condition|deadlock|optimization|scaling|microservice)\b/i.test(lower)) baseScore += 1;
  if (domains.includes('security') || /\b(production|critical|urgent|crash|data loss)\b/i.test(lower)) baseScore += 1;
  if (behavior.needs_verification) baseScore += 1;

  const questionCount = (lower.match(/\?/g) || []).length;
  if (questionCount > 2 && objectives.length === 1) baseScore += 1;

  if (baseScore >= 5) return 'critical';
  if (baseScore >= 4) return 'complex';
  if (baseScore >= 2) return 'moderate';
  if (baseScore >= 1) return 'simple';
  return 'trivial';
}

// ── 9. Section scoring (objective‑aware) ─────────────────
const BASE_SIGNALS: Array<{ regex: RegExp; sections: Array<{ title: string; weight: number }> }> = [
  {
    regex: /\b(code|program|function|class|api|endpoint|database|sql|algorithm|data structure|refactor|debug|bug|error|compile|runtime|syntax|typescript|javascript|python|java|rust|go(lang)?|c\+\+|c#|regex)\b/i,
    sections: [
      { title: 'DEBUGGING FRAMEWORK', weight: 4 },
      { title: 'CODE REVIEW FRAMEWORK', weight: 3 },
      { title: 'REFACTORING FRAMEWORK', weight: 3 },
      { title: 'CODE TASK PROTOCOL', weight: 2 },
    ],
  },
  {
    regex: /\b(fix (this|the|my)|not working|broken|crash|traceback|exception|stack ?trace|segfault|typeerror|undefined is not a function)\b/i,
    sections: [{ title: 'DEBUGGING FRAMEWORK', weight: 6 }],
  },
  {
    regex: /\b(architecture|system design|design pattern|microservice|monolith|scalability|distributed|component|module|dependency|interface|pipeline|workflow|orchestrat)\b/i,
    sections: [
      { title: 'ARCHITECTURE FRAMEWORK', weight: 7 },
      { title: 'DECISION FRAMEWORK', weight: 3 },
    ],
  },
  {
    regex: /\b(math|equation|derivative|integral|probability|statistic|algebra|geometry|trigonometry|logarithm|exponent|solve)\b/i,
    sections: [{ title: 'MATH REASONING', weight: 8 }],
  },
  {
    regex: /\b(why|how|explain|reason|logic|analy[sz]e|compare|contrast|evaluate|justify|critic(al)?|think|prove|derive)\b/i,
    sections: [
      { title: 'ANALYTICAL REASONING & PROBLEM SOLVING', weight: 4 },
      { title: 'CRITICAL THINKING', weight: 4 },
      { title: 'ADVANCED COGNITIVE ENGINE', weight: 2 },
    ],
  },
  {
    regex: /\b(teach|learn|tutorial|guide|help|walkthrough|explain|example|beginner|new to|101|how (do|can|to) I)\b/i,
    sections: [{ title: 'TEACHING FRAMEWORK', weight: 6 }],
  },
  {
    regex: /\b(option|choice|decide|recommend|better approach|which (model|tool|framework|library)|pick one|pros and cons|vs|versus)\b/i,
    sections: [
      { title: 'DECISION FRAMEWORK', weight: 7 },
      { title: 'RECOMMENDATION FRAMEWORK', weight: 5 },
    ],
  },
  {
    regex: /\b(diagram|visualize|mermaid|flowchart|graph|chart|ascii|draw)\b/i,
    sections: [{ title: 'PROACTIVE DIAGRAMS', weight: 8 }],
  },
  {
    regex: /\b(search|web|url|fetch|api (call|request)|http|https|download|curl|scrape)\b/i,
    sections: [{ title: 'TOOL USAGE & EXTERNAL CAPABILITIES', weight: 4 }],
  },
  {
    regex: /\b(time|clock|weather|temperature|forecast|date|calendar|today|tomorrow)\b/i,
    sections: [{ title: 'REAL‑TIME WIDGETS', weight: 6 }],
  },
  {
    regex: /\b(remember|memory|context|history|previous|earlier|you said|you mentioned)\b/i,
    sections: [{ title: 'MEMORY SYSTEM', weight: 5 }],
  },
  {
    regex: /\b(task|autonomous|multi-step|orchestrat|workflow|pipeline|agent|batch|do (it|this) (all|end to end)|handle everything)\b/i,
    sections: [
      { title: 'TASK EXECUTION & COMPLETION PROTOCOL', weight: 5 },
      { title: 'TOOL SELECTION POLICY', weight: 2 },
      { title: 'FAILURE RECOVERY PROTOCOL', weight: 2 },
      { title: 'TASK COMPLETION PROTOCOL', weight: 2 },
      { title: 'MINIMAL ACTION PRINCIPLE', weight: 2 },
    ],
  },
  {
    regex: /\b(security|vulnerab|injection|csrf|xss|owasp|encrypt|decrypt|auth|jwt|oauth|secret|credential|penetrat)\b/i,
    sections: [{ title: 'SAFETY & BOUNDARIES', weight: 2 }],
  },
  {
    regex: /\b(culture|locale|country|language|translation|timezone|metric|imperial)\b/i,
    sections: [{ title: 'CULTURAL DEXTERITY & GLOBAL AWARENESS', weight: 3 }],
  },
  {
    regex: /\b(concise|short|brief|tl;dr|summarize|token|efficient|no fluff|keep it short)\b/i,
    sections: [{ title: 'REDUNDANCY & TOKEN OPTIMISATION', weight: 4 }],
  },
  {
    regex: /\b(quality|verify|check|correct|accurate|precise|double-check)\b/i,
    sections: [{ title: 'FINAL OBJECTIVE', weight: 2 }],
  },
];

const OBJECTIVE_SECTION_BOOST: Record<ObjectiveType, Array<{ title: string; weight: number }>> = {
  design: [
    { title: 'ARCHITECTURE FRAMEWORK', weight: 6 },
    { title: 'DECISION FRAMEWORK', weight: 4 },
  ],
  explain: [
    { title: 'ANALYTICAL REASONING & PROBLEM SOLVING', weight: 3 },
    { title: 'CRITICAL THINKING', weight: 3 },
  ],
  teach: [
    { title: 'TEACHING FRAMEWORK', weight: 5 },
  ],
  debug: [
    { title: 'DEBUGGING FRAMEWORK', weight: 5 },
    { title: 'SELF‑REFLECTION & VERIFICATION', weight: 3 },
  ],
  generate: [
    { title: 'CODE GENERATION STANDARDS', weight: 5 },
  ],
  analyze: [
    { title: 'ANALYTICAL REASONING & PROBLEM SOLVING', weight: 3 },
    { title: 'CRITICAL THINKING', weight: 3 },
  ],
  compare: [
    { title: 'DECISION FRAMEWORK', weight: 4 },
    { title: 'CRITICAL THINKING', weight: 3 },
  ],
  recommend: [
    { title: 'DECISION FRAMEWORK', weight: 4 },
    { title: 'RECOMMENDATION FRAMEWORK', weight: 4 },
  ],
  plan: [
    { title: 'TASK EXECUTION & COMPLETION PROTOCOL', weight: 4 },
    { title: 'DECISION FRAMEWORK', weight: 3 },
  ],
  research: [
    { title: 'TOOL USAGE & EXTERNAL CAPABILITIES', weight: 4 },
  ],
  transform: [
    { title: 'REFACTORING FRAMEWORK', weight: 4 },
    { title: 'CODE TASK PROTOCOL', weight: 3 },
  ],
  execute: [
    { title: 'TASK EXECUTION & COMPLETION PROTOCOL', weight: 4 },
    { title: 'FAILURE RECOVERY PROTOCOL', weight: 3 },
  ],
  summarize: [
    { title: 'REDUNDANCY & TOKEN OPTIMISATION', weight: 4 },
  ],
  answer: [],
};

const domainSectionMap: Record<Domain, string[]> = {
  coding: ['DEBUGGING FRAMEWORK', 'CODE TASK PROTOCOL'],
  math: ['MATH REASONING'],
  security: ['SAFETY & BOUNDARIES'],
  architecture: ['ARCHITECTURE FRAMEWORK', 'DECISION FRAMEWORK'],
  writing: ['TEACHING FRAMEWORK'],
  research: ['TOOL USAGE & EXTERNAL CAPABILITIES'],
  business: ['DECISION FRAMEWORK'],
  general: [],
};

// ── 10. Section dependencies ──────────────────────────────
const SECTION_DEPENDENCIES: Record<string, string[]> = {
  'DEBUGGING FRAMEWORK': ['SELF‑REFLECTION & VERIFICATION', 'FAILURE RECOVERY PROTOCOL', 'TASK COMPLETION PROTOCOL'],
  'CODE TASK PROTOCOL': ['TASK EXECUTION & COMPLETION PROTOCOL', 'TASK COMPLETION PROTOCOL'],
  'TASK EXECUTION & COMPLETION PROTOCOL': ['TOOL SELECTION POLICY', 'FAILURE RECOVERY PROTOCOL'],
  'ARCHITECTURE FRAMEWORK': ['DECISION FRAMEWORK', 'SELF‑REFLECTION & VERIFICATION'],
};

// ── 11. Compatibility matrix ──────────────────────────────
const SECTION_CONFLICTS: Record<string, { conflictsWith: string[]; resolution: string }> = {
  'REDUNDANCY & TOKEN OPTIMISATION': {
    conflictsWith: ['TEACHING FRAMEWORK', 'ANALYTICAL REASONING & PROBLEM SOLVING'],
    resolution: 'prefer_shorter',
  },
  'TEACHING FRAMEWORK': {
    conflictsWith: ['MINIMAL ACTION PRINCIPLE'],
    resolution: 'prefer_teaching',
  },
};

function resolveConflicts(
  selectedTitles: Set<string>,
  responseModes: string[],
  objectives: Objective[],
  protectedTitles: Set<string>
): Set<string> {
  const final = new Set(selectedTitles);
  for (const [section, rule] of Object.entries(SECTION_CONFLICTS)) {
    if (!final.has(section)) continue;
    for (const conflict of rule.conflictsWith) {
      if (!final.has(conflict)) continue;
      if (protectedTitles.has(section) && protectedTitles.has(conflict)) continue;
      if (protectedTitles.has(section)) {
        final.delete(conflict);
      } else if (protectedTitles.has(conflict)) {
        final.delete(section);
      } else if (rule.resolution === 'prefer_shorter' && responseModes.includes('concise')) {
        final.delete(conflict);
      } else if (rule.resolution === 'prefer_teaching' && objectives.some(o => o.type === 'teach')) {
        final.delete(conflict);
      } else {
        final.delete(section);
      }
    }
  }
  return final;
}

// ── 12. Dynamic quotas (merged across objectives) ─────────
const TASK_QUOTAS: Record<ObjectiveType, Record<string, number>> = {
  design:     { domain: 4, reasoning: 4, tools: 2, quality: 2 },
  explain:    { reasoning: 4, domain: 3, tools: 1, quality: 2 },
  teach:      { reasoning: 5, domain: 2, tools: 1, quality: 2 },
  debug:      { tools: 5, domain: 3, reasoning: 2, quality: 3 },
  generate:   { domain: 4, tools: 3, reasoning: 2, quality: 3 },
  analyze:    { reasoning: 4, domain: 3, tools: 2, quality: 3 },
  compare:    { reasoning: 4, domain: 3, tools: 1, quality: 2 },
  recommend:  { reasoning: 4, domain: 2, tools: 1, quality: 2 },
  plan:       { reasoning: 4, domain: 3, tools: 3, quality: 3 },
  research:   { tools: 4, reasoning: 3, domain: 2, quality: 2 },
  transform:  { domain: 4, tools: 3, reasoning: 2, quality: 2 },
  execute:    { tools: 4, domain: 3, reasoning: 2, quality: 3 },
  summarize:  { reasoning: 1, domain: 1, tools: 0, quality: 1 },
  answer:     { reasoning: 2, domain: 2, tools: 1, quality: 2 },
};

const DEFAULT_QUOTAS: Record<string, number> = {
  domain: 3, reasoning: 3, tools: 2, context: 2, quality: 3, advanced: 2, behavior: 4,
};

function mergeQuotas(objectives: Objective[]): Record<string, number> {
  const merged: Record<string, number> = { ...DEFAULT_QUOTAS };
  for (const obj of objectives) {
    const profile = TASK_QUOTAS[obj.type];
    if (!profile) continue;
    for (const [cat, limit] of Object.entries(profile)) {
      merged[cat] = Math.max(merged[cat] || 0, limit);
    }
  }
  return merged;
}

// ── 13. Token helpers ─────────────────────────────────────
export function estimatePromptTokens(prompt: string): number {
  return Math.ceil(prompt.split(/\s+/).length * 1.3);
}

function trimSectionsToTokenBudget(
  sections: { title: string; content: string }[],
  protectedTitles: Set<string>,
  maxSystemTokens: number
): { title: string; content: string }[] {
  let current = [...sections];
  let text = current.map(s => `## ${s.title}\n${s.content}`).join('\n\n');
  while (estimatePromptTokens(text) > maxSystemTokens && current.length > protectedTitles.size) {
    for (let i = current.length - 1; i >= 0; i--) {
      if (!protectedTitles.has(current[i].title)) {
        current.splice(i, 1);
        break;
      }
    }
    text = current.map(s => `## ${s.title}\n${s.content}`).join('\n\n');
  }
  return current;
}

// ── 14. Section category helper ───────────────────────────
function classifySection(title: string): string[] {
  if (isCoreSection(title)) return ['core'];
  if (/^(CODE|DEBUGGING|REFACTORING|CODE REVIEW|ARCHITECTURE)/i.test(title)) return ['domain'];
  if (/^(TEACHING|DECISION|RECOMMENDATION|ANALYTICAL|CRITICAL THINKING)/i.test(title)) return ['reasoning'];
  if (/^(MATH|MATH REASONING)/i.test(title)) return ['domain'];
  if (/^(TOOL USAGE|TOOL SELECTION|FAILURE RECOVERY|TASK|MINIMAL ACTION|EVIDENCE|UNCERTAINTY|ASSUMPTION|CLARIFICATION|CONTEXT|SELF-CORRECTION)/i.test(title)) return ['tools'];
  if (/^(PROACTIVE DIAGRAMS|REAL‑TIME WIDGETS|CULTURAL DEXTERITY)/i.test(title)) return ['advanced'];
  if (/^(MEMORY SYSTEM|CONTEXT RELEVANCE)/i.test(title)) return ['context'];
  if (/^(FINAL OBJECTIVE|REDUNDANCY)/i.test(title)) return ['quality'];
  return ['behavior'];
}

// ── 15. MANDATORY POLICIES (fixed) ────────────────────────
// Policies are only enforced if the section is not explicitly forbidden
function applyMandatoryPolicies(
  message: string,
  domains: Domain[],
  mandatory: Set<string>,
  scores: Map<string, number>,
  forbidden: Set<string>
): void {
  const lower = message.toLowerCase();

  // Freshness / current information
  if (/\b(latest|current|recent|today|yesterday|tomorrow|as of 20\d{2}|this year|news|update|release)\b/i.test(lower)) {
    const section = 'TOOL USAGE & EXTERNAL CAPABILITIES';
    if (!forbidden.has(section)) {
      mandatory.add(section);
      scores.set(section, Math.max(scores.get(section) || 0, 10));
    } else {
      console.warn(`⚠️ Mandatory freshness policy blocked by hard constraint: ${section}`);
    }
  }

  // Security / auth / production (only when domain matches)
  if (domains.includes('security') || (domains.includes('coding') && /\b(production|deploy|infrastructure|authentication|oauth|jwt|csrf|xss)\b/i.test(lower))) {
    for (const section of ['SAFETY & BOUNDARIES', 'SELF‑REFLECTION & VERIFICATION']) {
      if (!forbidden.has(section)) {
        mandatory.add(section);
        scores.set(section, Math.max(scores.get(section) || 0, 10));
      } else {
        console.warn(`⚠️ Mandatory security policy blocked by hard constraint: ${section}`);
      }
    }
  }

  // Debugging / error
  if (/\b(debug|error|broken|not working|crash|401|403|500|traceback|exception|bug)\b/i.test(lower)) {
    for (const section of ['DEBUGGING FRAMEWORK', 'SELF‑REFLECTION & VERIFICATION']) {
      if (!forbidden.has(section)) {
        mandatory.add(section);
        scores.set(section, Math.max(scores.get(section) || 0, 10));
      }
    }
  }

  // Architecture / system design
  if (domains.includes('architecture') || /\b(architecture|system design|scalab|microservice|distributed|deploy|infrastructure)\b/i.test(lower)) {
    for (const section of ['ARCHITECTURE FRAMEWORK', 'DECISION FRAMEWORK', 'SELF‑REFLECTION & VERIFICATION']) {
      if (!forbidden.has(section)) {
        mandatory.add(section);
        scores.set(section, Math.max(scores.get(section) || 0, 10));
      }
    }
  }
}

// ── 16. Main builder v5.2 + Fixed Policies ────────────────
export function buildPrompt(
  tier: string,
  userMessage: string,
  extras: string[] = [],
  complexityOverride?: ComplexityLevel,
  maxTokens?: number
): string {
  const sections = getSections();
  const lowerMsg = userMessage.toLowerCase();

  // 1. Objectives (with implicit prerequisites)
  const objectives = extractObjectives(userMessage);

  // 2. Domains & behavior
  const domains = classifyDomain(userMessage);
  const behavior = detectBehavior(userMessage, domains);
  const complexity = complexityOverride || refineComplexity(userMessage, objectives, domains, behavior);

  // 3. Response modes
  const responseModes: string[] = [];
  if (/\b(concise|short|brief|tl;dr|summarize|keep it short|quick answer|one sentence)\b/i.test(lowerMsg)) responseModes.push('concise');
  if (/\b(detailed|thorough|in depth|comprehensive|exhaustive|deep dive)\b/i.test(lowerMsg)) responseModes.push('detailed');
  if (domains.includes('coding') || domains.includes('math') || domains.includes('security')) responseModes.push('technical');
  if (objectives.some(o => o.type === 'teach' || o.type === 'explain')) responseModes.push('educational');
  if (objectives.some(o => o.type === 'analyze' || o.type === 'compare')) responseModes.push('analytical');
  if (behavior.needs_step_by_step || objectives.some(o => o.type === 'plan')) responseModes.push('structured');
  if (responseModes.length === 0) responseModes.push('balanced');

  // 4. Initial scoring
  const scores = new Map<string, number>();
  for (const signal of BASE_SIGNALS) {
    if (signal.regex.test(lowerMsg)) {
      for (const { title, weight } of signal.sections) {
        scores.set(title, (scores.get(title) || 0) + weight);
      }
    }
  }

  for (const obj of objectives) {
    const boost = OBJECTIVE_SECTION_BOOST[obj.type] || [];
    const multiplier = obj.priority === 1 ? 2.5 : 1.5;
    for (const { title, weight } of boost) {
      scores.set(title, (scores.get(title) || 0) + weight * multiplier);
    }
  }

  for (const domain of domains) {
    for (const title of domainSectionMap[domain] || []) {
      scores.set(title, (scores.get(title) || 0) + 2);
    }
  }

  if (behavior.needs_reasoning) {
    scores.set('ANALYTICAL REASONING & PROBLEM SOLVING', (scores.get('ANALYTICAL REASONING & PROBLEM SOLVING') || 0) + 2);
    scores.set('CRITICAL THINKING', (scores.get('CRITICAL THINKING') || 0) + 2);
  }
  if (behavior.needs_verification) scores.set('SELF‑REFLECTION & VERIFICATION', (scores.get('SELF‑REFLECTION & VERIFICATION') || 0) + 3);
  if (behavior.needs_web) scores.set('TOOL USAGE & EXTERNAL CAPABILITIES', (scores.get('TOOL USAGE & EXTERNAL CAPABILITIES') || 0) + 3);
  if (behavior.needs_tools) scores.set('TOOL SELECTION POLICY', (scores.get('TOOL SELECTION POLICY') || 0) + 2);
  if (behavior.code_required) {
    scores.set('CODE GENERATION STANDARDS', (scores.get('CODE GENERATION STANDARDS') || 0) + 5);
  }
  if (behavior.needs_citations) scores.set('TOOL USAGE & EXTERNAL CAPABILITIES', (scores.get('TOOL USAGE & EXTERNAL CAPABILITIES') || 0) + 2);
  if (behavior.needs_memory) scores.set('MEMORY SYSTEM', (scores.get('MEMORY SYSTEM') || 0) + 3);
  if (behavior.needs_diagram) scores.set('PROACTIVE DIAGRAMS', (scores.get('PROACTIVE DIAGRAMS') || 0) + 5);

  if (responseModes.includes('concise')) scores.set('REDUNDANCY & TOKEN OPTIMISATION', (scores.get('REDUNDANCY & TOKEN OPTIMISATION') || 0) + 3);
  if (responseModes.includes('educational')) scores.set('TEACHING FRAMEWORK', (scores.get('TEACHING FRAMEWORK') || 0) + 2);
  if (responseModes.includes('structured')) scores.set('FORMATTING INTELLIGENCE', (scores.get('FORMATTING INTELLIGENCE') || 0) + 1);

  const complexityBonus: Record<ComplexityLevel, string[]> = {
    trivial: [],
    simple: [],
    moderate: ['ADVANCED COGNITIVE ENGINE'],
    complex: ['ADVANCED COGNITIVE ENGINE', 'DECISION FRAMEWORK'],
    critical: ['ADVANCED COGNITIVE ENGINE', 'ARCHITECTURE FRAMEWORK', 'DECISION FRAMEWORK'],
  };
  for (const title of complexityBonus[complexity]) {
    scores.set(title, (scores.get(title) || 0) + 2);
  }

  // 5. Constraint decisions
  const decisions = buildSectionDecisions(userMessage, objectives, domains, behavior, scores);

  // 6. Forbidden / mandatory from decisions + core
  const forbidden = new Set<string>();
  const mandatory = new Set<string>(sections.filter(s => isCoreSection(s.title)).map(s => s.title));

  for (const [title, decision] of decisions) {
    if (decision.decision === 'FORBIDDEN') {
      forbidden.add(title);
      scores.set(title, -1000);
    } else if (decision.decision === 'REQUIRED') {
      mandatory.add(title);
    }
  }

  // 7. Apply mandatory policies (respecting hard constraints)
  applyMandatoryPolicies(userMessage, domains, mandatory, scores, forbidden);

  // 8. Candidate selection (non‑forbidden, with sufficient score or mandatory)
  const candidateTitles = new Set<string>();
  for (const t of mandatory) candidateTitles.add(t);
  for (const sec of sections) {
    if (!forbidden.has(sec.title) && !candidateTitles.has(sec.title) && (scores.get(sec.title) || 0) >= 3) {
      candidateTitles.add(sec.title);
    }
  }

  // 9. Expand dependencies (cycle‑safe)
  const MAX_DEP_ITER = 100;
  for (let iter = 0; iter < MAX_DEP_ITER; iter++) {
    let changed = false;
    for (const [key, deps] of Object.entries(SECTION_DEPENDENCIES)) {
      if (candidateTitles.has(key)) {
        for (const dep of deps) {
          if (!candidateTitles.has(dep) && !forbidden.has(dep)) {
            candidateTitles.add(dep);
            changed = true;
          }
        }
      }
    }
    if (!changed) break;
  }

  // 10. Protected titles (mandatory + dependency sections)
  const protectedTitles = new Set(mandatory);
  for (const [key, deps] of Object.entries(SECTION_DEPENDENCIES)) {
    if (candidateTitles.has(key)) {
      for (const dep of deps) {
        if (candidateTitles.has(dep)) protectedTitles.add(dep);
      }
    }
  }

  // 11. Compatibility resolution
  const compatibleSet = resolveConflicts(candidateTitles, responseModes, objectives, protectedTitles);

  // 12. Dynamic quotas
  const quotas = mergeQuotas(objectives);
  const categoryCount: Record<string, number> = {};
  const finalSelection = new Set<string>();

  for (const title of compatibleSet) {
    if (protectedTitles.has(title)) {
      finalSelection.add(title);
      for (const cat of classifySection(title)) {
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      }
    }
  }

  const candidates = Array.from(compatibleSet)
    .filter(t => !finalSelection.has(t))
    .sort((a, b) => (scores.get(b) || 0) - (scores.get(a) || 0));

  for (const title of candidates) {
    const cats = classifySection(title).filter(c => c !== 'core');
    let canAdd = true;
    for (const cat of cats) {
      const limit = quotas[cat] ?? DEFAULT_QUOTAS[cat] ?? 3;
      if ((categoryCount[cat] || 0) >= limit) {
        canAdd = false;
        break;
      }
    }
    if (canAdd) {
      finalSelection.add(title);
      for (const cat of cats) categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    }
  }

  if (extras.length) {
    for (const t of extras) {
      if (!forbidden.has(t)) finalSelection.add(t);
    }
  }

  let filteredSections = sections.filter(s => finalSelection.has(s.title));

  // 13. Trim diagnostics: capture before/after titles
  const beforeTrimTitles = filteredSections.map(s => s.title);
  if (maxTokens && maxTokens > 0) {
    const maxSystemTokens = Math.floor(maxTokens * 0.6);
    const protectedOnly = filteredSections.filter(s => protectedTitles.has(s.title));
    const protectedText = protectedOnly.map(s => `## ${s.title}\n${s.content}`).join('\n\n');
    const protectedTokens = estimatePromptTokens(protectedText);
    if (protectedTokens > maxSystemTokens) {
      console.warn(`⚠️ Protected sections (${protectedOnly.length}) exceed system token budget: ~${protectedTokens} tokens > ${maxSystemTokens} max`);
    }
    filteredSections = trimSectionsToTokenBudget(filteredSections, protectedTitles, maxSystemTokens);
  }
  const afterTrimTitles = filteredSections.map(s => s.title);
  const trimmedTitles = beforeTrimTitles.filter(t => !afterTrimTitles.includes(t));

  const body = filteredSections.map(s => `## ${s.title}\n${s.content}`).join('\n\n');

  // ── 14. SELECTOR DEBUG LOGGING ──────────────────────────
  console.log(`=== PROMPT SELECTOR DEBUG ===`);
  console.log(`Message: "${userMessage.slice(0, 100)}..."`);
  console.log(`Intent: ${objectives.map(o => o.type).join(', ')}`);
  console.log(`Domain: ${domains.join(', ')}`);
  console.log(`CurrentInfoRequired: ${/\b(latest|current|recent|today|yesterday|tomorrow|as of 20\d{2}|this year|news|update|release)\b/i.test(lowerMsg)}`);
  console.log(`SecurityRequired: ${domains.includes('security') || (domains.includes('coding') && /\b(production|deploy|infrastructure|authentication|oauth|jwt|csrf|xss)\b/i.test(lowerMsg))}`);
  console.log(`Mandatory: ${[...mandatory].join(', ')}`);
  console.log(`Forbidden: ${[...forbidden].join(', ')}`);
  console.log(`Selected: ${afterTrimTitles.join(', ')}`);
  if (trimmedTitles.length > 0) {
    console.log(`Trimmed: ${trimmedTitles.join(', ')}`);
  } else {
    console.log(`Trimmed: none`);
  }
  console.log(`Final prompt: ${filteredSections.length} sections, ~${estimatePromptTokens(body)} tokens`);
  console.log(`===============================`);

  return body;
}