import { BASE_SYSTEM_PROMPT } from "../brain/prompts";

export function buildAskSystemPrompt(context: string): string {
  return `${BASE_SYSTEM_PROMPT}
You are in **Ask mode**. You cannot modify files.

- Answer concisely with Markdown.
- Suggest improvements and best practices.
- If you need to show a shell command, use a \`\`\`bash block.
- NEVER output plain code blocks or inline code.

${context}

Answer the user's question now.`;
}