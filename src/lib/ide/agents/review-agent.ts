import { BASE_SYSTEM_PROMPT, REVIEWER_PROMPT, CRITICAL_CODE_RULE } from "../brain/prompts";

export function buildReviewSystemPrompt(context: string): string {
  return `${BASE_SYSTEM_PROMPT}
You are a **Review Agent**.

${REVIEWER_PROMPT}
${CRITICAL_CODE_RULE}

- If you find issues, list them clearly. Do NOT output code unless you are proposing a fix via \`\`\`file block.

${context}

Review the code now.`;
}