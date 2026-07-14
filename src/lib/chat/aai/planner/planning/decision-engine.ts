import {
  CandidatePlan,
  UtilityScore,
  CostEstimate,
  RiskAssessment,
} from "../planner-types";

export interface DecisionWeights {
  accuracy: number;
  cost: number;
  latency: number;
  risk: number;
  userPreference: number;
}

const DEFAULT_WEIGHTS: DecisionWeights = {
  accuracy: 0.4,
  cost: 0.15,
  latency: 0.15,
  risk: 0.2,
  userPreference: 0.1,
};

export class DecisionEngine {
  private weights: DecisionWeights;

  constructor(weights?: Partial<DecisionWeights>) {
    this.weights = { ...DEFAULT_WEIGHTS, ...weights };
  }

  calculateUtility(
    plan: Omit<CandidatePlan, "utilityScore">
  ): UtilityScore {
    const accuracy = plan.successProbability;
    const cost = 1 - Math.min(1, plan.costEstimate.money / 10);
    const latency = 1 - Math.min(1, plan.costEstimate.time / 3600);
    const risk = 1 - plan.riskAssessment.riskLevel;
    const userPreference = 0.5;

    const total =
      accuracy * this.weights.accuracy +
      cost * this.weights.cost +
      latency * this.weights.latency +
      risk * this.weights.risk +
      userPreference * this.weights.userPreference;

    return {
      accuracy,
      cost,
      latency,
      risk,
      userPreference,
      total,
    };
  }

  selectBestPlan(candidates: CandidatePlan[]): CandidatePlan {
    const scoredCandidates = candidates.map((candidate) => ({
      ...candidate,
      utilityScore: this.calculateUtility(candidate),
    }));

    scoredCandidates.sort(
      (a, b) => b.utilityScore.total - a.utilityScore.total
    );

    return scoredCandidates[0];
  }
}
