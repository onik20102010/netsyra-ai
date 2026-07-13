/**
 * Base Model Provider
 * 
 * Abstract base class for all AI model providers.
 */

import type {
  ModelProviderClient,
  ProviderGenerateOptions,
  ProviderResponse,
  ProviderStreamChunk,
  RateLimitStatus,
  ModelProvider,
} from "../types";

export abstract class BaseProvider implements ModelProviderClient {
  abstract id: string;
  abstract provider: ModelProvider;
  abstract apiKey?: string;

  abstract generate(options: ProviderGenerateOptions): Promise<ProviderResponse>;
  abstract generateStream?(options: ProviderGenerateOptions): AsyncIterable<ProviderStreamChunk>;
  abstract healthCheck(): Promise<boolean>;
  abstract getRateLimitStatus(): Promise<RateLimitStatus>;
}
