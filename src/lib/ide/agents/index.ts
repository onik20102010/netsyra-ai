import { streamOpenAICompatible } from "@/app/api/chat/route";
import { IdeModelConfig } from "@/lib/ide/model-selector";

export async function executeAgent(
  params: {
    agentType: string;
    context: any;
    messages: { role: string; content: string }[];
    mode: string;
    systemPromptOverride?: string;   // new optional parameter
    pipelineStages?: string[];       // ← added
  },
  modelChain: IdeModelConfig[]
) {
  const { agentType, context, messages, mode, systemPromptOverride } = params;
  const systemPrompt = systemPromptOverride || `You are an IDE agent in ${mode} mode. Help with coding tasks.\n\nCurrent context: ${JSON.stringify(context)}`;

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
            console.log(`IDE: Trying ${cfg.model} (attempt ${attempt + 1}/2)`);
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
            console.log(`IDE: Succeeded with ${cfg.model}`);
            break;
          } catch (err: any) {
            console.error(`IDE: ${cfg.model} attempt ${attempt + 1} failed – ${err.message}`);
            if (attempt === 0) await new Promise((r) => setTimeout(r, 1000)); // wait 1s before retry
          }
        }
        if (success) break;
      }

      if (!success) {
        // Send a graceful error message to the client instead of crashing
        const errorMsg = "Sorry, all models are currently unavailable. Please try again later.";
        controller.enqueue(encoder.encode(errorMsg));
        controller.close();
      } else {
        controller.close();
      }
    },
  });
}