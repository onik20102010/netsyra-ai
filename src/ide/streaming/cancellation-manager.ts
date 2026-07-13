/**
 * Cancellation & Retry Manager
 * 
 * Manages cancellation tokens and retry contexts for streaming runtime.
 */

import type { CancellationToken, RetryContext, RuntimeStage } from "./types";

export class CancellationManager {
  private tokens = new Map<string, CancellationToken>();
  private retries = new Map<string, RetryContext>();

  /**
   * Create a cancellation token
   */
  createToken(id: string): CancellationToken {
    const token: CancellationToken = { id, cancelled: false };
    this.tokens.set(id, token);
    return token;
  }

  /**
   * Cancel by token ID
   */
  cancel(id: string, reason?: string): boolean {
    const token = this.tokens.get(id);
    if (!token) return false;
    token.cancelled = true;
    token.reason = reason;
    token.cancelledAt = Date.now();
    return true;
  }

  /**
   * Cancel all tokens for a session
   */
  cancelSession(sessionId: string, reason?: string): void {
    for (const [id, token] of this.tokens.entries()) {
      if (id.startsWith(sessionId)) {
        token.cancelled = true;
        token.reason = reason;
        token.cancelledAt = Date.now();
      }
    }
  }

  /**
   * Check if cancelled
   */
  isCancelled(id: string): boolean {
    return this.tokens.get(id)?.cancelled || false;
  }

  /**
   * Get token
   */
  getToken(id: string): CancellationToken | undefined {
    return this.tokens.get(id);
  }

  /**
   * Create retry context
   */
  createRetryContext(
    id: string,
    failedStage: RuntimeStage,
    maxAttempts: number = 3,
    error?: string
  ): RetryContext {
    const retry: RetryContext = {
      attempt: 1,
      maxAttempts,
      failedStage,
      error,
      retryAt: Date.now(),
    };
    this.retries.set(id, retry);
    return retry;
  }

  /**
   * Increment retry attempt
   */
  incrementRetry(id: string): RetryContext | undefined {
    const retry = this.retries.get(id);
    if (!retry) return undefined;
    retry.attempt++;
    retry.retryAt = Date.now();
    return retry;
  }

  /**
   * Check if retries remain
   */
  hasRetriesRemaining(id: string): boolean {
    const retry = this.retries.get(id);
    return !!retry && retry.attempt < retry.maxAttempts;
  }

  /**
   * Get retry context
   */
  getRetry(id: string): RetryContext | undefined {
    return this.retries.get(id);
  }

  /**
   * Clean up completed tokens and retries
   */
  cleanup(): void {
    const cutoff = Date.now() - 3600000; // 1 hour
    for (const [id, token] of this.tokens.entries()) {
      if (token.cancelledAt && token.cancelledAt < cutoff) {
        this.tokens.delete(id);
      }
    }
  }
}
