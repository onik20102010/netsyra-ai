/**
 * Tool Cache
 * 
 * Caches safe tool outputs and manages invalidation.
 * Avoids repeated execution of read-only and expensive operations.
 */

import type { ToolExecutionRequest, ToolExecutionResult, ToolCacheEntry } from "./types";

export class ToolCache {
  private cache = new Map<string, ToolCacheEntry>();
  private defaultTtl = 300000; // 5 minutes

  /**
   * Generate a cache key for a tool execution request
   */
  generateKey(request: ToolExecutionRequest): string {
    return `${request.toolId}:${JSON.stringify(request.input)}:${request.workspaceId || ""}:${request.sessionId || ""}`;
  }

  /**
   * Get cached result if available and not expired
   */
  get(request: ToolExecutionRequest): ToolExecutionResult | undefined {
    const key = this.generateKey(request);
    const entry = this.cache.get(key);

    if (!entry) return undefined;

    const expired = Date.now() > entry.timestamp + entry.ttl;
    if (expired) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.result;
  }

  /**
   * Store result in cache
   */
  set(request: ToolExecutionRequest, result: ToolExecutionResult, ttl?: number, invalidatedBy: string[] = []): void {
    if (!result.success) return;

    const key = this.generateKey(request);
    const entry: ToolCacheEntry = {
      key,
      result,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTtl,
      invalidatedBy,
    };

    this.cache.set(key, entry);
  }

  /**
   * Invalidate cache entries affected by a file change
   */
  invalidateByPath(filePath: string): void {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.invalidatedBy.some(path => filePath.includes(path) || path.includes(filePath))) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Invalidate cache entries by tool ID
   */
  invalidateByTool(toolId: string): void {
    for (const [key] of this.cache.entries()) {
      if (key.startsWith(`${toolId}:`)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0, // Calculated externally
    };
  }
}
