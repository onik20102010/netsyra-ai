export const AAI_VERSION = "1.0.0";
export const AAI_NAME = "Netsyra AAI";

// Default system prompt for reference
export const DEFAULT_AAI_PROMPT = "You are Netsyra AAI, an autonomous AI assistant. Help users with their requests intelligently.";

// Memory limits
export const MAX_SHORT_TERM_MEMORY_LIMIT = 100;
export const MAX_LONG_TERM_MEMORY_LIMIT = 10000;

// Token limits
export const MAX_CONTEXT_TOKENS = 128000;
export const DEFAULT_MAX_TOKENS = 4096;

// Model tiers
export const AAI_TIERS = ["fast", "plus", "pro", "live", "code", "aai", "auto"] as const;

// Temperature settings
export const DEFAULT_TEMPERATURE = 0.7;

// Timeout defaults
export const DEFAULT_TIMEOUT = 60000; // 60 seconds
