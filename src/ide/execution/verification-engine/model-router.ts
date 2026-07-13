/**
 * Verification Model Router
 * 
 * Selects the best model for verification and self-correction tasks.
 */

import { ModelRegistry } from "@/ide/execution/code-generator/model-registry";
import type { ModelCapability } from "@/ide/execution/code-generator/types";
import type {
  VerificationModelRoutingRequest,
  VerificationModelRoutingResult,
} from "./types";

export class VerificationModelRouter {
  private modelRegistry: ModelRegistry;

  constructor(modelRegistry: ModelRegistry) {
    this.modelRegistry = modelRegistry;
  }

  /**
   * Route verification workload to best model
   */
  route(request: VerificationModelRoutingRequest): VerificationModelRoutingResult {
    const capabilities = this.getCapabilities(request.category, request.severity, request.complexity);

    const candidates = this.modelRegistry
      .getAll()
      .filter(model => model.tier === "free" || request.subscription === "paid")
      .filter(model => this.modelRegistry.isAvailable(model.id))
      .filter(model => capabilities.some(cap => model.capabilities.includes(cap as ModelCapability)))
      .filter(model => !model.capabilities.includes("embedding"));

    if (candidates.length === 0) {
      return {
        modelId: "llama-3.3-70b-versatile",
        provider: "groq",
        reason: "Fallback to general code review model",
      };
    }

    // Score candidates
    const scored = candidates.map(model => {
      let score = 0;

      // Capability match
      const matched = capabilities.filter(cap => model.capabilities.includes(cap as ModelCapability));
      score += (matched.length / capabilities.length) * 40;

      // Cost efficiency
      if (request.tokenBudget > 0) {
        const estimatedCost =
          model.costPerInputToken * request.tokenBudget + model.costPerOutputToken * 1000;
        if (estimatedCost === 0) score += 20;
        else if (estimatedCost < 0.01) score += 15;
        else if (estimatedCost < 0.05) score += 10;
        else score += 5;
      }

      // Complexity alignment
      if (request.complexity === "enterprise" && model.capabilities.includes("reasoning")) {
        score += 20;
      }
      if (request.complexity === "high" && model.capabilities.includes("repository_reasoning")) {
        score += 15;
      }

      // Latency preference for fast iterations
      if (request.category === "syntax" || request.category === "style") {
        if (model.latencyProfile === "fast") score += 10;
      }

      // Security priority
      if (request.category === "security" && model.capabilities.includes("safety")) {
        score += 20;
      }

      // Previous failures penalty
      if (request.previousFailures?.includes(model.id)) {
        score -= 30;
      }

      return { model, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const best = scored[0];

    return {
      modelId: best.model.id,
      provider: best.model.provider,
      reason: `Selected ${best.model.name} for ${request.category} verification with ${request.severity} severity`,
      fallbackModelId: best.model.fallbackModelId,
    };
  }

  /**
   * Get required capabilities for verification category
   */
  private getCapabilities(
    category: string,
    severity: string,
    complexity: string
  ): string[] {
    const map: Record<string, string[]> = {
      syntax: ["fast_chat", "general_coding"],
      type: ["general_coding", "reasoning"],
      import: ["general_coding", "repository_reasoning"],
      dependency: ["repository_reasoning", "architecture"],
      build: ["general_coding", "reasoning"],
      runtime: ["debugging", "reasoning"],
      security: ["safety", "reasoning"],
      architecture: ["architecture", "repository_reasoning"],
      performance: ["reasoning"],
      style: ["fast_chat", "general_coding"],
      test: ["general_coding", "debugging"],
      quality: ["reasoning", "repository_reasoning"],
      regression: ["repository_reasoning", "reasoning"],
      convention: ["general_coding", "repository_reasoning"],
    };

    const capabilities = map[category] || ["general_coding"];

    if (severity === "critical" || severity === "error") {
      capabilities.push("reasoning");
    }

    if (complexity === "high" || complexity === "enterprise") {
      capabilities.push("repository_reasoning", "architecture");
    }

    return [...new Set(capabilities)];
  }
}
