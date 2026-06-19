import { getNextGroqKey } from "@/lib/scale";
import { setWorkspaceSummary, getWorkspaceSummary } from "./workspace-cache";

export async function analyzeProjectWithAI(
  files: Record<string, string>
): Promise<string> {
  const cached = getWorkspaceSummary();
  if (cached) return cached;

  const fileList = Object.keys(files).slice(0, 30).join("\n");
  const packageJson = files["package.json"] || "";
  const requirements = files["requirements.txt"] || "";

  const prompt = `Analyze this project and return a SHORT, user-friendly summary (no JSON). Format exactly like this:

## Project Overview
Framework: ...
Languages: ...
Key files: ...

## What I'll need to change (if relevant)
Files likely affected: ...

Project file list:
${fileList}

Package.json (if any):
${packageJson.slice(0, 300)}

Requirements.txt (if any):
${requirements.slice(0, 300)}`;

  const apiKey = getNextGroqKey();
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 300,
    }),
  });

  if (!res.ok) {
    console.error("AI project analysis failed:", await res.text());
    return "";
  }

  const data = await res.json();
  const raw = data.choices[0]?.message?.content || "";
  setWorkspaceSummary(raw);
  return raw;
}