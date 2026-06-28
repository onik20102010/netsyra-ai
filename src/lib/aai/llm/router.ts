import { ModelConfig } from "../types";
import AAI_CONFIG from "../config";

/**
 * LLM Router: Routes requests to appropriate LLM providers
 */
export class LLMRouter {
  private tier: string;

  constructor(tier: string = AAI_CONFIG.defaults.defaultTier) {
    this.tier = tier;
  }

  /**
   * Call the appropriate LLM based on configuration
   */
  async callLLM(
    systemPrompt: string,
    userMessage: string,
    conversationHistory: { role: string; content: string }[] = []
  ): Promise<{ response: string; modelUsed: string }> {
    const tierConfig = AAI_CONFIG.getTierConfig(this.tier);

    // Build message array
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: userMessage },
    ];

    // Try each model in the tier until one works
    for (const modelConfig of tierConfig.models) {
      try {
        const apiKey = process.env[modelConfig.apiKeyEnv];
        
        if (!apiKey) {
          console.warn(`Skipping model ${modelConfig.modelName}: missing API key env var ${modelConfig.apiKeyEnv}`);
          continue;
        }

        let response: string;
        if (modelConfig.provider === "openai") {
          response = await this.callOpenAICompatible(
            modelConfig.endpoint!,
            apiKey,
            modelConfig.modelName,
            messages,
            tierConfig.temperature,
            tierConfig.maxTokens
          );
        } else if (modelConfig.provider === "gemini") {
          response = await this.callGemini(
            modelConfig.endpoint!,
            apiKey,
            modelConfig.modelName,
            systemPrompt,
            messages,
            tierConfig.temperature,
            tierConfig.maxTokens
          );
        } else {
          throw new Error(`Unsupported provider: ${modelConfig.provider}`);
        }

        return { response, modelUsed: modelConfig.modelName };
      } catch (error) {
        console.error(`Model ${modelConfig.modelName} failed:`, error);
      }
    }

    throw new Error("All models failed to respond.");
  }

  /**
   * Call OpenAI compatible endpoint (Groq, Cerebras, etc.)
   */
  private async callOpenAICompatible(
    endpoint: string,
    apiKey: string,
    modelName: string,
    messages: { role: string; content: string }[],
    temperature: number,
    maxTokens: number
  ): Promise<string> {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI compatible API failed: ${response.status} - ${errorBody}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Call Google Gemini API
   */
  private async callGemini(
    endpoint: string,
    apiKey: string,
    modelName: string,
    systemPrompt: string,
    messages: { role: string; content: string }[],
    temperature: number,
    maxTokens: number
  ): Promise<string> {
    const contents = messages
      .filter(msg => msg.role !== "system")
      .map(msg => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

    const payload: any = {
      contents,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    };

    if (systemPrompt) {
      payload.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    const url = `${endpoint}?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini API failed: ${response.status} - ${errorBody}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }
}
