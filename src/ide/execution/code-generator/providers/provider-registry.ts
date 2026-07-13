/**
 * Provider Registry
 * 
 * Manages provider instances and routes to the correct provider.
 */

import type { ModelProvider, ModelProviderClient, ProviderGenerateOptions, ProviderResponse, ProviderStreamChunk, RateLimitStatus } from "../types";
import { GroqProvider } from "./groq-provider";
import { MeshProvider } from "./mesh-provider";

export class ProviderRegistry {
  private providers = new Map<ModelProvider, ModelProviderClient>();

  constructor() {
    this.registerDefaultProviders();
  }

  /**
   * Register a provider
   */
  register(provider: ModelProviderClient): void {
    this.providers.set(provider.provider, provider);
  }

  /**
   * Get provider by name
   */
  get(provider: ModelProvider): ModelProviderClient | undefined {
    return this.providers.get(provider);
  }

  /**
   * Check if provider is available
   */
  has(provider: ModelProvider): boolean {
    return this.providers.has(provider);
  }

  /**
   * Generate with provider
   */
  async generate(provider: ModelProvider, options: ProviderGenerateOptions): Promise<ProviderResponse> {
    const client = this.get(provider);
    if (!client) {
      return {
        content: "",
        modelId: options.modelId,
        provider,
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, cost: 0 },
        finishReason: "error",
        duration: 0,
        error: `Provider ${provider} not registered`,
      };
    }

    return client.generate(options);
  }

  /**
   * Generate stream with provider
   */
  async *generateStream(provider: ModelProvider, options: ProviderGenerateOptions): AsyncIterable<ProviderStreamChunk> {
    const client = this.get(provider);
    if (!client?.generateStream) {
      yield { content: "", finishReason: "error" };
      return;
    }

    yield* client.generateStream(options);
  }

  /**
   * Check provider health
   */
  async healthCheck(provider: ModelProvider): Promise<boolean> {
    const client = this.get(provider);
    if (!client) return false;
    return client.healthCheck();
  }

  /**
   * Get rate limit status
   */
  async getRateLimitStatus(provider: ModelProvider): Promise<RateLimitStatus | undefined> {
    const client = this.get(provider);
    if (!client) return undefined;
    return client.getRateLimitStatus();
  }

  /**
   * Register default providers
   */
  private registerDefaultProviders(): void {
    this.register(new GroqProvider());
    this.register(new MeshProvider());
  }
}
