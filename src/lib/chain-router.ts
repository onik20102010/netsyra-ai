// src/lib/chain-router.ts
import { tiers } from "./model-registry";

interface ReasoningStep {
  prompt: string;
  modelTier: keyof typeof tiers;
}

export async function multiStepReason(
  userMessage: string,
  context: string
): Promise<{ reply: string; steps: string[] }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY missing for chain router");

  // Step 1 – let a cheap model break the task into reasoning steps
  const plannerPrompt = `You are a task planner. Given the user's message and conversation context, break it into 2‑5 sequential reasoning steps.
Each step should have a "prompt" (what to ask at that step) and a "modelTier" (which Netsyra tier to use: fast, plus, pro, live, code).

Return a JSON array of objects with "prompt" and "modelTier". Example:
[{"prompt":"Find flight options from Lahore to Tokyo","modelTier":"live"},{"prompt":"Suggest 3 hotels near Shibuya","modelTier":"plus"}]

Conversation context:
${context}

User message: "${userMessage}"
Output ONLY JSON array.`;

  const planRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: plannerPrompt }],
      temperature: 0,
      max_tokens: 500,
      response_format: { type: "json_object" },
    }),
  });

  if (!planRes.ok) throw new Error(`Planner error: ${planRes.status}`);
  const planData = await planRes.json();
  const steps: ReasoningStep[] = JSON.parse(planData.choices[0].message.content).steps || [];

  // Step 2 – execute each step in order, passing context forward
  const results: string[] = [];
  let accumulatedContext = context;

  for (const step of steps) {
    const tier = tiers[step.modelTier] || tiers.fast;
    const modelConfig = tier.models[0];
    const key = process.env[modelConfig.apiKeyEnv];
    if (!key) continue;

    const res = await fetch(modelConfig.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: modelConfig.modelName,
        messages: [
          { role: "system", content: tier.systemPrompt },
          { role: "user", content: `Context from previous steps:\n${accumulatedContext}\n\nNow answer this step: ${step.prompt}` },
        ],
        temperature: tier.temperature,
        max_tokens: tier.maxTokens,
      }),
    });

    if (!res.ok) continue;
    const data = await res.json();
    const stepReply = data.choices[0].message.content;
    results.push(stepReply);
    accumulatedContext += `\n\nStep: ${step.prompt}\nAnswer: ${stepReply}`;
  }

  // Step 3 – combine all step results into a final answer
  const combinerPrompt = `Combine the following step‑by‑step results into one cohesive answer.

${results.map((r, i) => `### Step ${i + 1}\n${r}`).join("\n\n")}

Final combined answer:`;

  const combinerConfig = tiers.pro.models[0];
  const combinerKey = process.env[combinerConfig.apiKeyEnv];
  if (!combinerKey) throw new Error("Missing combiner key");

  const finalRes = await fetch(combinerConfig.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${combinerKey}` },
    body: JSON.stringify({
      model: combinerConfig.modelName,
      messages: [
        { role: "system", content: tiers.pro.systemPrompt },
        { role: "user", content: combinerPrompt },
      ],
      temperature: 0.5,
      max_tokens: 2000,
    }),
  });

  if (!finalRes.ok) throw new Error(`Combiner error: ${finalRes.status}`);
  const finalData = await finalRes.json();
  return { reply: finalData.choices[0].message.content, steps: results };
}