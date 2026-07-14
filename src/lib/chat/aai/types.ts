import { AAI_TIERS } from "./constants";

// Basic message type
export interface AAIRequest {
  userMessage: string;
  conversationHistory?: AAIMessage[];
  modelTier?: (typeof AAI_TIERS)[number];
  metadata?: Record<string, any>;
}

export interface AAIMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface AAIResponse {
  response: string;
  modelUsed: string;
  tierUsed: (typeof AAI_TIERS)[number];
  conversationId?: string;
  metadata?: Record<string, any>;
}

export interface ModelConfig {
  provider: string;
  modelName: string;
  apiKeyEnv: string;
  endpoint?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface WorkspaceState {
  conversationHistory: AAIMessage[];
  shortTermMemory: string[];
  longTermMemory: string[];
  currentGoal?: string;
}

export interface ExecutiveDecision {
  action: "respond" | "delegate" | "plan";
  modelTier?: (typeof AAI_TIERS)[number];
  reasoning: string;
}
