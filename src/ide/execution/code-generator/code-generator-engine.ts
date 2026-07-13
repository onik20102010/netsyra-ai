/**
 * Code Generation Engine
 * 
 * The main orchestration layer for generating, editing, refactoring, debugging,
 * reviewing, and explaining code inside the IDE.
 */

import { ModelRegistry } from "./model-registry";
import { ModelRouter } from "./model-router";
import { ProviderRegistry } from "./providers/provider-registry";
import { PromptBuilder } from "./prompt-builder";
import { PatchGenerator } from "./patch-generator";
import { StreamHandler } from "./stream-handler";
import { VerificationService } from "./verification-service";
import type {
  CodeGenerationRequest,
  CodeGenerationResult,
  CodeGenerationStreamEvent,
  ModelRoutingResult,
  ProviderResponse,
  TokenUsage,
  VerificationStatus,
  GeneratedFileChange,
  ModelCapability,
} from "./types";

export class CodeGeneratorEngine {
  private modelRegistry: ModelRegistry;
  private modelRouter: ModelRouter;
  private providerRegistry: ProviderRegistry;
  private promptBuilder: PromptBuilder;
  private patchGenerator: PatchGenerator;
  private verificationService: VerificationService;

  constructor() {
    this.modelRegistry = new ModelRegistry();
    this.modelRouter = new ModelRouter(this.modelRegistry);
    this.providerRegistry = new ProviderRegistry();
    this.promptBuilder = new PromptBuilder();
    this.patchGenerator = new PatchGenerator();
    this.verificationService = new VerificationService();
  }

  /**
   * Generate code based on a request
   */
  async generate(request: CodeGenerationRequest): Promise<CodeGenerationResult> {
    const startTime = Date.now();
    const streamHandler = new StreamHandler(request);

    try {
      streamHandler.emitStage("understanding_request", { generationType: request.generationType });

      // Build context
      streamHandler.emitStage("collecting_context", {
        tokenCount: request.context.tokenCount,
        fileCount: request.context.relevantFiles.length,
      });

      // Select model
      const routing = this.selectModel(request);
      streamHandler.emitStage("selecting_model", {
        modelId: routing.modelId,
        provider: routing.provider,
        reason: routing.reason,
      });

      // Build prompt
      const { systemPrompt, userPrompt } = this.promptBuilder.build(request);
      const prompt = `${systemPrompt}\n\n${userPrompt}`;

      // Generate code
      streamHandler.emitStage("generating_code", { modelId: routing.modelId });

      const response = await this.callProvider(routing, prompt, request, streamHandler);

      if (response.error) {
        throw new Error(response.error);
      }

      // Parse generated content into file changes
      streamHandler.emitStage("verifying_output");

      const targetFiles = request.targetFiles || this.inferTargetFiles(request);
      let changes = this.patchGenerator.parseGeneratedContent(
        request.generationType,
        response.content,
        targetFiles
      );

      // Auto-repair minor issues
      changes = this.verificationService.autoRepair(changes);

      // Verify
      let verificationStatus = await this.verificationService.verify(changes);

      // If verification fails, try to fix
      if (verificationStatus.overall === "failed" && request.complexity !== "low") {
        streamHandler.emitStage("verifying_output", { attempt: "repair" });
        changes = this.verificationService.autoRepair(changes);
        verificationStatus = await this.verificationService.verify(changes);
      }

      // Apply verification status to changes
      for (const change of changes) {
        change.isVerified = verificationStatus.overall === "passed";
        if (!change.isVerified) {
          change.verificationErrors = verificationStatus.failed.filter(f => f.includes(change.path));
        }
      }

      streamHandler.emitStage("applying_edits", { fileCount: changes.length });
      streamHandler.emitStage("updating_workspace", { fileCount: changes.length });
      streamHandler.emitStage("completed", {
        fileCount: changes.length,
        modelId: routing.modelId,
      });

      streamHandler.emitTokenUsage(
        response.tokenUsage.promptTokens,
        response.tokenUsage.completionTokens,
        response.tokenUsage.cost
      );

      const endTime = Date.now();

      return {
        id: this.generateId(),
        requestId: request.id,
        taskId: request.taskId,
        success: true,
        status: verificationStatus.overall === "passed" ? "verified" : "completed",
        modelId: routing.modelId,
        provider: routing.provider,
        generationType: request.generationType,
        files: changes,
        explanation: this.extractExplanation(response.content),
        summary: this.generateSummary(request, changes, routing),
        tokenUsage: response.tokenUsage,
        duration: endTime - startTime,
        startTime,
        endTime,
        streamingEvents: streamHandler.getEvents().length,
        verificationStatus,
        metadata: {
          promptLength: prompt.length,
          contextFiles: request.context.relevantFiles.length,
          contextTokens: request.context.tokenCount,
          modelRoutingReason: routing.reason,
          strategy: this.getStrategyName(request.generationType),
          retries: 0,
        },
      };
    } catch (error) {
      streamHandler.emitError(error instanceof Error ? error.message : String(error), true);

      const endTime = Date.now();
      return {
        id: this.generateId(),
        requestId: request.id,
        taskId: request.taskId,
        success: false,
        status: "failed",
        modelId: "",
        provider: "groq",
        generationType: request.generationType,
        files: [],
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, cost: 0 },
        duration: endTime - startTime,
        startTime,
        endTime,
        streamingEvents: streamHandler.getEvents().length,
        verificationStatus: {
          checks: [],
          passed: [],
          failed: [],
          warnings: [],
          overall: "failed",
        },
        error: {
          code: "generation_failed",
          message: error instanceof Error ? error.message : String(error),
          recoverable: true,
        },
        metadata: {
          promptLength: 0,
          contextFiles: 0,
          contextTokens: 0,
          modelRoutingReason: "",
          strategy: this.getStrategyName(request.generationType),
          retries: 0,
        },
      };
    }
  }

  /**
   * Select the best model for a request
   */
  private selectModel(request: CodeGenerationRequest): ModelRoutingResult {
    const latencyRequirement = this.getLatencyRequirement(request.generationType);
    const tokenBudget = request.maxTokens || 12000;

    return this.modelRouter.route({
      taskType: request.generationType,
      projectSize: request.context.tokenCount,
      fileSize: request.existingCode?.length,
      contextSize: request.context.tokenCount,
      language: request.language,
      framework: request.framework,
      complexity: request.complexity,
      latencyRequirement,
      subscription: request.subscription,
      tokenBudget,
      requiredCapabilities: this.getRequiredCapabilities(request.generationType),
      previousFailures: [],
    });
  }

  /**
   * Call the selected provider
   */
  private async callProvider(
    routing: ModelRoutingResult,
    prompt: string,
    request: CodeGenerationRequest,
    streamHandler: StreamHandler
  ): Promise<ProviderResponse> {
    const options = {
      modelId: routing.modelId,
      prompt,
      systemPrompt: this.getSystemPromptFor(request.generationType),
      temperature: this.getTemperatureFor(request.generationType),
      maxTokens: request.maxTokens || this.getMaxTokensFor(request.generationType),
      streaming: request.streaming ?? true,
      topP: 0.9,
    };

    if (options.streaming && request.streaming) {
      const stream = this.providerRegistry.generateStream(routing.provider, options);
      let content = "";
      for await (const chunk of stream) {
        content += chunk.content;
        streamHandler.emitContentChunk(chunk.content, { finishReason: chunk.finishReason });
      }

      return {
        content,
        modelId: routing.modelId,
        provider: routing.provider,
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, cost: 0 },
        finishReason: "stop",
        duration: 0,
      };
    }

    return this.providerRegistry.generate(routing.provider, options);
  }

  /**
   * Infer target files from context
   */
  private inferTargetFiles(request: CodeGenerationRequest): string[] {
    const files = request.context.relevantFiles.map(f => f.name);
    return files.length > 0 ? files : ["generated.ts"];
  }

  /**
   * Extract plan/explanation from generated content
   */
  private extractExplanation(content: string): string | undefined {
    const planMatch = content.match(/<plan>([\s\S]*?)<\/plan>/i);
    if (planMatch) return planMatch[1].trim();

    const planLineMatch = content.match(/(?:Plan):\s*([\s\S]*?)(?:\n\n|\nFile:|$)/i);
    if (planLineMatch) return planLineMatch[1].trim();

    const explanationMatch = content.match(/(?:Explanation|Reasoning):\s*([\s\S]*?)(?:\n\n|\nFile:|$)/i);
    return explanationMatch ? explanationMatch[1].trim() : undefined;
  }

  /**
   * Generate summary
   */
  private generateSummary(request: CodeGenerationRequest, changes: GeneratedFileChange[], routing: ModelRoutingResult): string {
    return `Generated ${changes.length} file change(s) for ${request.generationType} using ${routing.modelId}`;
  }

  /**
   * Get latency requirement for generation type
   */
  private getLatencyRequirement(generationType: string): "fast" | "normal" | "slow" {
    if (["explain", "review", "generate_docs"].includes(generationType)) return "slow";
    if (["create_file", "edit_file", "refactor", "fix_bug"].includes(generationType)) return "normal";
    return "fast";
  }

  /**
   * Get required capabilities for generation type
   */
  private getRequiredCapabilities(generationType: string): ModelCapability[] {
    const map: Record<string, ModelCapability[]> = {
      create_file: ["general_coding"],
      edit_file: ["general_coding", "multi_file_editing"],
      refactor: ["reasoning", "multi_file_editing"],
      fix_bug: ["debugging", "reasoning"],
      optimize: ["reasoning"],
      explain: ["repository_reasoning"],
      review: ["reasoning"],
      generate_tests: ["general_coding"],
      generate_api: ["architecture"],
      generate_ui: ["large_file_generation"],
      generate_backend: ["architecture"],
      migrate_framework: ["architecture", "multi_file_editing"],
      convert_language: ["multi_file_editing"],
    };

    return map[generationType] || ["general_coding"];
  }

  /**
   * Get system prompt for generation type
   */
  private getSystemPromptFor(generationType: string): string {
    const prompts: Record<string, string> = {
      create_file: "You are an expert software engineer. Create complete, production-ready files.",
      edit_file: "You are an expert software engineer. Make surgical edits preserving existing code.",
      refactor: "You are an expert software engineer. Refactor code while preserving behavior.",
      fix_bug: "You are an expert software engineer. Identify and fix bugs with minimal changes.",
      optimize: "You are an expert software engineer. Optimize code for performance and readability.",
      explain: "You are an expert software engineer. Explain code clearly and concisely.",
      review: "You are an expert software engineer. Review code for quality, bugs, and improvements.",
      generate_tests: "You are an expert software engineer. Generate comprehensive tests.",
      generate_api: "You are an expert software engineer. Design and implement API endpoints.",
      generate_ui: "You are an expert software engineer. Implement UI components with best practices.",
      generate_backend: "You are an expert software engineer. Implement backend services.",
      migrate_framework: "You are an expert software engineer. Migrate code between frameworks.",
      convert_language: "You are an expert software engineer. Convert code between languages.",
    };

    return prompts[generationType] || "You are an expert software engineer.";
  }

  /**
   * Get temperature for generation type
   */
  private getTemperatureFor(generationType: string): number {
    if (["explain", "review", "generate_docs"].includes(generationType)) return 0.3;
    if (["create_file", "generate_tests", "generate_api"].includes(generationType)) return 0.2;
    return 0.1;
  }

  /**
   * Get max tokens for generation type
   */
  private getMaxTokensFor(generationType: string): number {
    if (["generate_ui", "generate_backend", "migrate_framework"].includes(generationType)) return 16000;
    if (["refactor", "convert_language"].includes(generationType)) return 12000;
    return 8000;
  }

  /**
   * Get strategy name for generation type
   */
  private getStrategyName(generationType: string): string {
    if (["create_file", "generate_tests", "generate_api"].includes(generationType)) return "create";
    if (["edit_file", "refactor", "fix_bug", "optimize"].includes(generationType)) return "edit";
    if (["explain", "review"].includes(generationType)) return "analyze";
    return "generate";
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get model registry
   */
  getModelRegistry(): ModelRegistry {
    return this.modelRegistry;
  }

  /**
   * Get provider registry
   */
  getProviderRegistry(): ProviderRegistry {
    return this.providerRegistry;
  }
}
