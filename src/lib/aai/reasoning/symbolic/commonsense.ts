import { ReasoningContext } from "../types";

export class CommonsenseEngine {
  async process(context: ReasoningContext): Promise<string> {
    return "Commonsense reasoning applied to context.";
  }
}
