// prompts.ts – Prompt Compiler v5.3 (production)
// Fully explicit SectionClass pipeline, corrected diagnostics,
// entity‑freshness detection, conditional dependency protection,
// and transitive dependency closure. Zero extra token cost.

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
  detectDependencyCycles(); // startup validation
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

// ── 3. Types ──────────────────────────────────────────────
type ObjectiveType =
  | 'answer' | 'explain' | 'teach' | 'debug' | 'design'
  | 'generate' | 'analyze' | 'compare' | 'recommend'
  | 'plan' | 'research' | 'transform' | 'execute' | 'summarize';

type ResponseMode = 'concise' | 'balanced' | 'detailed' | 'technical' | 'educational' | 'analytical' | 'structured';
type Domain = 'coding' | 'math' | 'security' | 'architecture' | 'writing' | 'research' | 'business' | 'general';
type ComplexityLevel = 'trivial' | 'simple' | 'moderate' | 'complex' | 'critical';
type SectionClass = 'MANDATORY' | 'REQUIRED' | 'RELEVANT' | 'OPTIONAL' | 'FORBIDDEN';

interface ObjectiveNode {
  type: ObjectiveType;
  priority: number;
  confidence: number;
  explicit: boolean;
  inferred: boolean;
}

interface Constraint {
  type: 'no_code' | 'no_web' | 'no_examples' | 'no_diagram' | 'no_explanation' | 'concise' | 'one_sentence' | 'no_markdown' | 'dont_change';
  priority: number;
  source: 'hard_user_constraint' | 'user_instruction' | 'task_requirement' | 'domain_default';
}

interface IntentFrame {
  primaryObjective: ObjectiveType;
  secondaryObjectives: ObjectiveType[];
  objectives: ObjectiveNode[];
  domains: Domain[];
  codeDomain: boolean;
  codeRequired: boolean;
  requiresReasoning: boolean;
  requiresCurrentInformation: boolean;
  requiresEntityFreshness: boolean;
  requiresExternalEvidence: boolean;
  requiresWeb: boolean;
  requiresTools: boolean;
  requiresVerification: boolean;
  requiresExamples: boolean;
  requiresStepByStep: boolean;
  requiresComparison: boolean;
  requiresCitations: boolean;
  requiresDiagram: boolean;
  requiresMemory: boolean;
  responseModes: ResponseMode[];
  complexity: ComplexityLevel;
  constraints: Constraint[];
  confidence: number;
}

interface SectionDecision {
  title: string;
  class: SectionClass;
  utility: number;
  reasons: string[];
}

// ── 4. Dependency graph & cycle detection ────────────────
const SECTION_DEPENDENCIES: Record<string, string[]> = {
  'DEBUGGING FRAMEWORK': ['SELF‑REFLECTION & VERIFICATION', 'FAILURE RECOVERY PROTOCOL', 'TASK COMPLETION PROTOCOL'],
  'CODE TASK PROTOCOL': ['TASK EXECUTION & COMPLETION PROTOCOL', 'TASK COMPLETION PROTOCOL'],
  'TASK EXECUTION & COMPLETION PROTOCOL': ['TOOL SELECTION POLICY', 'FAILURE RECOVERY PROTOCOL'],
  'ARCHITECTURE FRAMEWORK': ['DECISION FRAMEWORK', 'SELF‑REFLECTION & VERIFICATION'],
};

function detectDependencyCycles() {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  function visit(node: string): boolean {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;
    visiting.add(node);
    for (const dep of SECTION_DEPENDENCIES[node] || []) {
      if (visit(dep)) {
        console.error(`⚠️ Dependency cycle involving "${node}"`);
        return true;
      }
    }
    visiting.delete(node);
    visited.add(node);
    return false;
  }
  for (const node of Object.keys(SECTION_DEPENDENCIES)) {
    if (!visited.has(node) && visit(node)) {
      throw new Error('Dependency cycle detected in SECTION_DEPENDENCIES; aborting build.');
    }
  }
}

function dependencyClosure(roots: Set<string>): Set<string> {
  const result = new Set(roots);
  const queue = [...roots];
  while (queue.length) {
    const current = queue.shift()!;
    for (const dep of SECTION_DEPENDENCIES[current] || []) {
      if (!result.has(dep)) { result.add(dep); queue.push(dep); }
    }
  }
  return result;
}

// ── 5. Semantic Parser ────────────────────────────────────
function parseMessage(message: string): IntentFrame {
  const lower = message.toLowerCase();

  // ── Domains ──
  const domains: Domain[] = [];
  if (/\b(code|program|function|class|api|endpoint|database|sql|algorithm|bug|debug|compile|runtime|syntax|typescript|javascript|python|java|rust|go(lang)?|c\+\+|c#|react|next\.?js|vue|angular|svelte|express|django|flask|spring|tailwind|prisma|supabase)\b/i.test(lower)) domains.push('coding');
  if (/\b(math|equation|derivative|integral|probability|statistic|algebra|geometry|trigonometry|logarithm|exponent|solve)\b/i.test(lower)) domains.push('math');
  if (/\b(security|vulnerab|injection|csrf|xss|owasp|encrypt|decrypt|auth|jwt|oauth|secret|credential|penetrat|hack|breach)\b/i.test(lower)) domains.push('security');
  if (/\b(architecture|system design|design pattern|microservice|monolith|scalability|distributed|component|module|dependency|interface|pipeline|workflow|orchestrat|event-driven)\b/i.test(lower)) domains.push('architecture');
  if (/\b(write|story|article|blog|email|letter|poem|creative|draft)\b/i.test(lower)) domains.push('writing');
  if (/\b(research|study|paper|survey|findings|data|analysis|statistics|trends)\b/i.test(lower)) domains.push('research');
  if (/\b(business|marketing|sales|revenue|customer|product|pricing|strategy|startup|company)\b/i.test(lower)) domains.push('business');
  if (domains.length === 0) domains.push('general');

  // ── Code behavior ──
  const codeDomain = domains.includes('coding');
  const codeRequired =
    /\b(write|create|implement|code|build|generate|add|make|produce|return code|show implementation)\s+(a |the |an )?(function|method|class|component|module|script|endpoint|api|code)\b/i.test(lower) ||
    /\b(how (do|can|to) I (code|write|implement|create))\b/i.test(lower) ||
    /\b(give me the code|show the code|example code)\b/i.test(lower) ||
    /\b(generate|produce|output) (the |a )?(code|implementation)\b/i.test(lower);

  // ── Objectives ──
  const objScores: Record<ObjectiveType, number> = {
    answer:0, explain:0, teach:0, debug:0, design:0,
    generate:0, analyze:0, compare:0, recommend:0,
    plan:0, research:0, transform:0, execute:0, summarize:0,
  };
  if (/\b(design|architect|blueprint|system design|design a|design the)\b/i.test(lower)) objScores.design += 4;
  if (/\b(why|how|explain|describe|what is|what are|meaning of)\b/i.test(lower)) objScores.explain += 3;
  if (/\b(teach|learn|tutorial|guide|beginner|eli5|new to|101|walkthrough)\b/i.test(lower)) objScores.teach += 3;
  if (/\b(debug|fix|not working|bug|error|crash|traceback|stack trace|resolve)\b/i.test(lower)) objScores.debug += 4;
  if (codeRequired) objScores.generate += 4;
  else if (/\b(write|create|implement|build|generate) (a |the )?\w*(function|method|class|component|module|script|endpoint|api)\b/i.test(lower)) objScores.generate += 3;
  if (/\b(analy[sz]e|review|audit|assess|evaluate|examine)\b/i.test(lower)) objScores.analyze += 3;
  if (/\b(compare|versus|vs\.?|differences? between|pros and cons|better|worse)\b/i.test(lower)) objScores.compare += 3;
  if (/\b(recommend|suggest|best|which (one|tool|framework|library|language|model)|what should I use)\b/i.test(lower)) objScores.recommend += 3;
  if (/\b(plan|roadmap|steps|milestone|schedule|agenda|next steps)\b/i.test(lower)) objScores.plan += 3;
  if (/\b(research|search|find|look up|latest|current|news|today|dive deep)\b/i.test(lower)) objScores.research += 3;
  if (/\b(convert|transform|translate|rewrite|refactor|clean up|modernize)\b/i.test(lower)) objScores.transform += 3;
  if (/\b(run|execute|test|perform|do (this|it)|apply)\b/i.test(lower)) objScores.execute += 3;
  if (/\b(summarize|summary|tl;dr|condense|shorten|key points|bullet points)\b/i.test(lower)) objScores.summarize += 3;
  if (Object.values(objScores).every(v => v === 0)) objScores.answer = 1;

  const sortedObj = (Object.keys(objScores) as ObjectiveType[])
    .filter(k => objScores[k] > 0)
    .sort((a, b) => objScores[b] - objScores[a]);
  const primaryObjective: ObjectiveType = sortedObj[0] || 'answer';
  const secondaryObjectives: ObjectiveType[] = sortedObj.slice(1, 3);

  // ── Information / tool requirements ──
  const hasTemporalMarker = /\b(latest|current|recent|today|now|currently|at present|as of now|newest|most recent|this year|this month)\b/i.test(lower);
  const requiresCurrentInformation =
    hasTemporalMarker &&
    (/\b(version|release|person|ceo|president|price|ranking|security|library|framework|model|company|product|news|event)\b/i.test(lower) ||
     domains.includes('research') || domains.includes('security'));

  const requiresEntityFreshness =
    /\b(who (is|are|leads|runs|owns)|ceo|president|director|founder|leader|coach|captain|manager|current (ceo|president|leader|coach|team|club|company|version|price)|plays? for|team (does|is)|squad|roster|lineup)\b/i.test(lower) &&
    !/\b(historical|former|past|dead|deceased|retired|founded|born|died)\b/i.test(lower);

  const requiresExternalEvidence =
    requiresCurrentInformation ||
    requiresEntityFreshness ||
    /\b(evidence|source|reference|study|report|official)\b/i.test(lower);

  const requiresWeb =
    requiresCurrentInformation ||
    requiresEntityFreshness ||
    /\b(search the web|search online|look it up online|browse the web|google|web search)\b/i.test(lower) ||
    requiresExternalEvidence;

  const requiresTools =
    requiresWeb ||
    /\b(scrape|download|api call|curl|fetch|execute|run)\b/i.test(lower);

  // ── Behavioral flags ──
  const requiresReasoning =
    primaryObjective === 'explain' || primaryObjective === 'analyze' ||
    primaryObjective === 'compare' || primaryObjective === 'recommend' ||
    /\b(why|reason|logic|justify|prove|evaluate)\b/i.test(lower);

  const requiresVerification =
    primaryObjective === 'debug' || primaryObjective === 'execute' ||
    primaryObjective === 'analyze' ||
    /\b(verify|check|test|validate|correct)\b/i.test(lower) ||
    domains.includes('security');

  const requiresExamples =
    primaryObjective === 'teach' || primaryObjective === 'explain' ||
    /\b(example|demo|sample|illustrate|show me)\b/i.test(lower);

  const requiresStepByStep =
    primaryObjective === 'teach' || primaryObjective === 'plan' ||
    /\b(step by step|walkthrough|guide|steps|tutorial)\b/i.test(lower);

  const requiresComparison =
    primaryObjective === 'compare' ||
    /\b(compare|versus|vs|pros and cons|differences? between)\b/i.test(lower);

  const requiresCitations =
    requiresExternalEvidence ||
    /\b(cite|source|reference|according to)\b/i.test(lower);

  const requiresDiagram =
    /\b(diagram|visualize|mermaid|flowchart|graph|chart|ascii|draw)\b/i.test(lower);

  const requiresMemory =
    /\b(remember|memory|previous|earlier|you said|you mentioned)\b/i.test(lower);

  // ── Response modes ──
  const responseModes: ResponseMode[] = [];
  if (/\b(one sentence|in a sentence|single sentence|briefly|just answer|only the answer|straight answer)\b/i.test(lower)) {
    responseModes.push('concise');
  } else if (/\b(concise|short|brief|tl;dr|summarize|keep it short|quick answer)\b/i.test(lower)) {
    responseModes.push('concise');
  } else if (/\b(detailed|thorough|in depth|comprehensive|exhaustive|deep dive)\b/i.test(lower)) {
    responseModes.push('detailed');
  } else if (domains.includes('coding') || domains.includes('math') || domains.includes('security')) {
    responseModes.push('technical');
  } else if (primaryObjective === 'teach' || primaryObjective === 'explain') {
    responseModes.push('educational');
  } else if (primaryObjective === 'analyze' || primaryObjective === 'compare') {
    responseModes.push('analytical');
  } else if (requiresStepByStep) {
    responseModes.push('structured');
  } else {
    responseModes.push('balanced');
  }

  // ── Complexity ──
  const wordCount = message.split(/\s+/).length;
  let baseScore = 0;
  if (wordCount > 80) baseScore = 3;
  else if (wordCount > 30) baseScore = 2;
  else if (wordCount > 10) baseScore = 1;
  if (secondaryObjectives.length >= 2) baseScore += 2;
  else if (secondaryObjectives.length >= 1) baseScore += 1;
  if (/\b(algorithm|complexity|big o|race condition|deadlock|optimization|scaling|microservice)\b/i.test(lower)) baseScore += 1;
  if (domains.includes('security') || /\b(production|critical|urgent|crash|data loss)\b/i.test(lower)) baseScore += 1;
  if (requiresVerification) baseScore += 1;
  const questionCount = (lower.match(/\?/g) || []).length;
  if (questionCount > 2 && primaryObjective === 'answer') baseScore += 1;
  let complexity: ComplexityLevel = 'trivial';
  if (baseScore >= 5) complexity = 'critical';
  else if (baseScore >= 4) complexity = 'complex';
  else if (baseScore >= 2) complexity = 'moderate';
  else if (baseScore >= 1) complexity = 'simple';

  // ── Constraints ──
  const constraints: Constraint[] = [];
  if (/\b(no code|don'?t (give|write|show) (me )?code|without code|code not needed)\b/i.test(lower))
    constraints.push({ type: 'no_code', priority: 10, source: 'hard_user_constraint' });
  if (/\b(no (web )?search|don'?t search|without search(ing)?|offline)\b/i.test(lower))
    constraints.push({ type: 'no_web', priority: 10, source: 'hard_user_constraint' });
  if (/\b(no diagram|don'?t (draw|visualize|make a diagram)|without diagram)\b/i.test(lower))
    constraints.push({ type: 'no_diagram', priority: 10, source: 'hard_user_constraint' });
  if (/\b(don'?t explain|no explanation|without expla(nation|ining)|just the (answer|fix|change))\b/i.test(lower))
    constraints.push({ type: 'no_explanation', priority: 8, source: 'hard_user_constraint' });
  if (/\b(just (answer|tell me|the answer)|only the answer|straight answer)\b/i.test(lower))
    constraints.push({ type: 'concise', priority: 5, source: 'user_instruction' });
  if (/\b(one sentence|in a sentence|single sentence|briefly)\b/i.test(lower))
    constraints.push({ type: 'one_sentence', priority: 6, source: 'user_instruction' });
  if (/\b(no markdown|plain text|no formatting|don'?t format)\b/i.test(lower))
    constraints.push({ type: 'no_markdown', priority: 6, source: 'user_instruction' });

  // ── Objective nodes ──
  const objectives: ObjectiveNode[] = sortedObj.map((type, idx) => ({
    type, priority: idx + 1,
    confidence: Math.min(1, (objScores[type] || 0) / 6),
    explicit: true, inferred: false,
  }));

  function addPrereq(type: ObjectiveType, condition: boolean) {
    if (condition && !objectives.some(o => o.type === type)) {
      objectives.push({ type, priority: objectives.length + 1, confidence: 0.5, explicit: false, inferred: true });
    }
  }

  if (primaryObjective === 'generate' && complexity !== 'trivial' && complexity !== 'simple') addPrereq('design', true);
  if (primaryObjective === 'execute') addPrereq('generate', true);
  if (primaryObjective === 'analyze' && (requiresCurrentInformation || requiresEntityFreshness)) addPrereq('research', true);
  if (primaryObjective === 'analyze' && requiresExternalEvidence) addPrereq('research', true);
  if (primaryObjective === 'compare') addPrereq('analyze', true);
  if (primaryObjective === 'recommend') addPrereq('compare', true);
  if (primaryObjective === 'transform') addPrereq('generate', true);
  if (primaryObjective === 'debug') addPrereq('analyze', true);
  if (primaryObjective === 'teach') addPrereq('explain', true);
  if (primaryObjective === 'plan' && (complexity === 'complex' || complexity === 'critical')) addPrereq('analyze', true);

  return {
    primaryObjective, secondaryObjectives, objectives,
    domains, codeDomain, codeRequired,
    requiresReasoning,
    requiresCurrentInformation,
    requiresEntityFreshness,
    requiresExternalEvidence,
    requiresWeb, requiresTools,
    requiresVerification, requiresExamples,
    requiresStepByStep, requiresComparison,
    requiresCitations, requiresDiagram, requiresMemory,
    responseModes, complexity, constraints,
    confidence: 0.8,
  };
}

// ── 6. Scoring signals (code gen excluded) ───────────────
const BASE_SIGNALS: Array<{ regex: RegExp; sections: Array<{ title: string; weight: number }> }> = [
  { regex: /\b(code|program|function|class|api|endpoint|database|sql|algorithm|data structure|refactor|debug|bug|error|compile|runtime|syntax|typescript|javascript|python|java|rust|go(lang)?|c\+\+|c#|regex)\b/i,
    sections: [{ title:'DEBUGGING FRAMEWORK', weight:4 },{ title:'CODE REVIEW FRAMEWORK', weight:3 },{ title:'REFACTORING FRAMEWORK', weight:3 },{ title:'CODE TASK PROTOCOL', weight:2 }] },
  { regex: /\b(fix (this|the|my)|not working|broken|crash|traceback|exception|stack ?trace|segfault|typeerror|undefined is not a function)\b/i,
    sections: [{ title:'DEBUGGING FRAMEWORK', weight:6 }] },
  { regex: /\b(architecture|system design|design pattern|microservice|monolith|scalability|distributed|component|module|dependency|interface|pipeline|workflow|orchestrat)\b/i,
    sections: [{ title:'ARCHITECTURE FRAMEWORK', weight:7 },{ title:'DECISION FRAMEWORK', weight:3 }] },
  { regex: /\b(math|equation|derivative|integral|probability|statistic|algebra|geometry|trigonometry|logarithm|exponent|solve)\b/i,
    sections: [{ title:'MATH REASONING', weight:8 }] },
  { regex: /\b(why|how|explain|reason|logic|analy[sz]e|compare|contrast|evaluate|justify|critic(al)?|think|prove|derive)\b/i,
    sections: [{ title:'ANALYTICAL REASONING & PROBLEM SOLVING', weight:4 },{ title:'CRITICAL THINKING', weight:4 },{ title:'ADVANCED COGNITIVE ENGINE', weight:2 }] },
  { regex: /\b(teach|learn|tutorial|guide|help|walkthrough|explain|example|beginner|new to|101|how (do|can|to) I)\b/i,
    sections: [{ title:'TEACHING FRAMEWORK', weight:6 }] },
  { regex: /\b(option|choice|decide|recommend|better approach|which (model|tool|framework|library)|pick one|pros and cons|vs|versus)\b/i,
    sections: [{ title:'DECISION FRAMEWORK', weight:7 },{ title:'RECOMMENDATION FRAMEWORK', weight:5 }] },
  { regex: /\b(diagram|visualize|mermaid|flowchart|graph|chart|ascii|draw)\b/i,
    sections: [{ title:'PROACTIVE DIAGRAMS', weight:8 }] },
  { regex: /\b(search|web|url|fetch|api (call|request)|http|https|download|curl|scrape)\b/i,
    sections: [{ title:'TOOL USAGE & EXTERNAL CAPABILITIES', weight:4 }] },
  { regex: /\b(time|clock|weather|temperature|forecast|date|calendar|today|tomorrow)\b/i,
    sections: [{ title:'REAL‑TIME WIDGETS', weight:6 }] },
  { regex: /\b(remember|memory|context|history|previous|earlier|you said|you mentioned)\b/i,
    sections: [{ title:'MEMORY SYSTEM', weight:5 }] },
  { regex: /\b(task|autonomous|multi-step|orchestrat|workflow|pipeline|agent|batch|do (it|this) (all|end to end)|handle everything)\b/i,
    sections: [{ title:'TASK EXECUTION & COMPLETION PROTOCOL', weight:5 },{ title:'TOOL SELECTION POLICY', weight:2 },{ title:'FAILURE RECOVERY PROTOCOL', weight:2 },{ title:'MINIMAL ACTION PRINCIPLE', weight:2 }] },
  { regex: /\b(security|vulnerab|injection|csrf|xss|owasp|encrypt|decrypt|auth|jwt|oauth|secret|credential|penetrat)\b/i,
    sections: [{ title:'SAFETY & BOUNDARIES', weight:2 }] },
  { regex: /\b(culture|locale|country|language|translation|timezone|metric|imperial)\b/i,
    sections: [{ title:'CULTURAL DEXTERITY & GLOBAL AWARENESS', weight:3 }] },
  { regex: /\b(concise|short|brief|tl;dr|summarize|token|efficient|no fluff|keep it short)\b/i,
    sections: [{ title:'REDUNDANCY & TOKEN OPTIMISATION', weight:4 }] },
  { regex: /\b(quality|verify|check|correct|accurate|precise|double-check)\b/i,
    sections: [{ title:'FINAL OBJECTIVE', weight:2 }] },
];

const OBJECTIVE_SECTION_BOOST: Record<ObjectiveType, Array<{ title: string; weight: number }>> = {
  design:    [{ title:'ARCHITECTURE FRAMEWORK', weight:6 },{ title:'DECISION FRAMEWORK', weight:4 }],
  explain:   [{ title:'ANALYTICAL REASONING & PROBLEM SOLVING', weight:3 },{ title:'CRITICAL THINKING', weight:3 }],
  teach:     [{ title:'TEACHING FRAMEWORK', weight:5 }],
  debug:     [{ title:'DEBUGGING FRAMEWORK', weight:5 },{ title:'SELF‑REFLECTION & VERIFICATION', weight:3 }],
  generate:  [], // only via codeRequired
  analyze:   [{ title:'ANALYTICAL REASONING & PROBLEM SOLVING', weight:3 },{ title:'CRITICAL THINKING', weight:3 }],
  compare:   [{ title:'DECISION FRAMEWORK', weight:4 },{ title:'CRITICAL THINKING', weight:3 }],
  recommend: [{ title:'DECISION FRAMEWORK', weight:4 },{ title:'RECOMMENDATION FRAMEWORK', weight:4 }],
  plan:      [{ title:'TASK EXECUTION & COMPLETION PROTOCOL', weight:4 },{ title:'DECISION FRAMEWORK', weight:3 }],
  research:  [{ title:'TOOL USAGE & EXTERNAL CAPABILITIES', weight:4 }],
  transform: [{ title:'REFACTORING FRAMEWORK', weight:4 },{ title:'CODE TASK PROTOCOL', weight:3 }],
  execute:   [{ title:'TASK EXECUTION & COMPLETION PROTOCOL', weight:4 },{ title:'FAILURE RECOVERY PROTOCOL', weight:3 }],
  summarize: [{ title:'REDUNDANCY & TOKEN OPTIMISATION', weight:4 }],
  answer:    [],
};

const domainSectionMap: Record<Domain, string[]> = {
  coding:       ['DEBUGGING FRAMEWORK','CODE TASK PROTOCOL'],
  math:         ['MATH REASONING'],
  security:     ['SAFETY & BOUNDARIES'],
  architecture: ['ARCHITECTURE FRAMEWORK','DECISION FRAMEWORK'],
  writing:      ['TEACHING FRAMEWORK'],
  research:     ['TOOL USAGE & EXTERNAL CAPABILITIES'],
  business:     ['DECISION FRAMEWORK'],
  general:      [],
};

// ── 7. Compatibility matrix ──────────────────────────────
const SECTION_CONFLICTS: Record<string, { conflictsWith: string[]; resolution: string }> = {
  'REDUNDANCY & TOKEN OPTIMISATION': { conflictsWith: ['TEACHING FRAMEWORK','ANALYTICAL REASONING & PROBLEM SOLVING'], resolution: 'prefer_shorter' },
  'TEACHING FRAMEWORK': { conflictsWith: ['MINIMAL ACTION PRINCIPLE'], resolution: 'prefer_teaching' },
};

function resolveConflicts(selected: Set<string>, modes: string[], objectives: ObjectiveNode[], protectedTitles: Set<string>): Set<string> {
  const final = new Set(selected);
  for (const [section, rule] of Object.entries(SECTION_CONFLICTS)) {
    if (!final.has(section)) continue;
    for (const conflict of rule.conflictsWith) {
      if (!final.has(conflict)) continue;
      if (protectedTitles.has(section) && protectedTitles.has(conflict)) continue;
      if (protectedTitles.has(section)) { final.delete(conflict); }
      else if (protectedTitles.has(conflict)) { final.delete(section); }
      else if (rule.resolution === 'prefer_shorter' && modes.includes('concise')) { final.delete(conflict); }
      else if (rule.resolution === 'prefer_teaching' && objectives.some(o => o.type === 'teach')) { final.delete(conflict); }
      else { final.delete(section); }
    }
  }
  return final;
}

// ── 8. Dynamic quotas ────────────────────────────────────
const TASK_QUOTAS: Record<ObjectiveType, Record<string, number>> = {
  design:{domain:4,reasoning:4,tools:2,quality:2}, explain:{reasoning:4,domain:3,tools:1,quality:2},
  teach:{reasoning:5,domain:2,tools:1,quality:2}, debug:{tools:5,domain:3,reasoning:2,quality:3},
  generate:{domain:4,tools:3,reasoning:2,quality:3}, analyze:{reasoning:4,domain:3,tools:2,quality:3},
  compare:{reasoning:4,domain:3,tools:1,quality:2}, recommend:{reasoning:4,domain:2,tools:1,quality:2},
  plan:{reasoning:4,domain:3,tools:3,quality:3}, research:{tools:4,reasoning:3,domain:2,quality:2},
  transform:{domain:4,tools:3,reasoning:2,quality:2}, execute:{tools:4,domain:3,reasoning:2,quality:3},
  summarize:{reasoning:1,domain:1,tools:0,quality:1}, answer:{reasoning:2,domain:2,tools:1,quality:2},
};
const DEFAULT_QUOTAS: Record<string, number> = { domain:3, reasoning:3, tools:2, context:2, quality:3, advanced:2, behavior:4 };

function mergeQuotas(objs: ObjectiveNode[]): Record<string, number> {
  const m: Record<string, number> = { ...DEFAULT_QUOTAS };
  for (const o of objs) {
    const p = TASK_QUOTAS[o.type];
    if (!p) continue;
    for (const [k, v] of Object.entries(p)) m[k] = Math.max(m[k] || 0, v);
  }
  return m;
}

// ── 9. Token helpers ──────────────────────────────────────
export function estimatePromptTokens(prompt: string): number {
  return Math.ceil(prompt.split(/\s+/).length * 1.3);
}

function trimToBudget(
  sections: { title: string; content: string }[],
  protectedTitles: Set<string>,
  maxSystemTokens: number
): { title: string; content: string }[] {
  let cur = [...sections];
  let text = cur.map(s => `## ${s.title}\n${s.content}`).join('\n\n');
  while (estimatePromptTokens(text) > maxSystemTokens && cur.length > protectedTitles.size) {
    for (let i = cur.length - 1; i >= 0; i--) {
      if (!protectedTitles.has(cur[i].title)) { cur.splice(i, 1); break; }
    }
    text = cur.map(s => `## ${s.title}\n${s.content}`).join('\n\n');
  }
  return cur;
}

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

// ── 10. Policy & constraint application ──────────────────
function applyConstraintsAndPolicies(
  frame: IntentFrame,
  message: string,
  decisions: Map<string, SectionDecision>,
  utility: Map<string, number>
): void {
  const lower = message.toLowerCase();

  // Hard constraints → FORBIDDEN
  for (const c of frame.constraints) {
    if (c.type === 'no_code') {
      decisions.set('CODE GENERATION STANDARDS', { title: 'CODE GENERATION STANDARDS', class: 'FORBIDDEN', utility: -100, reasons: ['user: no code'] });
    } else if (c.type === 'no_web') {
      decisions.set('TOOL USAGE & EXTERNAL CAPABILITIES', { title: 'TOOL USAGE & EXTERNAL CAPABILITIES', class: 'FORBIDDEN', utility: -100, reasons: ['user: no web'] });
    } else if (c.type === 'no_diagram') {
      decisions.set('PROACTIVE DIAGRAMS', { title: 'PROACTIVE DIAGRAMS', class: 'FORBIDDEN', utility: -100, reasons: ['user: no diagram'] });
    } else if (c.type === 'no_explanation') {
      for (const t of ['ANALYTICAL REASONING & PROBLEM SOLVING', 'CRITICAL THINKING', 'ADVANCED COGNITIVE ENGINE']) {
        decisions.set(t, { title: t, class: 'FORBIDDEN', utility: -100, reasons: ['user: no explanation'] });
      }
    }
  }

  // Mandatory freshness/web policy
  if (frame.requiresCurrentInformation || frame.requiresEntityFreshness || frame.requiresWeb) {
    const sec = 'TOOL USAGE & EXTERNAL CAPABILITIES';
    if (!decisions.has(sec) || decisions.get(sec)!.class !== 'FORBIDDEN') {
      decisions.set(sec, { title: sec, class: 'MANDATORY', utility: 100, reasons: ['policy: freshness/web'] });
      utility.set(sec, Math.max(utility.get(sec) || 0, 10));
    }
  }

  // Security / auth / production
  if (frame.domains.includes('security') || (frame.codeDomain && /\b(production|deploy|infrastructure|authentication|oauth|jwt|csrf|xss)\b/i.test(lower))) {
    for (const s of ['SAFETY & BOUNDARIES', 'SELF‑REFLECTION & VERIFICATION']) {
      if (!decisions.has(s) || decisions.get(s)!.class !== 'FORBIDDEN') {
        decisions.set(s, { title: s, class: 'MANDATORY', utility: 100, reasons: ['policy: security'] });
        utility.set(s, Math.max(utility.get(s) || 0, 10));
      }
    }
  }

  // Debugging
  if (/\b(debug|error|broken|not working|crash|401|403|500|traceback|exception|bug)\b/i.test(lower)) {
    for (const s of ['DEBUGGING FRAMEWORK', 'SELF‑REFLECTION & VERIFICATION']) {
      if (!decisions.has(s) || decisions.get(s)!.class !== 'FORBIDDEN') {
        decisions.set(s, { title: s, class: 'MANDATORY', utility: 100, reasons: ['policy: debugging'] });
        utility.set(s, Math.max(utility.get(s) || 0, 10));
      }
    }
  }

  // Architecture / design
  if (frame.domains.includes('architecture') || /\b(architecture|system design|scalab|microservice|distributed|deploy|infrastructure)\b/i.test(lower)) {
    for (const s of ['ARCHITECTURE FRAMEWORK', 'DECISION FRAMEWORK', 'SELF‑REFLECTION & VERIFICATION']) {
      if (!decisions.has(s) || decisions.get(s)!.class !== 'FORBIDDEN') {
        decisions.set(s, { title: s, class: 'MANDATORY', utility: 100, reasons: ['policy: architecture'] });
        utility.set(s, Math.max(utility.get(s) || 0, 10));
      }
    }
  }
}

// ── 11. Main builder v5.3 (final) ────────────────────────
export function buildPrompt(
  tier: string,
  userMessage: string,
  extras: string[] = [],
  complexityOverride?: ComplexityLevel,
  maxTokens?: number
): string {
  const sections = getSections();
  const frame = parseMessage(userMessage);
  if (complexityOverride) frame.complexity = complexityOverride;

  // ── Initialize SectionDecisions ──
  const decisions = new Map<string, SectionDecision>();
  const utility = new Map<string, number>();
  const lower = userMessage.toLowerCase();

  // Mark core sections as MANDATORY
  for (const sec of sections) {
    if (isCoreSection(sec.title)) {
      decisions.set(sec.title, { title: sec.title, class: 'MANDATORY', utility: 200, reasons: ['core'] });
      utility.set(sec.title, 200);
    } else {
      decisions.set(sec.title, { title: sec.title, class: 'OPTIONAL', utility: 0, reasons: [] });
    }
  }

  // Apply hard constraints & mandatory policies
  applyConstraintsAndPolicies(frame, userMessage, decisions, utility);

  // Compute utility from signals
  for (const signal of BASE_SIGNALS) {
    if (signal.regex.test(lower)) {
      for (const { title, weight } of signal.sections) {
        const d = decisions.get(title);
        if (d && d.class !== 'FORBIDDEN') {
          utility.set(title, (utility.get(title) || 0) + weight);
        }
      }
    }
  }

  // Objective boosts
  for (const obj of frame.objectives) {
    if (obj.type === 'generate' && !frame.codeRequired) continue;
    const boost = OBJECTIVE_SECTION_BOOST[obj.type] || [];
    const mult = obj.explicit ? 2.5 : 1.5;
    for (const { title, weight } of boost) {
      const d = decisions.get(title);
      if (d && d.class !== 'FORBIDDEN') {
        utility.set(title, (utility.get(title) || 0) + weight * mult);
      }
    }
  }
  if (frame.codeRequired) {
    utility.set('CODE GENERATION STANDARDS', (utility.get('CODE GENERATION STANDARDS') || 0) + 5);
  }

  // Domain
  for (const domain of frame.domains) {
    for (const title of domainSectionMap[domain] || []) {
      const d = decisions.get(title);
      if (d && d.class !== 'FORBIDDEN') utility.set(title, (utility.get(title) || 0) + 2);
    }
  }

  // Behavioral
  if (frame.requiresReasoning) {
    utility.set('ANALYTICAL REASONING & PROBLEM SOLVING', (utility.get('ANALYTICAL REASONING & PROBLEM SOLVING') || 0) + 2);
    utility.set('CRITICAL THINKING', (utility.get('CRITICAL THINKING') || 0) + 2);
  }
  if (frame.requiresVerification) utility.set('SELF‑REFLECTION & VERIFICATION', (utility.get('SELF‑REFLECTION & VERIFICATION') || 0) + 3);
  if (frame.requiresWeb) utility.set('TOOL USAGE & EXTERNAL CAPABILITIES', (utility.get('TOOL USAGE & EXTERNAL CAPABILITIES') || 0) + 3);
  if (frame.requiresTools) utility.set('TOOL SELECTION POLICY', (utility.get('TOOL SELECTION POLICY') || 0) + 2);
  if (frame.requiresCitations) utility.set('TOOL USAGE & EXTERNAL CAPABILITIES', (utility.get('TOOL USAGE & EXTERNAL CAPABILITIES') || 0) + 2);
  if (frame.requiresMemory) utility.set('MEMORY SYSTEM', (utility.get('MEMORY SYSTEM') || 0) + 3);
  if (frame.requiresDiagram) {
    const d = decisions.get('PROACTIVE DIAGRAMS');
    if (d && d.class !== 'FORBIDDEN') utility.set('PROACTIVE DIAGRAMS', (utility.get('PROACTIVE DIAGRAMS') || 0) + 5);
  }

  // Response mode
  if (frame.responseModes.includes('concise')) utility.set('REDUNDANCY & TOKEN OPTIMISATION', (utility.get('REDUNDANCY & TOKEN OPTIMISATION') || 0) + 3);
  if (frame.responseModes.includes('educational')) utility.set('TEACHING FRAMEWORK', (utility.get('TEACHING FRAMEWORK') || 0) + 2);
  if (frame.responseModes.includes('structured')) utility.set('FORMATTING INTELLIGENCE', (utility.get('FORMATTING INTELLIGENCE') || 0) + 1);

  // Complexity bonus
  const cBonus: Record<ComplexityLevel, string[]> = {
    trivial:[], simple:[], moderate:['ADVANCED COGNITIVE ENGINE'],
    complex:['ADVANCED COGNITIVE ENGINE','DECISION FRAMEWORK'],
    critical:['ADVANCED COGNITIVE ENGINE','ARCHITECTURE FRAMEWORK','DECISION FRAMEWORK'],
  };
  for (const title of cBonus[frame.complexity]) {
    const d = decisions.get(title);
    if (d && d.class !== 'FORBIDDEN') utility.set(title, (utility.get(title) || 0) + 2);
  }

  // ── Classify every section ──
  const mandatorySet = new Set<string>();
  const forbiddenSet = new Set<string>();

  for (const sec of sections) {
    const d = decisions.get(sec.title)!;
    const u = utility.get(sec.title) || 0;

    if (d.class === 'MANDATORY' || d.class === 'FORBIDDEN') {
      // keep as-is
    } else if (u >= 6) {
      d.class = 'REQUIRED'; d.reasons.push('high utility');
    } else if (u >= 3) {
      d.class = 'RELEVANT'; d.reasons.push('moderate utility');
    } else {
      d.class = 'OPTIONAL';
    }

    d.utility = u;

    if (d.class === 'MANDATORY' || d.class === 'REQUIRED') mandatorySet.add(sec.title);
    if (d.class === 'FORBIDDEN') forbiddenSet.add(sec.title);
  }

  // ── Candidate set: MANDATORY + REQUIRED + RELEVANT (not FORBIDDEN) ──
  const candidates = new Set<string>();
  for (const sec of sections) {
    const d = decisions.get(sec.title)!;
    if (d.class === 'FORBIDDEN') continue;
    if (d.class === 'MANDATORY' || d.class === 'REQUIRED' || d.class === 'RELEVANT') {
      candidates.add(sec.title);
    }
  }

  // ── Expand dependencies (transitive closure) ──
  const allDeps = dependencyClosure(candidates);
  for (const dep of allDeps) {
    if (!forbiddenSet.has(dep)) {
      candidates.add(dep);
      const dd = decisions.get(dep);
      if (dd && dd.class !== 'MANDATORY' && dd.class !== 'FORBIDDEN') {
        dd.class = 'REQUIRED';
        dd.reasons.push('dependency');
        mandatorySet.add(dep);
      }
    }
  }

  // ── Protected titles (MANDATORY + REQUIRED) ──
  const protectedTitles = new Set(mandatorySet);
  for (const dep of allDeps) {
    if (!forbiddenSet.has(dep)) protectedTitles.add(dep);
  }

  // ── Compatibility ──
  const compatible = resolveConflicts(candidates, frame.responseModes, frame.objectives, protectedTitles);

  // ── Quotas ──
  const quotas = mergeQuotas(frame.objectives);
  const catCount: Record<string, number> = {};
  const finalSelection = new Set<string>();

  // Protected first (bypass quotas)
  for (const title of compatible) {
    if (protectedTitles.has(title)) {
      finalSelection.add(title);
      for (const cat of classifySection(title)) catCount[cat] = (catCount[cat] || 0) + 1;
    }
  }

  // Remaining sorted by utility
  const sorted = Array.from(compatible)
    .filter(t => !finalSelection.has(t))
    .sort((a, b) => (utility.get(b) || 0) - (utility.get(a) || 0));

  for (const title of sorted) {
    const cats = classifySection(title).filter(c => c !== 'core');
    let canAdd = true;
    for (const cat of cats) {
      const limit = quotas[cat] ?? DEFAULT_QUOTAS[cat] ?? 3;
      if ((catCount[cat] || 0) >= limit) { canAdd = false; break; }
    }
    if (canAdd) {
      finalSelection.add(title);
      for (const cat of cats) catCount[cat] = (catCount[cat] || 0) + 1;
    }
  }

  // Extras (force-include, unless forbidden)
  if (extras.length) {
    for (const t of extras) {
      if (!forbiddenSet.has(t)) finalSelection.add(t);
    }
  }

  let filteredSections = sections.filter(s => finalSelection.has(s.title));

  // ── Token trim ──
  const beforeTrim = filteredSections.map(s => s.title);
  if (maxTokens && maxTokens > 0) {
    const maxSys = Math.floor(maxTokens * 0.6);
    const protOnly = filteredSections.filter(s => protectedTitles.has(s.title));
    const protText = protOnly.map(s => `## ${s.title}\n${s.content}`).join('\n\n');
    const protTok = estimatePromptTokens(protText);
    if (protTok > maxSys) {
      console.warn(`⚠️ Protected sections (${protOnly.length}) exceed system token budget: ~${protTok} tokens > ${maxSys} max`);
    }
    filteredSections = trimToBudget(filteredSections, protectedTitles, maxSys);
  }
  const afterTrim = filteredSections.map(s => s.title);
  const trimmedTitles = beforeTrim.filter(t => !afterTrim.includes(t));

  const body = filteredSections.map(s => `## ${s.title}\n${s.content}`).join('\n\n');

  // ── Debug ── (derive classes directly from decisions)
  const mandatory = Array.from(decisions.values())
    .filter(d => d.class === 'MANDATORY')
    .map(d => d.title);
  const required = Array.from(decisions.values())
    .filter(d => d.class === 'REQUIRED')
    .map(d => d.title);
  const forbidden = Array.from(decisions.values())
    .filter(d => d.class === 'FORBIDDEN')
    .map(d => d.title);

  console.debug('[PromptCompiler v5.3 final]', {
    message: userMessage.slice(0, 100),
    primaryObjective: frame.primaryObjective,
    domains: frame.domains,
    codeDomain: frame.codeDomain,
    codeRequired: frame.codeRequired,
    requiresCurrentInformation: frame.requiresCurrentInformation,
    requiresEntityFreshness: frame.requiresEntityFreshness,
    requiresWeb: frame.requiresWeb,
    responseModes: frame.responseModes,
    complexity: frame.complexity,
    mandatory,
    required,
    forbidden,
    selected: afterTrim,
    trimmed: trimmedTitles,
    tokenEstimate: estimatePromptTokens(body),
  });

  return body;
}