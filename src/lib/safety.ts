// src/lib/safety.ts
const HARMFUL_KEYWORDS = [
  "hate speech", "violence", "self-harm", "illegal", "exploit",
  "harass", "threat", "weapon", "terrorism",
];

export function isHarmful(text: string): boolean {
  const lower = text.toLowerCase();
  return HARMFUL_KEYWORDS.some(kw => lower.includes(kw));
}