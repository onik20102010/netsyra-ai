import { executeAgent } from "@/lib/ide/agents";
import { IDE_MODEL_CHAIN, IdeModelConfig } from "@/lib/ide/model-selector";

const swarmOrder = [
  "planner",
  "architect",
  "coder",
  "reviewer",
  "fixer",
];

export async function runSwarm(
  userMessage: string,
  context: string,
  chain: IdeModelConfig[]
): Promise<ReadableStream> {
  // For simplicity, we'll run a single call with a combined prompt that requests all steps sequentially.
  // In a full implementation, we'd chain multiple API calls, but that would be slower.
  // We'll use a master prompt that guides the model through all agents.

  const { buildMasterSwarmPrompt } = await import("./intelligence-pipeline");
  const systemPrompt = buildMasterSwarmPrompt(context);

  return await executeAgent(
    {
      agentType: "swarm",
      context,
      messages: [{ role: "user", content: userMessage }],
      mode: "agent",
      systemPromptOverride: systemPrompt,
    },
    chain
  );
}