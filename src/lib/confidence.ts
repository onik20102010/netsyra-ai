// src/lib/confidence.ts
export function scoreConfidence(reply: string): number {
  const lowConfidencePhrases = [
    "i don't know", "i'm not sure", "i cannot", "i do not have",
    "no information", "unable to", "i can't",
  ];
  const lower = reply.toLowerCase();
  if (reply.length < 30) return 0.3;
  if (lowConfidencePhrases.some(p => lower.includes(p))) return 0.4;
  if (reply.length > 200) return 0.9;
  return 0.7;
}