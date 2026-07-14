import { ReasoningResult, ConfidenceScores } from "./types";

export class ConfidenceEngine {
  calculate(result: ReasoningResult): ConfidenceScores {
    let logicScore = 0.8;
    let memoryScore = 0.75;
    let evidenceScore = 0.7;
    let verificationScore = 0.8;
    let externalScore = 0.7;

    for (const step of result.steps) {
      logicScore = (logicScore + step.confidence) / 2;
    }

    const overall =
      (logicScore * 0.3 +
        memoryScore * 0.2 +
        evidenceScore * 0.2 +
        verificationScore * 0.2 +
        externalScore * 0.1);

    return {
      overall: Math.max(0, Math.min(1, overall)),
      logic: logicScore,
      memory: memoryScore,
      evidence: evidenceScore,
      verification: verificationScore,
      external: externalScore,
    };
  }
}
