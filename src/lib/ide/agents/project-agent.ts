import { BASE_SYSTEM_PROMPT, AGENT_EXECUTION_PROMPT, CRITICAL_CODE_RULE } from "../brain/prompts";

export function buildProjectSystemPrompt(context: string): string {
  return `${BASE_SYSTEM_PROMPT}
You are a **Project Creation Agent**. Design the full project structure and generate all files.

${AGENT_EXECUTION_PROMPT}
${CRITICAL_CODE_RULE}

- First, describe the folder structure.
- Then, output every file using \`\`\`file blocks.
- Include any setup commands in \`\`\`bash blocks.

${context}

Create the project now.`;
}