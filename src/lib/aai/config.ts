import { DEFAULT_TEMPERATURE, DEFAULT_MAX_TOKENS, DEFAULT_TIMEOUT } from "./constants";
import { tiers } from "../model-registry";

// Configuration for AAI runtime
export const AAI_CONFIG = {
  // Default settings
  defaults: {
    temperature: DEFAULT_TEMPERATURE,
    maxTokens: DEFAULT_MAX_TOKENS,
    timeout: DEFAULT_TIMEOUT,
    defaultTier: "pro" as const,
  },

  // Access to existing tier definitions
  getTierConfig: (tier: string) => {
    // Fallback to default tier if specified tier is invalid
    const validTiers = Object.keys(tiers);
    const targetTier = validTiers.includes(tier) ? tier : AAI_CONFIG.defaults.defaultTier;
    return tiers[targetTier as keyof typeof tiers];
  },

  // Enable/disable features
  features: {
    autoRouting: true,
    memorySystem: true,
    reflection: true,
  },
};

export default AAI_CONFIG;
