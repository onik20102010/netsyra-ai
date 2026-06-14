// src/lib/quality-check.ts

export function isLowQuality(reply: string): boolean {
  const lower = reply.toLowerCase();
  const indicators = [
    lower.length < 20,
    lower.includes("i don't know"),
    lower.includes("i cannot"),
    lower.includes("as an ai"),
    lower.includes("i'm not able"),
    lower.includes("i can't"),
    lower.includes("no information"),
    lower.includes("unable to"),
    lower.startsWith("sorry"),
  ];
  return indicators.filter(Boolean).length >= 2;
}