import {
  ReasoningContext,
  ReasoningResult,
  ReasoningType,
} from "./types";
import { ReasoningPipeline } from "./pipeline";
import { ReasoningSelector } from "./selector";
import { ConfidenceEngine } from "./confidence";

export class ReasoningManager {
  private pipeline: ReasoningPipeline;
  private selector: ReasoningSelector;
  private confidenceEngine: ConfidenceEngine;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    this.pipeline = new ReasoningPipeline(userId);
    this.selector = new ReasoningSelector();
    this.confidenceEngine = new ConfidenceEngine();
  }

  async reason(context: ReasoningContext): Promise<ReasoningResult> {
    const reasoningTypes = this.selector.selectReasoningTypes(context);
    const initialResult = await this.pipeline.execute(context, reasoningTypes);
    const finalConfidence = this.confidenceEngine.calculate(initialResult);
    return {
      ...initialResult,
      confidence: finalConfidence,
    };
  }
}
