import { Workspace } from "./workspace";
import { LLMRouter } from "../llm/router";
import { ExecutiveDecision, AAIRequest, AAIResponse, AAIMessage } from "../types";
import AAI_CONFIG from "../config";
import { MemoryManager } from "../memory/memory-manager";
import { Planner } from "../planner/planner";
import { ReasoningManager } from "../reasoning/manager";
import { ReasoningContext } from "../reasoning/types";
import { SYSTEM_PROMPT } from "@/lib/chat/model-registry";

/**
 * Executive: Makes high-level decisions and orchestrates AAI
 */
export class Executive {
  private workspace: Workspace;
  private llmRouter: LLMRouter;
  private tier: string;
  private memoryManager: MemoryManager;
  private planner: Planner;
  private reasoningManager: ReasoningManager;
  private userId: string;

  constructor(userId: string, initialTier?: string, initialWorkspace?: Workspace, conversationId?: string) {
    this.userId = userId;
    this.tier = initialTier || AAI_CONFIG.defaults.defaultTier;
    this.workspace = initialWorkspace || new Workspace();
    this.llmRouter = new LLMRouter(this.tier);
    this.memoryManager = new MemoryManager(userId, conversationId);
    this.planner = new Planner(userId);
    this.reasoningManager = new ReasoningManager(userId);
  }

  /**
   * Main processing method
   */
  async processRequest(request: AAIRequest): Promise<AAIResponse> {
    // Add user message to workspace
    const userMessage: AAIMessage = {
      id: Date.now().toString(),
      role: "user",
      content: request.userMessage,
      timestamp: Date.now(),
    };
    this.workspace.addMessage(userMessage);

    // Save user message to short-term memory
    await this.memoryManager.saveShortTerm({
      conversationId: request.metadata?.conversationId || "",
      content: `User: ${request.userMessage}`,
      messageId: userMessage.id,
    });

    // Step 1: Use Planner to analyze intent
    const plannerOutput = await this.planner.process({
      userId: this.userId,
      userMessage: request.userMessage,
      conversationId: request.metadata?.conversationId,
    });

    // Retrieve relevant context from memory
    const memoryContext = await this.memoryManager.retrieveRelevantContext(request.userMessage);

    // Step 2: Use Reasoning Manager to analyze
    const reasoningContext: ReasoningContext = {
      userId: this.userId,
      userMessage: request.userMessage,
      context: request,
      memory: memoryContext,
      workspace: this.workspace,
    };
    const reasoningResult = await this.reasoningManager.reason(reasoningContext);

    // Make decision on how to handle the request
    const decision = await this.makeDecision(request, plannerOutput.intentAnalysis.planningLevel);

    // Execute the decision
    let responseContent: string;
    let modelUsed: string;

    // Get appropriate tier config
    const targetTier = decision.modelTier || this.tier;
    this.llmRouter = new LLMRouter(targetTier);
    const tierConfig = AAI_CONFIG.getTierConfig(targetTier);

    // Build system prompt — all tiers use the same SYSTEM_PROMPT
    let finalSystemPrompt = SYSTEM_PROMPT;
    if (memoryContext) {
      finalSystemPrompt = `${memoryContext}\n\n${finalSystemPrompt}`;
    }
    if (reasoningResult) {
      finalSystemPrompt = `${finalSystemPrompt}\n\nReasoning Steps:\n${reasoningResult.steps.map(s => s.output).join("\n")}\n\nConfidence: ${reasoningResult.confidence.overall.toFixed(2)}`;
    }

    // If planner gave a direct response (level 0), use it as part of prompt
    if (plannerOutput.directResponse) {
      // Just proceed normally
    }

    const llmResult = await this.llmRouter.callLLM(
      finalSystemPrompt,
      request.userMessage,
      this.workspace.getHistoryForLLM().filter(m => m.role !== "system")
    );

    responseContent = llmResult.response;
    modelUsed = llmResult.modelUsed;

    // Add assistant response to workspace and memory
    const assistantMessage: AAIMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: responseContent,
      timestamp: Date.now(),
    };
    this.workspace.addMessage(assistantMessage);

    // Save assistant response to short-term memory
    await this.memoryManager.saveShortTerm({
      conversationId: request.metadata?.conversationId || "",
      content: `Assistant: ${responseContent}`,
      messageId: assistantMessage.id,
    });

    // Simple memory extraction (save facts for later)
    await this.extractAndSaveLongTermMemory(request.userMessage);

    // Return the response
    return {
      response: responseContent,
      modelUsed: modelUsed,
      tierUsed: targetTier as any,
      conversationId: request.metadata?.conversationId,
      metadata: {
        decisionReasoning: decision.reasoning,
        planningLevel: plannerOutput.intentAnalysis.planningLevel,
        intentType: plannerOutput.intentAnalysis.intentType,
        reasoningConfidence: reasoningResult.confidence.overall,
        reasoningSteps: reasoningResult.steps,
      },
    };
  }

  /**
   * Extract and save long-term memory from conversation
   */
  private async extractAndSaveLongTermMemory(userMsg: string): Promise<void> {
    const lowerUser = userMsg.toLowerCase();
    const memoryCandidates: string[] = [];

    // Look for facts like "My name is X", "I like Y"
    if (lowerUser.includes("my name is")) {
      const match = userMsg.match(/my name is ([a-zA-Z\s]+)/i);
      if (match) memoryCandidates.push(`User's name is ${match[1].trim()}`);
    }
    if (lowerUser.includes("i like")) {
      const match = userMsg.match(/i like ([a-zA-Z\s]+)/i);
      if (match) memoryCandidates.push(`User likes ${match[1].trim()}`);
    }
    if (lowerUser.includes("i prefer")) {
      const match = userMsg.match(/i prefer ([a-zA-Z\s]+)/i);
      if (match) memoryCandidates.push(`User prefers ${match[1].trim()}`);
    }
    if (lowerUser.includes("i work at")) {
      const match = userMsg.match(/i work at ([a-zA-Z\s]+)/i);
      if (match) memoryCandidates.push(`User works at ${match[1].trim()}`);
    }

    for (const candidate of memoryCandidates) {
      await this.memoryManager.saveLongTerm({
        category: "user-info",
        content: candidate,
        source: "conversation",
        importance: 0.8,
      });
    }
  }

  /**
   * Make decision on how to handle request
   */
  private async makeDecision(request: AAIRequest, planningLevel: number): Promise<ExecutiveDecision> {
    let modelTier = request.modelTier || this.tier;

    // If auto-routing is enabled, determine the best tier
    if (AAI_CONFIG.features.autoRouting && (!request.modelTier || request.modelTier === "auto")) {
      modelTier = await this.selectBestTier(request.userMessage);
    }

    let reasoning = "Selected appropriate model tier to respond directly to user request.";
    if (planningLevel > 0) {
      reasoning += ` Planning level ${planningLevel} detected.`;
    }

    return {
      action: "respond",
      modelTier: modelTier as any,
      reasoning,
    };
  }

  /**
   * Simple tier selection logic
   */
  private async selectBestTier(userMessage: string): Promise<string> {
    const lowerMessage = userMessage.toLowerCase();

    // Keyword-based routing
    if (lowerMessage.includes("code") || lowerMessage.includes("programming") ||
        lowerMessage.includes("function") || lowerMessage.includes("debug")) {
      return "code";
    }
    if (lowerMessage.includes("live") || lowerMessage.includes("current") ||
        lowerMessage.includes("today") || lowerMessage.includes("news")) {
      return "live";
    }
    if (lowerMessage.includes("explain") || lowerMessage.includes("detail") ||
        lowerMessage.includes("analysis")) {
      return "pro";
    }
    if (lowerMessage.length > 100) {
      return "plus";
    }
    return "fast";
  }

  /**
   * Get current workspace
   */
  getWorkspace(): Workspace {
    return this.workspace;
  }

  /**
   * Get memory manager
   */
  getMemoryManager(): MemoryManager {
    return this.memoryManager;
  }
}
