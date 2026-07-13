/**
 * Model Registry
 * 
 * Central registry for all AI models available to the Code Generation Engine.
 * Supports provider-agnostic model definitions and health tracking.
 */

import type { ModelInfo, ModelProvider, ModelTier, ModelCapability, RateLimitStatus } from "./types";

export class ModelRegistry {
  private models = new Map<string, ModelInfo>();
  private providerHealth = new Map<ModelProvider, "healthy" | "degraded" | "unhealthy">();
  private rateLimits = new Map<string, RateLimitStatus>();

  constructor() {
    this.registerDefaultModels();
    this.initializeProviderHealth();
  }

  /**
   * Register a model
   */
  register(model: ModelInfo): void {
    this.models.set(model.id, model);
  }

  /**
   * Get model by ID
   */
  get(modelId: string): ModelInfo | undefined {
    return this.models.get(modelId);
  }

  /**
   * Get all registered models
   */
  getAll(): ModelInfo[] {
    return Array.from(this.models.values());
  }

  /**
   * Get models by provider
   */
  getByProvider(provider: ModelProvider): ModelInfo[] {
    return this.getAll().filter(m => m.provider === provider);
  }

  /**
   * Get models by tier
   */
  getByTier(tier: ModelTier): ModelInfo[] {
    return this.getAll().filter(m => m.tier === tier);
  }

  /**
   * Get models by capability
   */
  getByCapability(capability: ModelCapability): ModelInfo[] {
    return this.getAll().filter(m => m.capabilities.includes(capability));
  }

  /**
   * Get models by subscription tier
   */
  getBySubscription(subscription: "free" | "paid"): ModelInfo[] {
    if (subscription === "free") {
      return this.getAll().filter(m => m.tier === "free");
    }
    return this.getAll().filter(m => m.tier !== "free");
  }

  /**
   * Update provider health
   */
  setProviderHealth(provider: ModelProvider, health: "healthy" | "degraded" | "unhealthy"): void {
    this.providerHealth.set(provider, health);
  }

  /**
   * Get provider health
   */
  getProviderHealth(provider: ModelProvider): "healthy" | "degraded" | "unhealthy" {
    return this.providerHealth.get(provider) || "healthy";
  }

  /**
   * Update rate limit status
   */
  setRateLimitStatus(modelId: string, status: RateLimitStatus): void {
    this.rateLimits.set(modelId, status);
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus(modelId: string): RateLimitStatus | undefined {
    return this.rateLimits.get(modelId);
  }

  /**
   * Check if a model is available
   */
  isAvailable(modelId: string): boolean {
    const model = this.get(modelId);
    if (!model) return false;

    if (model.health !== "healthy") return false;
    if (this.getProviderHealth(model.provider) === "unhealthy") return false;

    const rateLimit = this.getRateLimitStatus(modelId);
    if (rateLimit && rateLimit.remaining <= 0) return false;

    return true;
  }

  /**
   * Register default models for free and paid tiers
   */
  private registerDefaultModels(): void {
    // Free tier - Groq models
    this.register({
      id: "llama-3.1-8b-instant",
      name: "Llama 3.1 8B Instant",
      provider: "groq",
      tier: "free",
      capabilities: ["fast_chat", "general_coding"],
      maxContextTokens: 128000,
      maxOutputTokens: 8192,
      costPerInputToken: 0,
      costPerOutputToken: 0,
      latencyProfile: "fast",
      supportsStreaming: true,
      supportsFunctionCalling: false,
      supportsVision: false,
      health: "healthy",
      rateLimit: 1000,
      fallbackModelId: "llama-3.3-70b-versatile",
    });

    this.register({
      id: "llama-3.3-70b-versatile",
      name: "Llama 3.3 70B Versatile",
      provider: "groq",
      tier: "free",
      capabilities: ["general_coding", "debugging", "repository_reasoning"],
      maxContextTokens: 128000,
      maxOutputTokens: 32768,
      costPerInputToken: 0,
      costPerOutputToken: 0,
      latencyProfile: "medium",
      supportsStreaming: true,
      supportsFunctionCalling: false,
      supportsVision: false,
      health: "healthy",
      rateLimit: 500,
      fallbackModelId: "openai/gpt-oss-120b",
    });

    this.register({
      id: "openai/gpt-oss-120b",
      name: "GPT OSS 120B",
      provider: "groq",
      tier: "free",
      capabilities: ["large_file_generation", "architecture", "repository_reasoning"],
      maxContextTokens: 128000,
      maxOutputTokens: 32768,
      costPerInputToken: 0,
      costPerOutputToken: 0,
      latencyProfile: "slow",
      supportsStreaming: true,
      supportsFunctionCalling: false,
      supportsVision: false,
      health: "healthy",
      rateLimit: 100,
      fallbackModelId: "qwen/qwen3-32b",
    });

    this.register({
      id: "qwen/qwen3-32b",
      name: "Qwen3 32B",
      provider: "groq",
      tier: "free",
      capabilities: ["general_coding", "large_file_generation"],
      maxContextTokens: 128000,
      maxOutputTokens: 32768,
      costPerInputToken: 0,
      costPerOutputToken: 0,
      latencyProfile: "medium",
      supportsStreaming: true,
      supportsFunctionCalling: false,
      supportsVision: false,
      health: "healthy",
      rateLimit: 300,
      fallbackModelId: "qwen/qwen3.6-27b",
    });

    this.register({
      id: "qwen/qwen3.6-27b",
      name: "Qwen3.6 27B",
      provider: "groq",
      tier: "free",
      capabilities: ["general_coding", "debugging"],
      maxContextTokens: 128000,
      maxOutputTokens: 32768,
      costPerInputToken: 0,
      costPerOutputToken: 0,
      latencyProfile: "medium",
      supportsStreaming: true,
      supportsFunctionCalling: false,
      supportsVision: false,
      health: "healthy",
      rateLimit: 300,
      fallbackModelId: "llama-3.3-70b-versatile",
    });

    this.register({
      id: "groq/compound",
      name: "Groq Compound",
      provider: "groq",
      tier: "free",
      capabilities: ["repository_reasoning", "architecture", "debugging"],
      maxContextTokens: 128000,
      maxOutputTokens: 32768,
      costPerInputToken: 0,
      costPerOutputToken: 0,
      latencyProfile: "slow",
      supportsStreaming: true,
      supportsFunctionCalling: false,
      supportsVision: false,
      health: "healthy",
      rateLimit: 100,
      fallbackModelId: "groq/compound-mini",
    });

    this.register({
      id: "groq/compound-mini",
      name: "Groq Compound Mini",
      provider: "groq",
      tier: "free",
      capabilities: ["repository_reasoning", "fast_chat"],
      maxContextTokens: 128000,
      maxOutputTokens: 16384,
      costPerInputToken: 0,
      costPerOutputToken: 0,
      latencyProfile: "fast",
      supportsStreaming: true,
      supportsFunctionCalling: false,
      supportsVision: false,
      health: "healthy",
      rateLimit: 300,
      fallbackModelId: "llama-3.1-8b-instant",
    });

    this.register({
      id: "meta-llama/llama-4-scout-17b-16e-instruct",
      name: "Llama 4 Scout 17B",
      provider: "groq",
      tier: "free",
      capabilities: ["general_coding", "fast_chat"],
      maxContextTokens: 128000,
      maxOutputTokens: 32768,
      costPerInputToken: 0,
      costPerOutputToken: 0,
      latencyProfile: "fast",
      supportsStreaming: true,
      supportsFunctionCalling: false,
      supportsVision: false,
      health: "healthy",
      rateLimit: 500,
      fallbackModelId: "llama-3.3-70b-versatile",
    });

    this.register({
      id: "meta-llama/llama-prompt-guard-2-22m",
      name: "Prompt Guard 22M",
      provider: "groq",
      tier: "free",
      capabilities: ["safety"],
      maxContextTokens: 4096,
      maxOutputTokens: 1024,
      costPerInputToken: 0,
      costPerOutputToken: 0,
      latencyProfile: "fast",
      supportsStreaming: false,
      supportsFunctionCalling: false,
      supportsVision: false,
      health: "healthy",
      rateLimit: 10000,
    });

    this.register({
      id: "meta-llama/llama-prompt-guard-2-86m",
      name: "Prompt Guard 86M",
      provider: "groq",
      tier: "free",
      capabilities: ["safety"],
      maxContextTokens: 4096,
      maxOutputTokens: 1024,
      costPerInputToken: 0,
      costPerOutputToken: 0,
      latencyProfile: "fast",
      supportsStreaming: false,
      supportsFunctionCalling: false,
      supportsVision: false,
      health: "healthy",
      rateLimit: 10000,
    });

    // Paid tier - Mesh API models
    this.register({
      id: "gpt-5.5",
      name: "GPT 5.5",
      provider: "mesh",
      tier: "premium",
      capabilities: ["large_file_generation", "architecture", "repository_reasoning", "reasoning"],
      maxContextTokens: 256000,
      maxOutputTokens: 65536,
      costPerInputToken: 0.00005,
      costPerOutputToken: 0.00015,
      latencyProfile: "slow",
      supportsStreaming: true,
      supportsFunctionCalling: true,
      supportsVision: false,
      health: "healthy",
      rateLimit: 200,
      fallbackModelId: "claude-opus-4.8",
    });

    this.register({
      id: "gpt-5.3-codex",
      name: "GPT 5.3 Codex",
      provider: "mesh",
      tier: "premium",
      capabilities: ["large_file_generation", "general_coding", "debugging"],
      maxContextTokens: 128000,
      maxOutputTokens: 32768,
      costPerInputToken: 0.00003,
      costPerOutputToken: 0.00009,
      latencyProfile: "medium",
      supportsStreaming: true,
      supportsFunctionCalling: true,
      supportsVision: false,
      health: "healthy",
      rateLimit: 300,
      fallbackModelId: "gpt-5.5",
    });

    this.register({
      id: "claude-opus-4.8",
      name: "Claude Opus 4.8",
      provider: "mesh",
      tier: "premium",
      capabilities: ["architecture", "repository_reasoning", "reasoning", "large_file_generation"],
      maxContextTokens: 200000,
      maxOutputTokens: 40960,
      costPerInputToken: 0.000015,
      costPerOutputToken: 0.000075,
      latencyProfile: "slow",
      supportsStreaming: true,
      supportsFunctionCalling: true,
      supportsVision: false,
      health: "healthy",
      rateLimit: 200,
      fallbackModelId: "gemini-3-pro",
    });

    this.register({
      id: "gemini-3-pro",
      name: "Gemini 3 Pro",
      provider: "mesh",
      tier: "premium",
      capabilities: ["large_file_generation", "architecture", "repository_reasoning"],
      maxContextTokens: 1000000,
      maxOutputTokens: 8192,
      costPerInputToken: 0.000005,
      costPerOutputToken: 0.000015,
      latencyProfile: "medium",
      supportsStreaming: true,
      supportsFunctionCalling: true,
      supportsVision: true,
      health: "healthy",
      rateLimit: 300,
      fallbackModelId: "claude-opus-4.8",
    });

    this.register({
      id: "gemini-3.5-flash",
      name: "Gemini 3.5 Flash",
      provider: "mesh",
      tier: "paid",
      capabilities: ["fast_chat", "general_coding", "autocomplete"],
      maxContextTokens: 128000,
      maxOutputTokens: 8192,
      costPerInputToken: 0.0000005,
      costPerOutputToken: 0.0000015,
      latencyProfile: "fast",
      supportsStreaming: true,
      supportsFunctionCalling: true,
      supportsVision: true,
      health: "healthy",
      rateLimit: 1000,
      fallbackModelId: "claude-haiku-4.5",
    });

    this.register({
      id: "claude-haiku-4.5",
      name: "Claude Haiku 4.5",
      provider: "mesh",
      tier: "paid",
      capabilities: ["fast_chat", "general_coding", "autocomplete"],
      maxContextTokens: 200000,
      maxOutputTokens: 4096,
      costPerInputToken: 0.00000025,
      costPerOutputToken: 0.00000125,
      latencyProfile: "fast",
      supportsStreaming: true,
      supportsFunctionCalling: true,
      supportsVision: false,
      health: "healthy",
      rateLimit: 1000,
      fallbackModelId: "deepseek-v4-flash",
    });

    this.register({
      id: "deepseek-v4-flash",
      name: "DeepSeek V4 Flash",
      provider: "mesh",
      tier: "paid",
      capabilities: ["fast_chat", "general_coding"],
      maxContextTokens: 128000,
      maxOutputTokens: 8192,
      costPerInputToken: 0.0000003,
      costPerOutputToken: 0.000001,
      latencyProfile: "fast",
      supportsStreaming: true,
      supportsFunctionCalling: true,
      supportsVision: false,
      health: "healthy",
      rateLimit: 1000,
      fallbackModelId: "gemini-3.5-flash",
    });

    this.register({
      id: "deepseek-v4-pro",
      name: "DeepSeek V4 Pro",
      provider: "mesh",
      tier: "paid",
      capabilities: ["general_coding", "large_file_generation", "debugging"],
      maxContextTokens: 128000,
      maxOutputTokens: 32768,
      costPerInputToken: 0.000001,
      costPerOutputToken: 0.000003,
      latencyProfile: "medium",
      supportsStreaming: true,
      supportsFunctionCalling: true,
      supportsVision: false,
      health: "healthy",
      rateLimit: 500,
      fallbackModelId: "glm-5.2",
    });

    this.register({
      id: "glm-5.2",
      name: "GLM 5.2",
      provider: "mesh",
      tier: "paid",
      capabilities: ["general_coding", "large_file_generation"],
      maxContextTokens: 128000,
      maxOutputTokens: 8192,
      costPerInputToken: 0.000001,
      costPerOutputToken: 0.000002,
      latencyProfile: "medium",
      supportsStreaming: true,
      supportsFunctionCalling: true,
      supportsVision: false,
      health: "healthy",
      rateLimit: 500,
      fallbackModelId: "deepseek-v4-pro",
    });

    this.register({
      id: "claude-sonnet",
      name: "Claude Sonnet",
      provider: "mesh",
      tier: "paid",
      capabilities: ["reasoning", "debugging", "architecture", "multi_file_editing"],
      maxContextTokens: 200000,
      maxOutputTokens: 16384,
      costPerInputToken: 0.000003,
      costPerOutputToken: 0.000015,
      latencyProfile: "medium",
      supportsStreaming: true,
      supportsFunctionCalling: true,
      supportsVision: false,
      health: "healthy",
      rateLimit: 500,
      fallbackModelId: "deepseek-r1",
    });

    this.register({
      id: "deepseek-r1",
      name: "DeepSeek R1",
      provider: "mesh",
      tier: "paid",
      capabilities: ["reasoning", "debugging", "architecture"],
      maxContextTokens: 128000,
      maxOutputTokens: 32768,
      costPerInputToken: 0.0000015,
      costPerOutputToken: 0.000005,
      latencyProfile: "slow",
      supportsStreaming: true,
      supportsFunctionCalling: true,
      supportsVision: false,
      health: "healthy",
      rateLimit: 300,
      fallbackModelId: "claude-sonnet",
    });

    this.register({
      id: "deepseek-v3",
      name: "DeepSeek V3",
      provider: "mesh",
      tier: "paid",
      capabilities: ["reasoning", "general_coding", "debugging"],
      maxContextTokens: 128000,
      maxOutputTokens: 32768,
      costPerInputToken: 0.0000015,
      costPerOutputToken: 0.000005,
      latencyProfile: "medium",
      supportsStreaming: true,
      supportsFunctionCalling: true,
      supportsVision: false,
      health: "healthy",
      rateLimit: 500,
      fallbackModelId: "claude-sonnet",
    });

    this.register({
      id: "gpt-4o",
      name: "GPT-4o",
      provider: "mesh",
      tier: "paid",
      capabilities: ["reasoning", "general_coding", "debugging", "multi_file_editing"],
      maxContextTokens: 128000,
      maxOutputTokens: 16384,
      costPerInputToken: 0.0000025,
      costPerOutputToken: 0.00001,
      latencyProfile: "medium",
      supportsStreaming: true,
      supportsFunctionCalling: true,
      supportsVision: true,
      health: "healthy",
      rateLimit: 500,
      fallbackModelId: "claude-sonnet",
    });

    // Embedding models
    this.register({
      id: "text-embedding-3-large",
      name: "text-embedding-3-large",
      provider: "mesh",
      tier: "paid",
      capabilities: ["embedding"],
      maxContextTokens: 8191,
      maxOutputTokens: 1536,
      costPerInputToken: 0.00000013,
      costPerOutputToken: 0,
      latencyProfile: "fast",
      supportsStreaming: false,
      supportsFunctionCalling: false,
      supportsVision: false,
      health: "healthy",
      rateLimit: 10000,
    });

    this.register({
      id: "bge-large-en-v1.5",
      name: "bge-large-en-v1.5",
      provider: "mesh",
      tier: "paid",
      capabilities: ["embedding"],
      maxContextTokens: 512,
      maxOutputTokens: 1024,
      costPerInputToken: 0.0000001,
      costPerOutputToken: 0,
      latencyProfile: "fast",
      supportsStreaming: false,
      supportsFunctionCalling: false,
      supportsVision: false,
      health: "healthy",
      rateLimit: 10000,
    });
  }

  private initializeProviderHealth(): void {
    const providers: ModelProvider[] = ["groq", "mesh", "openai", "anthropic", "google", "custom"];
    for (const provider of providers) {
      this.providerHealth.set(provider, "healthy");
    }
  }
}
