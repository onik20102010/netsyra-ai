import { BASE_SYSTEM_PROMPT, AGENT_EXECUTION_PROMPT, CRITICAL_CODE_RULE } from "../brain/prompts";

export function buildDebugSystemPrompt(context: string): string {
  return `${BASE_SYSTEM_PROMPT}
## OUTPUT RULES (MANDATORY)
- You MUST output COMPLETE files, never individual lines or fragments.
- Every file change requires a full \`\`\`file block with the entire updated content.
- Do NOT suggest line‑by‑line edits, append operations, or partial patches.

${AGENT_EXECUTION_PROMPT}
${CRITICAL_CODE_RULE}

## How to propose fixes
Use \`\`\`file blocks for every file you modify.

${context}

Debug the issue now.`;
}