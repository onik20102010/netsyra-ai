/**
 * Mesh Provider
 * 
 * Provider implementation for Mesh API (subscription tier).
 */

import { BaseProvider } from "./base-provider";
import type {
  ProviderGenerateOptions,
  ProviderResponse,
  ProviderStreamChunk,
  RateLimitStatus,
  TokenUsage,
} from "../types";

export class MeshProvider extends BaseProvider {
  id = "mesh";
  provider = "mesh" as const;
  apiKey: string;
  endpoint = "https://api.mesh-ai.com/v1/chat/completions";

  constructor(apiKey = process.env.MESH_API_KEY || "") {
    super();
    this.apiKey = apiKey;
  }

  async generate(options: ProviderGenerateOptions): Promise<ProviderResponse> {
    if (!this.apiKey) {
      return this.createErrorResponse("Missing MESH_API_KEY");
    }

    const startTime = Date.now();

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: options.modelId,
          messages: options.messages || [
            { role: "system", content: options.systemPrompt || "You are a helpful coding assistant." },
            { role: "user", content: options.prompt },
          ],
          temperature: options.temperature,
          max_tokens: options.maxTokens,
          top_p: options.topP,
          stop: options.stopSequences,
          stream: false,
        }),
      });

      if (!response.ok) {
        return this.createErrorResponse(`Mesh API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      const usage = data.usage || {};

      const tokenUsage: TokenUsage = {
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0,
        cost: 0,
      };

      return {
        content,
        modelId: options.modelId,
        provider: "mesh",
        tokenUsage,
        finishReason: data.choices?.[0]?.finish_reason || "stop",
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error.message : String(error));
    }
  }

  async *generateStream(options: ProviderGenerateOptions): AsyncIterable<ProviderStreamChunk> {
    if (!this.apiKey) {
      yield { content: "", finishReason: "error" };
      return;
    }

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: options.modelId,
          messages: options.messages || [
            { role: "system", content: options.systemPrompt || "You are a helpful coding assistant." },
            { role: "user", content: options.prompt },
          ],
          temperature: options.temperature,
          max_tokens: options.maxTokens,
          top_p: options.topP,
          stop: options.stopSequences,
          stream: true,
        }),
      });

      if (!response.ok) {
        yield { content: "", finishReason: "error" };
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const data = trimmed.slice(6);
          if (data === "[DONE]") {
            yield { content: "", finishReason: "stop" };
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content || "";
            if (delta) {
              yield { content: delta };
            }
          } catch {
            // Ignore malformed JSON
          }
        }
      }
    } catch (error) {
      yield { content: "", finishReason: "error" };
    }
  }

  async healthCheck(): Promise<boolean> {
    return !!this.apiKey;
  }

  async getRateLimitStatus(): Promise<RateLimitStatus> {
    return {
      remaining: 1000,
      resetAt: Date.now() + 3600000,
      limit: 1000,
    };
  }

  private createErrorResponse(message: string): ProviderResponse {
    return {
      content: "",
      modelId: "",
      provider: "mesh",
      tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, cost: 0 },
      finishReason: "error",
      duration: 0,
      error: message,
    };
  }
}
