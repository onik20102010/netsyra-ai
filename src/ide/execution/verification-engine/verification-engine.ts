/**
 * Verification & Self-Correction Engine
 * 
 * Validates every artifact produced by Netsyra before it is applied.
 * Detects defects, assesses quality, performs reviews, and repairs issues.
 */

import { ModelRegistry } from "@/ide/execution/code-generator/model-registry";
import { ProviderRegistry } from "@/ide/execution/code-generator/providers/provider-registry";
import { CodeGeneratorEngine } from "@/ide/execution/code-generator";
import type { GeneratedFileChange } from "@/ide/execution/code-generator";
import { createDefaultCheckers } from "./verification-checkers";
import { SelfCorrectionEngine } from "./self-correction-engine";
import { VerificationModelRouter } from "./model-router";
import type {
  VerificationRequest,
  VerificationResult,
  VerificationArtifact,
  VerificationIssue,
  VerificationChecker,
  VerificationStreamEvent,
  VerificationStatus,
  VerificationSummary,
  VerificationModelRoutingRequest,
} from "./types";

export class VerificationEngine {
  private checkers: VerificationChecker[];
  private selfCorrection: SelfCorrectionEngine;
  private modelRouter: VerificationModelRouter;
  private modelRegistry: ModelRegistry;
  private providerRegistry: ProviderRegistry;
  private codeGenerator: CodeGeneratorEngine;
  private history: VerificationSummary[] = [];
  private events: VerificationStreamEvent[] = [];

  constructor() {
    this.checkers = createDefaultCheckers();
    this.selfCorrection = new SelfCorrectionEngine();
    this.modelRegistry = new ModelRegistry();
    this.modelRouter = new VerificationModelRouter(this.modelRegistry);
    this.providerRegistry = new ProviderRegistry();
    this.codeGenerator = new CodeGeneratorEngine();
  }

  /**
   * Verify artifacts from a generation result
   */
  async verify(request: VerificationRequest): Promise<VerificationResult> {
    const startTime = Date.now();
    this.events = [];

    this.emitEvent(request.id, "received", "pending", { artifactCount: request.artifacts.length });

    let currentArtifacts = [...request.artifacts];
    let allIssues: VerificationIssue[] = [];
    let allWarnings: VerificationIssue[] = [];
    let repairedArtifacts: VerificationArtifact[] = [];
    let rejectedArtifacts: VerificationArtifact[] = [];
    let verificationRounds = 0;
    let successfulRepairs = 0;
    let repairAttempts = 0;

    // Run verification pipeline
    while (verificationRounds < Math.max(1, request.maxRepairAttempts)) {
      verificationRounds++;
      const roundIssues: VerificationIssue[] = [];
      const roundWarnings: VerificationIssue[] = [];

      for (const artifact of currentArtifacts) {
        this.emitEvent(request.id, `validating_${artifact.type}`, "running", { path: artifact.path });

        for (const checker of this.checkers) {
          if (!checker.enabled) continue;

          try {
            const issues = await checker.check(artifact, request.context);
            for (const issue of issues) {
              if (issue.severity === "error" || issue.severity === "critical") {
                roundIssues.push(issue);
              } else {
                roundWarnings.push(issue);
              }
            }
          } catch (error) {
            this.emitEvent(request.id, "checker_error", "failed", {
              checker: checker.id,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }

      allIssues = [...allIssues, ...roundIssues];
      allWarnings = [...allWarnings, ...roundWarnings];

      // If no issues, we're done
      if (roundIssues.length === 0) {
        this.emitEvent(request.id, "verification_passed", "passed", { round: verificationRounds });
        break;
      }

      // Try self-correction
      if (verificationRounds <= request.maxRepairAttempts) {
        this.emitEvent(request.id, "repairing", "running", { issueCount: roundIssues.length });

        const updatedArtifacts: VerificationArtifact[] = [];
        for (const artifact of currentArtifacts) {
          const artifactIssues = roundIssues.filter(i => i.path === artifact.path);

          if (artifactIssues.length > 0) {
            const result = await this.selfCorrection.repair(artifact, artifactIssues, this.checkers);
            repairAttempts += artifactIssues.length;
            successfulRepairs += result.repaired.length;

            if (result.repaired.length > 0) {
              repairedArtifacts.push(result.artifact);
              updatedArtifacts.push(result.artifact);
            } else {
              updatedArtifacts.push(artifact);
            }

            if (result.remaining.length > 0) {
              // Try escalation with AI model for remaining issues
              const escalated = await this.escalateRepair(artifact, result.remaining, request);
              if (escalated && escalated.content !== artifact.content) {
                updatedArtifacts[updatedArtifacts.length - 1] = escalated;
                repairedArtifacts.push(escalated);
              } else {
                rejectedArtifacts.push(artifact);
              }
            }
          } else {
            updatedArtifacts.push(artifact);
          }
        }

        currentArtifacts = updatedArtifacts;
      }

      this.emitEvent(request.id, "re_verifying", "running", { round: verificationRounds });
    }

    // Final check
    const finalIssues = await this.gatherFinalIssues(currentArtifacts, request.context);
    allIssues = finalIssues.errors;
    allWarnings = [...allWarnings, ...finalIssues.warnings];

    // Determine status
    let status: VerificationStatus = "passed";
    if (allIssues.some(i => i.severity === "critical" || i.severity === "error")) {
      status = rejectedArtifacts.length > 0 ? "failed" : "partial";
    } else if (successfulRepairs > 0) {
      status = "repaired";
    }

    const endTime = Date.now();

    // Build result
    const result: VerificationResult = {
      id: this.generateId(),
      requestId: request.id,
      taskId: request.taskId,
      status,
      confidenceScore: this.calculateConfidenceScore(currentArtifacts, allIssues, allWarnings),
      artifacts: currentArtifacts,
      issues: allIssues,
      warnings: allWarnings,
      repairedArtifacts,
      rejectedArtifacts,
      diagnostics: this.buildDiagnostics(allIssues, allWarnings),
      logs: this.buildLogs(),
      metadata: {
        totalChecks: this.checkers.length,
        passedChecks: this.checkers.length - allIssues.length,
        failedChecks: allIssues.length,
        repairAttempts,
        successfulRepairs,
        rejectedRepairs: rejectedArtifacts.length,
        verificationRounds,
        tokenUsage: this.estimateTokenUsage(request),
        modelRoutingReason: this.getModelRoutingReason(request),
      },
      startTime,
      endTime,
      duration: endTime - startTime,
      modelId: this.getModelRoutingReason(request),
    };

    this.emitEvent(request.id, status === "passed" || status === "repaired" ? "verification_passed" : "verification_failed", status, {
      duration: result.duration,
      issueCount: allIssues.length,
      warningCount: allWarnings.length,
    });

    this.storeSummary(request, result);

    return result;
  }

  /**
   * Gather final issues from all artifacts
   */
  private async gatherFinalIssues(
    artifacts: VerificationArtifact[],
    context?: VerificationRequest["context"]
  ): Promise<{ errors: VerificationIssue[]; warnings: VerificationIssue[] }> {
    const errors: VerificationIssue[] = [];
    const warnings: VerificationIssue[] = [];

    for (const artifact of artifacts) {
      for (const checker of this.checkers) {
        if (!checker.enabled) continue;
        try {
          const issues = await checker.check(artifact, context);
          for (const issue of issues) {
            if (issue.severity === "error" || issue.severity === "critical") {
              errors.push(issue);
            } else {
              warnings.push(issue);
            }
          }
        } catch {
          // Continue
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * Escalate repair to a stronger model
   */
  private async escalateRepair(
    artifact: VerificationArtifact,
    remainingIssues: VerificationIssue[],
    request: VerificationRequest
  ): Promise<VerificationArtifact | null> {
    const severity = remainingIssues.some(i => i.severity === "critical") ? "critical" : "error";
    const routing = this.modelRouter.route({
      category: remainingIssues[0].category,
      severity,
      complexity: request.complexity,
      subscription: request.subscription,
      artifactCount: 1,
      tokenBudget: artifact.content?.length || 1000,
    });

    const prompt = this.buildRepairPrompt(artifact, remainingIssues, request);

    try {
      const response = await this.providerRegistry.generate(routing.provider, {
        modelId: routing.modelId,
        prompt,
        temperature: 0.1,
        maxTokens: 4000,
        messages: [
          { role: "system", content: "You are a code repair assistant. Return only the fixed code, no explanations." },
          { role: "user", content: prompt },
        ],
      });

      if (response.error || !response.content) {
        return null;
      }

      return { ...artifact, content: response.content };
    } catch {
      return null;
    }
  }

  /**
   * Build repair prompt for AI model
   */
  private buildRepairPrompt(artifact: VerificationArtifact, issues: VerificationIssue[], request: VerificationRequest): string {
    const parts = [
      "Fix the following code issues. Return only the corrected code, preserving the file structure.",
      `\nFile: ${artifact.path}`,
      `\nIssues:\n${issues.map(i => `- ${i.title}: ${i.description}`).join("\n")}`,
      `\nCode:\n${artifact.content}`,
      "\nCorrected code:",
    ];
    return parts.join("");
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidenceScore(artifacts: VerificationArtifact[], issues: VerificationIssue[], warnings: VerificationIssue[]): number {
    const base = 100;
    const errorPenalty = issues.filter(i => i.severity === "error" || i.severity === "critical").length * 15;
    const warningPenalty = warnings.length * 3;
    return Math.max(0, base - errorPenalty - warningPenalty);
  }

  /**
   * Build diagnostics from issues
   */
  private buildDiagnostics(issues: VerificationIssue[], warnings: VerificationIssue[]): any[] {
    const all = [...issues, ...warnings];
    return all.map(i => ({
      id: i.id,
      category: i.category,
      severity: i.severity,
      message: i.title,
      path: i.path,
      line: i.line,
      column: i.column,
    }));
  }

  /**
   * Build verification logs
   */
  private buildLogs(): any[] {
    return this.events.map(e => ({
      timestamp: e.timestamp,
      stage: e.stage,
      status: e.status,
      message: e.stage,
      metadata: e.payload,
    }));
  }

  /**
   * Estimate token usage
   */
  private estimateTokenUsage(request: VerificationRequest): number {
    return request.artifacts.reduce((sum, a) => sum + (a.content?.length || 0) / 4, 0);
  }

  /**
   * Get model routing reason
   */
  private getModelRoutingReason(request: VerificationRequest): string {
    const routing = this.modelRouter.route({
      category: "quality",
      severity: "warning",
      complexity: request.complexity,
      subscription: request.subscription,
      artifactCount: request.artifacts.length,
      tokenBudget: this.estimateTokenUsage(request),
    });
    return routing.reason;
  }

  /**
   * Emit streaming event
   */
  private emitEvent(requestId: string, stage: string, status: VerificationStatus, payload: Record<string, unknown> = {}): void {
    const event: VerificationStreamEvent = {
      id: this.generateId(),
      requestId,
      stage,
      status,
      payload,
      timestamp: Date.now(),
    };

    this.events.push(event);

    // Stream to UI
    console.log(`[Verification Engine] ${stage}:`, status);
  }

  /**
   * Store verification summary in memory
   */
  private storeSummary(request: VerificationRequest, result: VerificationResult): void {
    const summary: VerificationSummary = {
      id: this.generateId(),
      timestamp: Date.now(),
      taskId: request.taskId,
      result: result.status === "passed" ? "passed" : result.status === "repaired" ? "repaired" : "failed",
      categories: [...new Set(result.issues.map(i => i.category))],
      recurringIssues: [...new Set(result.issues.map(i => i.title))],
      successfulRepairs: result.repairedArtifacts.map(a => a.path || ""),
      conventions: [...new Set(result.issues.filter(i => i.category === "convention").map(i => i.title))],
      preferredFixes: result.repairedArtifacts.map(a => a.path || ""),
    };

    this.history.push(summary);
  }

  /**
   * Convert generated file changes to verification artifacts
   */
  static fromGeneratedFiles(files: GeneratedFileChange[]): VerificationArtifact[] {
    return files.map(file => ({
      id: this.generateIdStatic(),
      type: this.mapOperationToArtifactType(file.operation),
      path: file.path,
      originalContent: file.originalContent,
      content: file.newContent,
      patch: file.patch,
      metadata: {
        reasoning: file.reasoning,
        dependencies: file.dependencies,
      },
      source: "code-generator",
    }));
  }

  private static mapOperationToArtifactType(operation: string): "file" | "patch" | "command" | "config" | "migration" | "dependency" | "unknown" {
    const map: Record<string, "file" | "patch" | "command" | "config" | "migration" | "dependency" | "unknown"> = {
      create: "file",
      edit: "patch",
      replace: "file",
      delete: "file",
      rename: "file",
      patch: "patch",
    };
    return map[operation] || "unknown";
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generateIdStatic(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get verification history
   */
  getHistory(): VerificationSummary[] {
    return [...this.history];
  }

  /**
   * Get events
   */
  getEvents(): VerificationStreamEvent[] {
    return [...this.events];
  }
}
