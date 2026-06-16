import { streamOpenAICompatible } from "@/app/api/chat/route"; // Reuse existing stream helper
import { getNextGroqKey } from "@/lib/scale";

export async function chatAgent({
  systemPrompt,
  messages,
  modelConfig,
}: {
  systemPrompt: string;
  messages: { role: string; content: string }[];
  modelConfig: { endpoint: string; apiKey: string; modelName: string; temperature: number; maxTokens: number };
}) {
  // Build final messages array
  const finalMessages = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        await streamOpenAICompatible(
          modelConfig.endpoint,
          modelConfig.apiKey,
          modelConfig.modelName,
          systemPrompt,
          messages,
          modelConfig.temperature,
          modelConfig.maxTokens,
          controller
        );
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return stream;
}