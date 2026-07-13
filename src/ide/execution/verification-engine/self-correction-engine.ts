/**
 * Self-Correction Engine
 * 
 * Attempts automated repair of detected verification issues before
 * requesting regeneration. Prefers smallest possible patches.
 */

import type { VerificationArtifact, VerificationIssue, VerificationChecker } from "./types";

export class SelfCorrectionEngine {
  private maxAttempts: number;
  private retryLimit: number;

  constructor(maxAttempts = 3, retryLimit = 5) {
    this.maxAttempts = maxAttempts;
    this.retryLimit = retryLimit;
  }

  /**
   * Attempt to repair issues in artifacts
   */
  async repair(
    artifact: VerificationArtifact,
    issues: VerificationIssue[],
    checkers: VerificationChecker[]
  ): Promise<{ artifact: VerificationArtifact; repaired: VerificationIssue[]; remaining: VerificationIssue[] }> {
    const repaired: VerificationIssue[] = [];
    const remaining: VerificationIssue[] = [];
    let currentArtifact = { ...artifact };

    for (const issue of issues) {
      if (issue.repairAttempts >= this.maxAttempts) {
        remaining.push(issue);
        continue;
      }

      if (!issue.autoRepairable) {
        remaining.push(issue);
        continue;
      }

      const checker = checkers.find(c => c.category === issue.category && c.canRepair);
      if (!checker || !checker.repair) {
        remaining.push(issue);
        continue;
      }

      try {
        issue.repairAttempts++;
        const repairedArtifact = await checker.repair(issue, currentArtifact);

        if (repairedArtifact) {
          currentArtifact = repairedArtifact;
          issue.repaired = true;
          issue.repairResult = "Repaired by local checker";
          repaired.push(issue);
        } else {
          remaining.push(issue);
        }
      } catch (error) {
        issue.repairAttempts++;
        remaining.push(issue);
      }
    }

    return { artifact: currentArtifact, repaired, remaining };
  }

  /**
   * Generate a minimal corrective patch using a fallback strategy
   */
  generateMinimalFix(issue: VerificationIssue, content: string): string | null {
    const fixes = this.getFixStrategies(issue.category);

    for (const strategy of fixes) {
      const fixed = strategy(issue, content);
      if (fixed && fixed !== content) {
        return fixed;
      }
    }

    return null;
  }

  /**
   * Get fix strategies for issue category
   */
  private getFixStrategies(category: string): Array<(issue: VerificationIssue, content: string) => string | null> {
    const strategies: Array<(issue: VerificationIssue, content: string) => string | null> = [];

    if (category === "style") {
      strategies.push((issue, content) => {
        return content
          .replace(/\n{3,}/g, "\n\n")
          .replace(/\t/g, "  ")
          .replace(/[ \t]+$/gm, "");
      });
    }

    if (category === "import") {
      strategies.push((issue, content) => {
        const lines = content.split("\n");
        const seen = new Set<string>();
        return lines
          .filter(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith("import ")) {
              if (seen.has(trimmed)) return false;
              seen.add(trimmed);
            }
            return true;
          })
          .join("\n");
      });
    }

    if (category === "type") {
      strategies.push((issue, content) => {
        return content.replace(/:\s*any\b/g, ": unknown").replace(/as\s+any\b/g, "as unknown");
      });
    }

    return strategies;
  }

  /**
   * Check if an issue is still present after repair
   */
  async isIssueStillPresent(issue: VerificationIssue, artifact: VerificationArtifact, checker: VerificationChecker): Promise<boolean> {
    try {
      const issues = await checker.check(artifact);
      return issues.some(i => i.title === issue.title && i.category === issue.category);
    } catch {
      return true;
    }
  }

  /**
   * Escalate to a stronger model if local repair fails
   */
  shouldEscalate(issue: VerificationIssue): boolean {
    return issue.repairAttempts >= this.maxAttempts && issue.severity !== "critical";
  }

  /**
   * Check if repair retry limit is reached
   */
  isRetryLimitReached(issue: VerificationIssue): boolean {
    return issue.repairAttempts >= this.retryLimit;
  }
}
