// src/lib/perf-logger.ts

type PerfEntry = {
  endpoint: string;
  userId: string;
  modelTier: string;
  tokensUsed: number;
  durationMs: number;
  status: number;
  timestamp: string;
};

export function logPerformance(entry: PerfEntry): void {
  const emoji = entry.status >= 400 ? "🔴" : entry.status >= 300 ? "🟡" : "🟢";
  console.log(
    `${emoji} [${new Date(entry.timestamp).toISOString()}] ` +
      `${entry.endpoint} | user: ${entry.userId.slice(0, 8)}… | ` +
      `tier: ${entry.modelTier} | tokens: ${entry.tokensUsed} | ` +
      `${entry.durationMs}ms | status: ${entry.status}`
  );
}