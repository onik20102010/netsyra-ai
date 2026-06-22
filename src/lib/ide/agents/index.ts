// Self-contained streaming agent – no imports from chat route
async function streamOpenAICompatible(
  endpoint: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: { role: string; content: string }[],
  temperature: number,
  maxTokens: number,
  controller: ReadableStreamDefaultController
) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Streaming error: ${response.status} ${err}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") continue;

      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          controller.enqueue(new TextEncoder().encode(content));
        }
      } catch {}
    }
  }
}

export async function executeAgent(
  params: {
    agentType: string;
    context: any;
    messages: { role: string; content: string }[];
    mode: string;
    systemPromptOverride?: string;
    pipelineStages?: string[];
  },
  modelChain: any[]
) {
  const { context, messages, mode, systemPromptOverride } = params;
  const systemPrompt = systemPromptOverride || `You are an IDE agent in ${mode} mode.\n\n${context}`;

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      let success = false;

      for (const cfg of modelChain) {
        const apiKey = process.env[cfg.apiKeyEnv];
        if (!apiKey) {
          console.warn(`IDE: Missing key ${cfg.apiKeyEnv}, skipping ${cfg.model}`);
          continue;
        }

        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            await streamOpenAICompatible(
              cfg.endpoint,
              apiKey,
              cfg.model,
              systemPrompt,
              messages,
              0.2,
              4000,
              controller
            );
            success = true;
            break;
          } catch (err: any) {
            console.error(`IDE: ${cfg.model} attempt ${attempt + 1} failed – ${err.message}`);
            if (attempt === 0) await new Promise((r) => setTimeout(r, 500));
          }
        }
        if (success) break;
      }

      if (!success) {
        const errorMsg = "Sorry, all models are currently unavailable. Please try again later.";
        controller.enqueue(encoder.encode(errorMsg));
        controller.close();
      } else {
        controller.close();
      }
    },
  });
}