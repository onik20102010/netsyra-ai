import { tiers } from "./model-registry";

const CLASSIFIER_MODEL = "llama-3.1-8b-instant";
const COMBINER_TIER = "pro";

type SubTask = {
  intent: "fact" | "code" | "live" | "reason" | "compare";
  modelTier: "fast" | "plus" | "pro" | "live" | "code";
  prompt: string;
};

type SubTaskResult = {
  intent: string;
  modelTier: string;
  reply: string;
};

async function classifyQuery(
  userMessage: string,
  conversationHistory: string
): Promise<SubTask[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY missing for router");

  const prompt = `You are a query classifier. Break down the user message into sub‑tasks if it contains multiple intents. For each, choose the best Netsyra AI tier:

- fast: simple facts, greetings, short answers.
- plus: explanations, comparisons, how‑to.
- pro: complex reasoning, step‑by‑step, deep analysis.
- live: real‑time info, current events, news, prices, net worth today.
- code: programming, code generation, debugging.

Return a JSON array of objects: {"intent": "...", "modelTier": "...", "prompt": "..."}. If simple, return one element.

Conversation:
${conversationHistory}

User message: "${userMessage}"
Output ONLY JSON array.`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: CLASSIFIER_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 500,
    }),
  });

  if (!response.ok) throw new Error(`Classifier error: ${response.status}`);
  const data = await response.json();
  const raw = data.choices[0].message.content.trim();
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("No valid JSON from classifier");
  return JSON.parse(jsonMatch[0]);
}

async function executeSubTask(
  task: SubTask,
  conversationHistory: string,
  liveData: string
): Promise<string> {
  const tier = tiers[task.modelTier];
  if (!tier) throw new Error(`Invalid tier: ${task.modelTier}`);

  let systemPrompt = tier.systemPrompt;
  if (task.modelTier === "live" && liveData) {
    systemPrompt = `${systemPrompt}\n\nREAL-TIME DATA:\n${liveData}`;
  }

  const modelConfig = tier.models[0];
  const apiKey = process.env[modelConfig.apiKeyEnv];
  if (!apiKey) throw new Error(`Missing API key for ${modelConfig.modelName}`);

  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationHistory
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [role, ...rest] = line.split(": ");
        return { role, content: rest.join(": ") };
      }),
    { role: "user", content: task.prompt },
  ];

  if (modelConfig.provider === "openai") {
    const res = await fetch(modelConfig.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelConfig.modelName,
        messages,
        temperature: tier.temperature,
        max_tokens: tier.maxTokens,
      }),
    });
    if (!res.ok) throw new Error(`Sub‑task error: ${res.status}`);
    const data = await res.json();
    return data.choices[0].message.content;
  } else {
    // For Gemini, reuse existing callGemini function from route.ts (imported below)
    const { callGemini } = require("@/app/api/chat/route") as any;
    return await callGemini(
      modelConfig.endpoint,
      apiKey,
      modelConfig.modelName,
      systemPrompt,
      messages,
      tier.temperature,
      tier.maxTokens
    );
  }
}

async function combineResults(results: SubTaskResult[]): Promise<string> {
  const combinerPrompt = `Combine these sub‑task results into one cohesive Markdown answer. Preserve all facts and code.

${results.map((r, i) => `### Part ${i + 1} (${r.intent} via ${r.modelTier})\n${r.reply}`).join("\n\n")}`;

  const tier = tiers[COMBINER_TIER];
  const modelConfig = tier.models[0];
  const apiKey = process.env[modelConfig.apiKeyEnv];
  if (!apiKey) throw new Error("Missing API key for combiner");

  const res = await fetch(modelConfig.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelConfig.modelName,
      messages: [{ role: "system", content: tier.systemPrompt }, { role: "user", content: combinerPrompt }],
      temperature: 0.5,
      max_tokens: 3000,
    }),
  });
  if (!res.ok) throw new Error(`Combiner error: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

export async function autoRoute(
  userMessage: string,
  conversationHistory: string,
  liveData: string = ""
): Promise<{ reply: string; tiersUsed: string[] }> {
  const tasks = await classifyQuery(userMessage, conversationHistory);

  const results: SubTaskResult[] = await Promise.all(
    tasks.map(async (task) => {
      const reply = await executeSubTask(task, conversationHistory, liveData);
      return { intent: task.intent, modelTier: task.modelTier, reply };
    })
  );

  const finalReply = await combineResults(results);
  const tiersUsed = [...new Set(results.map((r) => r.modelTier))];
  return { reply: finalReply, tiersUsed };
}