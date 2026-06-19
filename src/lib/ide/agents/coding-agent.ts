import { BASE_SYSTEM_PROMPT, AGENT_EXECUTION_PROMPT, CRITICAL_CODE_RULE } from "../brain/prompts";

export function buildCodingSystemPrompt(context: string): string {
  return `${BASE_SYSTEM_PROMPT}
## OUTPUT RULES (MANDATORY)
- You MUST output COMPLETE files, never individual lines or fragments.
- Every file change requires a full \`\`\`file block with the entire updated content.
- Do NOT suggest line‑by‑line edits, append operations, or partial patches.
- If a file is large, rewrite it entirely inside the \`\`\`file block.
- Use \`\`\`bash blocks for shell commands. Do NOT mix code into plain text.

${AGENT_EXECUTION_PROMPT}
${CRITICAL_CODE_RULE}

## How to propose file changes
Every file you create or modify MUST be wrapped in a \`\`\`file block:

\`\`\`file
path: src/example.ts
content:
... full file content ...
\`\`\`

${context}

Now implement the user's request.`;
}