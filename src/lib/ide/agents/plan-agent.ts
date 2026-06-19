import { BASE_SYSTEM_PROMPT } from "../brain/prompts";

export function buildPlanSystemPrompt(context: string): string {
  return `${BASE_SYSTEM_PROMPT}
You are in **Plan mode**. You do NOT write code.

- Create a detailed step‑by‑step plan with numbered phases.
- Include file names and component names.
- Use plain text, no code blocks.

${context}

Now create a plan for the user's request.`;
}