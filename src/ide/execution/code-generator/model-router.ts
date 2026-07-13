/**
 * Intelligent Model Router
 * 
 * Dynamically selects the best model based on task characteristics,
 * context size, latency requirements, subscription tier, and provider health.
 */

import { ModelRegistry } from "./model-registry";
import type {
  ModelInfo,
  ModelRoutingRequest,
  ModelRoutingResult,
  ModelCapability,
  GenerationType,
} from "./types";

export class ModelRouter {
  private registry: ModelRegistry;

  constructor(registry: ModelRegistry) {
    this.registry = registry;
  }

  /**
   * Select the best model for a task
   */
  route(request: ModelRoutingRequest): ModelRoutingResult {
    const candidates = this.getCandidates(request);

    if (candidates.length === 0) {
      return {
        modelId: "llama-3.1-8b-instant",
        provider: "groq",
        reason: "Fallback to default model: no candidates matched",
        estimatedCost: 0,
        estimatedLatency: "fast",
      };
    }

    // Score each candidate
    const scored = candidates.map(model => ({
      model,
      score: this.scoreModel(model, request),
    }));

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    const best = scored[0];
    const fallback = best.model.fallbackModelId
      ? this.registry.get(best.model.fallbackModelId)
      : undefined;

    return {
      modelId: best.model.id,
      provider: best.model.provider,
      reason: this.buildReason(best.model, request, best.score),
      estimatedCost: this.estimateCost(best.model, request.contextSize),
      estimatedLatency: best.model.latencyProfile,
      fallbackModelId: fallback?.id,
    };
  }

  /**
   * Get candidate models for the request
   */
  private getCandidates(request: ModelRoutingRequest): ModelInfo[] {
    // Filter by subscription tier
    let candidates = this.registry.getBySubscription(request.subscription);

    // Filter by availability
    candidates = candidates.filter(model => this.registry.isAvailable(model.id));

    // Filter by context size
    candidates = candidates.filter(model => model.maxContextTokens >= request.contextSize);

    // Filter by required capabilities
    if (request.requiredCapabilities.length > 0) {
      candidates = candidates.filter(model =>
        request.requiredCapabilities.some(cap => model.capabilities.includes(cap))
      );
    }

    // Exclude embedding-only models for code generation
    if (this.isCodeGenerationTask(request.taskType)) {
      candidates = candidates.filter(model => !model.capabilities.includes("embedding"));
    }

    // Exclude safety-only models for generation
    candidates = candidates.filter(model => model.capabilities.length > 1 || !model.capabilities.includes("safety"));

    return candidates;
  }

  /**
   * Score a model for a request
   */
  private scoreModel(model: ModelInfo, request: ModelRoutingRequest): number {
    let score = 0;

    // Capability match (0-40)
    const requiredCapabilities = this.getRequiredCapabilities(request);
    const matchedCapabilities = requiredCapabilities.filter(cap => model.capabilities.includes(cap));
    score += (matchedCapabilities.length / Math.max(1, requiredCapabilities.length)) * 40;

    // Tier match (0-20)
    if (request.subscription === "free" && model.tier === "free") {
      score += 20;
    } else if (request.subscription === "paid" && model.tier !== "free") {
      score += 20;
    }

    // Latency match (0-15)
    if (request.latencyRequirement === "fast" && model.latencyProfile === "fast") {
      score += 15;
    } else if (request.latencyRequirement === "normal" && model.latencyProfile === "medium") {
      score += 12;
    } else if (request.latencyRequirement === "slow" && model.latencyProfile === "slow") {
      score += 10;
    }

    // Context efficiency (0-15) - prefer models that fit context well without over-provisioning
    const contextRatio = request.contextSize / model.maxContextTokens;
    if (contextRatio > 0 && contextRatio <= 1) {
      score += 15 * (1 - contextRatio);
    }

    // Provider health (0-10)
    const health = this.registry.getProviderHealth(model.provider);
    if (health === "healthy") score += 10;
    else if (health === "degraded") score += 3;

    // Cost efficiency (0-10)
    const cost = model.costPerInputToken * request.contextSize + model.costPerOutputToken * 1000;
    if (cost === 0) score += 10;
    else if (cost < 0.01) score += 8;
    else if (cost < 0.05) score += 5;
    else score += 2;

    // Streaming preference
    if (model.supportsStreaming) score += 5;

    // Penalty for previous failures
    if (request.previousFailures?.includes(model.id)) {
      score -= 30;
    }

    return score;
  }

  /**
   * Get required capabilities for a task
   */
  private getRequiredCapabilities(request: ModelRoutingRequest): ModelCapability[] {
    const taskCapabilities = this.mapTaskToCapabilities(request.taskType);
    const additional: ModelCapability[] = [];

    if (request.complexity === "high" || request.complexity === "enterprise") {
      additional.push("reasoning", "large_file_generation");
    }

    if (request.contextSize > 64000) {
      additional.push("large_file_generation", "repository_reasoning");
    }

    if (request.fileSize && request.fileSize > 10000) {
      additional.push("large_file_generation");
    }

    return [...new Set([...taskCapabilities, ...request.requiredCapabilities, ...additional])];
  }

  /**
   * Map task type to capabilities
   */
  private mapTaskToCapabilities(taskType: GenerationType): ModelCapability[] {
    const map: Record<GenerationType, ModelCapability[]> = {
      create_file: ["general_coding"],
      edit_file: ["general_coding", "multi_file_editing"],
      refactor: ["reasoning", "general_coding", "multi_file_editing"],
      fix_bug: ["debugging", "reasoning"],
      optimize: ["reasoning", "general_coding"],
      explain: ["repository_reasoning"],
      review: ["reasoning", "repository_reasoning"],
      generate_tests: ["general_coding", "debugging"],
      generate_docs: ["general_coding", "repository_reasoning"],
      generate_sql: ["general_coding"],
      generate_api: ["general_coding", "architecture"],
      generate_ui: ["general_coding", "large_file_generation"],
      generate_backend: ["general_coding", "architecture"],
      migrate_framework: ["architecture", "reasoning", "multi_file_editing"],
      rename_symbols: ["general_coding", "multi_file_editing"],
      extract_component: ["general_coding", "repository_reasoning"],
      extract_hook: ["general_coding", "repository_reasoning"],
      convert_language: ["general_coding", "multi_file_editing"],
      update_dependencies: ["general_coding", "architecture"],
    };

    return map[taskType] || ["general_coding"];
  }

  /**
   * Check if task is code generation
   */
  private isCodeGenerationTask(taskType: GenerationType): boolean {
    return [
      "create_file",
      "edit_file",
      "refactor",
      "fix_bug",
      "optimize",
      "generate_tests",
      "generate_docs",
      "generate_sql",
      "generate_api",
      "generate_ui",
      "generate_backend",
      "migrate_framework",
      "rename_symbols",
      "extract_component",
      "extract_hook",
      "convert_language",
      "update_dependencies",
    ].includes(taskType);
  }

  /**
   * Estimate cost for a model
   */
  private estimateCost(model: ModelInfo, contextSize: number): number {
    const outputTokens = model.maxOutputTokens * 0.3;
    return model.costPerInputToken * contextSize + model.costPerOutputToken * outputTokens;
  }

  /**
   * Build routing reason string
   */
  private buildReason(model: ModelInfo, request: ModelRoutingRequest, score: number): string {
    const parts = [
      `Selected ${model.name} for ${request.taskType}`,
      `Tier: ${model.tier}`,
      `Latency: ${model.latencyProfile}`,
      `Context: ${request.contextSize}/${model.maxContextTokens} tokens`,
      `Capabilities: ${model.capabilities.join(", ")}`,
      `Score: ${score.toFixed(1)}`,
    ];
    return parts.join(" | ");
  }

  /**
   * Get fallback model
   */
  getFallbackModel(modelId: string): ModelInfo | undefined {
    const model = this.registry.get(modelId);
    if (model?.fallbackModelId) {
      return this.registry.get(model.fallbackModelId);
    }
    return undefined;
  }

  /**
   * Mark model as failed
   */
  markModelFailed(modelId: string): void {
    const model = this.registry.get(modelId);
    if (model) {
      model.health = "degraded";
    }
  }
}
