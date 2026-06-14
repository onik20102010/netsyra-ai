// src/lib/errors.ts

export type ErrorCode =
  | "rate_limited"
  | "auth_required"
  | "model_unavailable"
  | "token_limit"
  | "network_error"
  | "content_filtered"
  | "unknown";

export function classifyError(error: any): { code: ErrorCode; message: string } {
  const msg = (error?.message || String(error)).toLowerCase();

  if (msg.includes("rate limit") || msg.includes("429") || msg.includes("too many requests")) {
    return {
      code: "rate_limited",
      message: "You're sending messages too quickly. Please wait a few seconds and try again.",
    };
  }

  if (msg.includes("unauthorized") || msg.includes("401") || msg.includes("jwt")) {
    return {
      code: "auth_required",
      message: "Your session has expired. Please sign in again.",
    };
  }

  if (msg.includes("503") || msg.includes("over capacity") || msg.includes("unavailable")) {
    return {
      code: "model_unavailable",
      message: "The AI service is temporarily busy. Please try again in a moment.",
    };
  }

  if (msg.includes("413") || msg.includes("too large") || msg.includes("token limit")) {
    return {
      code: "token_limit",
      message: "Your message is too long. Please shorten it and try again.",
    };
  }

  if (msg.includes("connect timeout") || msg.includes("fetch failed") || msg.includes("network")) {
    return {
      code: "network_error",
      message: "Could not reach the AI service. Please check your internet connection.",
    };
  }

  if (msg.includes("content filter") || msg.includes("harmful") || msg.includes("flagged")) {
    return {
      code: "content_filtered",
      message: "Your message was flagged as potentially harmful. Please rephrase and try again.",
    };
  }

  return {
    code: "unknown",
    message: "Something went wrong. Please try again.",
  };
}