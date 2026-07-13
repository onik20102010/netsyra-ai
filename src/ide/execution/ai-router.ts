/**
 * AI Router
 * 
 * A minimal production-safe AI model routing subsystem.
 * 
 * Responsibilities:
 * - register with the runtime kernel
 * - expose the required AI routing interface
 * - emit startup events
 * - integrate with the Event Bus
 * 
 * This is a runtime subsystem that satisfies the runtime contract.
 * The full model routing intelligence lives in the Code Generation Engine's
 * own router for now; this subsystem acts as the canonical runtime boundary
 * so that other subsystems can depend on it without circular imports.
 */

import { BaseSubsystem } from "@/ide/kernel/subsystem";
import type { RuntimeEvent } from "@/ide/types";
import { GlobalEventBus } from "@/ide/streaming";

export interface AIRouterRequest {
  task: string;
  prompt?: string;
  contextSize?: number;
  latencyRequirement?: "fast" | "balanced" | "quality";
  subscription?: "free" | "paid";
  requiredCapabilities?: string[];
}

export interface AIRouterResult {
  modelId: string;
  provider: string;
  reason: string;
}

export class AIRouter extends BaseSubsystem {
  private modelMap: Map<string, AIRouterResult> = new Map();

  constructor() {
    super({
      id: "ai-router",
      name: "AI Router",
      version: "1.0.0",
      capabilities: ["ai-routing", "model-selection", "provider-selection"],
      dependencies: ["workspace-engine", "knowledge-graph"],
    });

    // Default free-tier fallback
    this.modelMap.set("default", {
      modelId: "llama-3.3-70b-versatile",
      provider: "groq",
      reason: "default free-tier routing",
    });
  }

  async initialize(): Promise<void> {
    await super.initialize();
    this.emitStartupEvent();
  }

  async start(): Promise<void> {
    await super.start();
  }

  async stop(): Promise<void> {
    await super.stop();
  }

  /**
   * Route a request to the best model
   */
  async route(request: AIRouterRequest): Promise<AIRouterResult> {
    const key = this.buildKey(request);
    const cached = this.modelMap.get(key);
    if (cached) return cached;

    // Minimal routing: free tier vs paid tier
    if (request.subscription === "paid" || request.latencyRequirement === "quality") {
      return {
        modelId: "gpt-5.5",
        provider: "mesh",
        reason: "paid tier / quality routing",
      };
    }

    if (request.latencyRequirement === "fast") {
      return {
        modelId: "llama-3.1-8b-instant",
        provider: "groq",
        reason: "fast free-tier routing",
      };
    }

    return {
      modelId: "llama-3.3-70b-versatile",
      provider: "groq",
      reason: "default free-tier routing",
    };
  }

  /**
   * Accept workspace context
   */
  acceptWorkspaceContext(_context: Record<string, unknown>): void {
    // Integration point for future workspace-aware routing
  }

  /**
   * Build router context
   */
  buildContext(): Record<string, unknown> {
    return {
      availableModels: Array.from(this.modelMap.values()),
    };
  }

  /**
   * Update router context
   */
  updateContext(context: Record<string, unknown>): void {
    if (context.model) {
      const model = context.model as AIRouterResult;
      this.modelMap.set(model.modelId, model);
    }
  }

  /**
   * Clear cached routes
   */
  clear(): void {
    this.modelMap.clear();
  }

  /**
   * Handle runtime events
   */
  onEvent(event: RuntimeEvent): void {
    if (event.type === "workspace:context_updated") {
      this.acceptWorkspaceContext((event.payload as Record<string, unknown>) ?? {});
    }
  }

  /**
   * Emit startup event
   */
  private emitStartupEvent(): void {
    GlobalEventBus.publish({
      type: "ai-router:ready",
      category: "runtime",
      priority: "normal",
      source: "ai-router",
      payload: { status: "ready" },
      timestamp: Date.now(),
    });
  }

  private buildKey(request: AIRouterRequest): string {
    return `${request.task}:${request.latencyRequirement || "balanced"}:${request.subscription || "free"}`;
  }
}
