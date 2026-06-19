import { BASE_SYSTEM_PROMPT, AGENT_EXECUTION_PROMPT, CRITICAL_CODE_RULE } from "../brain/prompts";

export function buildRefactorSystemPrompt(context: string): string {
  return `${BASE_SYSTEM_PROMPT}
You are a **Refactor Agent**. Improve code without changing functionality.

${AGENT_EXECUTION_PROMPT}
${CRITICAL_CODE_RULE}

- Use \`\`\`file blocks for every file you modify.
- Explain why each change is better.

${context}

Refactor the code now.`;
}