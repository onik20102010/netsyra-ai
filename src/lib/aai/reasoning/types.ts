export type ReasoningType =
  | "deduction"
  | "induction"
  | "abduction"
  | "analogy"
  | "commonsense"
  | "causal"
  | "temporal"
  | "spatial"
  | "probabilistic"
  | "bayesian"
  | "uncertainty"
  | "mathematical"
  | "programming"
  | "scientific"
  | "legal"
  | "business"
  | "security"
  | "ethical"
  | "counterfactual"
  | "simulation"
  | "hypothesis"
  | "optimization";

export interface ReasoningContext {
  userId: string;
  userMessage: string;
  context: any;
  memory?: any;
  workspace?: any;
  knowledge?: any;
}

export interface Hypothesis {
  id: string;
  title: string;
  description: string;
  confidence: number;
  evidence: EvidenceItem[];
}

export interface EvidenceItem {
  id: string;
  source: "memory" | "tool" | "knowledge" | "inference" | "external";
  content: string;
  relevance: number;
  verified: boolean;
}

export interface EvidenceGraph {
  claim: string;
  evidence: EvidenceItem[];
  contradictions: string[];
}

export interface ConfidenceScores {
  overall: number;
  logic: number;
  memory: number;
  evidence: number;
  verification: number;
  external: number;
}

export interface VerificationResult {
  valid: boolean;
  contradictions: string[];
  issues: string[];
  suggestions: string[];
}

export interface ReasoningStep {
  id: string;
  type: ReasoningType;
  input: string;
  output: string;
  confidence: number;
}

export interface ReasoningResult {
  conclusion: string;
  steps: ReasoningStep[];
  confidence: ConfidenceScores;
  evidence: EvidenceGraph;
  critique?: string;
}
