import { BASE_SYSTEM_PROMPT, AGENT_EXECUTION_PROMPT, REVIEWER_PROMPT, CRITICAL_CODE_RULE } from "./prompts";

export const MASTER_PIPELINE_STAGES = [
  "intent_analysis",
  "requirement_extraction",
  "complexity_analysis",
  "architecture_design",
  "planning",
  "context_building",
  "tool_selection",
  "code_generation",
  "review",
  "security_audit",
  "optimization",
] as const;

export type PipelineStage = typeof MASTER_PIPELINE_STAGES[number];

export function getStageLabel(stage: PipelineStage): string {
  const labels: Record<PipelineStage, string> = {
    intent_analysis: "Analyzing Intent",
    requirement_extraction: "Extracting Requirements",
    complexity_analysis: "Analyzing Complexity",
    architecture_design: "Designing Architecture",
    planning: "Building Implementation Plan",
    context_building: "Gathering Context",
    tool_selection: "Selecting Tools",
    code_generation: "Generating Code",
    review: "Reviewing Output",
    security_audit: "Running Security Audit",
    optimization: "Optimizing Code",
  };
  return labels[stage];
}

export function buildMasterSystemPrompt(context: string): string {
  return `${BASE_SYSTEM_PROMPT}

## Specification‑Driven Development Process
Follow these stages and output each section with the exact headings (## Section Name).

## Project Analysis
- Goal: [1 sentence]
- Detected Requirements: [list]
- Scope: small / medium / large

## Architecture Decision
- Frontend: [framework]
- Backend: [approach]
- Database: [if any]
- Key libraries: [list]

## Implementation Plan
- Numbered phases, each with actions and files.

## Files To Create / Modify
${CRITICAL_CODE_RULE}

For each file, use the \`\`\`file block exactly as follows:
\`\`\`file
path: src/example.ts
content:
... complete file content ...
\`\`\`

## Review
${REVIEWER_PROMPT}

## Security Audit
- Note any security concerns.

## Optimization Suggestions
- Performance, bundle size, or query improvements.

${context}

Now follow this process for the user's request.`;
}

export function buildMasterSwarmPrompt(context: string): string {
  return `${BASE_SYSTEM_PROMPT}

You are simulating a swarm of specialized agents. Output each agent's result under its own heading: ## Planner, ## Architect, ## Coding, ## Review, ## Fixer.

1. **Planner Agent**: Break the task into sub‑tasks.
2. **Architect Agent**: Decide the tech stack and file structure.
3. **Coding Agent**: ${AGENT_EXECUTION_PROMPT}
   ${CRITICAL_CODE_RULE}
   Use \`\`\`file blocks for every file.
4. **Review Agent**: ${REVIEWER_PROMPT}
5. **Fixer Agent**: Apply any corrections from the review.

${context}`;
}