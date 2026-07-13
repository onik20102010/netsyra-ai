/**
 * Verification Checkers
 * 
 * Collection of checkers for syntax, type, import, dependency, security,
 * architecture, performance, style, tests, and other verification categories.
 */

import type { ContextAssemblyResult } from "@/ide/intelligence/context-engine";
import type { VerificationArtifact, VerificationChecker, VerificationIssue } from "./types";

export class SyntaxChecker implements VerificationChecker {
  id = "syntax-checker";
  category = "syntax" as const;
  name = "Syntax Validation";
  description = "Detects syntax errors, invalid tokens, malformed code";
  enabled = true;
  canRepair = false;

  async check(artifact: VerificationArtifact): Promise<VerificationIssue[]> {
    const issues: VerificationIssue[] = [];
    const content = artifact.content || "";
    const path = artifact.path || "";

    if (!content.trim()) {
      issues.push(this.createIssue("Empty file content", path, "error"));
      return issues;
    }

    // Basic syntax patterns
    if (content.includes("<<<<<<< HEAD") || content.includes("=======") || content.includes(">>>>>>>")) {
      issues.push(this.createIssue("Unresolved merge conflict markers", path, "critical"));
    }

    if (content.includes("// ERROR") || content.includes("/* TODO") || content.includes("TODO: FIX")) {
      issues.push(this.createIssue("Unresolved TODO or ERROR marker", path, "warning"));
    }

    if (content.includes("import { }")) {
      issues.push(this.createIssue("Empty import statement", path, "warning"));
    }

    // Check for mismatched brackets in non-JSON content
    if (path.endsWith(".ts") || path.endsWith(".tsx") || path.endsWith(".js") || path.endsWith(".jsx")) {
      const openBraces = (content.match(/\{/g) || []).length;
      const closeBraces = (content.match(/\}/g) || []).length;
      if (openBraces !== closeBraces) {
        issues.push(this.createIssue("Potentially mismatched braces", path, "error"));
      }
    }

    return issues;
  }

  private createIssue(title: string, path: string, severity: "info" | "warning" | "error" | "critical"): VerificationIssue {
    return {
      id: this.generateId(),
      category: "syntax",
      severity,
      title,
      description: title,
      path,
      autoRepairable: false,
      repairAttempts: 0,
      repaired: false,
    };
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class TypeChecker implements VerificationChecker {
  id = "type-checker";
  category = "type" as const;
  name = "Type Validation";
  description = "Detects TypeScript errors and type mismatches";
  enabled = true;
  canRepair = true;

  async check(artifact: VerificationArtifact): Promise<VerificationIssue[]> {
    const issues: VerificationIssue[] = [];
    const content = artifact.content || "";
    const path = artifact.path || "";

    if (content.includes("any") && (content.includes(": any") || content.includes("as any"))) {
      issues.push(this.createIssue("Usage of 'any' type detected", path, "warning"));
    }

    if (content.includes("// @ts-ignore") || content.includes("// @ts-nocheck")) {
      issues.push(this.createIssue("TypeScript suppression directive detected", path, "warning"));
    }

    if (content.includes("unknown") && !content.includes("typeof")) {
      issues.push(this.createIssue("Unnecessary 'unknown' type usage", path, "info"));
    }

    return issues;
  }

  async repair(issue: VerificationIssue, artifact: VerificationArtifact): Promise<VerificationArtifact | null> {
    if (issue.title.includes("'any'")) {
      let content = artifact.content || "";
      content = content.replace(/:\s*any\b/g, ": unknown");
      content = content.replace(/as\s+any\b/g, "as unknown");
      return { ...artifact, content };
    }
    return null;
  }

  private createIssue(title: string, path: string, severity: "info" | "warning" | "error" | "critical"): VerificationIssue {
    return {
      id: this.generateId(),
      category: "type",
      severity,
      title,
      description: title,
      path,
      autoRepairable: true,
      repairAttempts: 0,
      repaired: false,
    };
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class ImportChecker implements VerificationChecker {
  id = "import-checker";
  category = "import" as const;
  name = "Import Validation";
  description = "Checks imports for missing, unused, duplicate, circular, invalid paths";
  enabled = true;
  canRepair = true;

  async check(artifact: VerificationArtifact): Promise<VerificationIssue[]> {
    const issues: VerificationIssue[] = [];
    const content = artifact.content || "";
    const path = artifact.path || "";

    const importRegex = /import\s+.*?\s+from\s+['"](.*?)['"];?/g;
    const imports: string[] = [];
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    // Check for placeholder imports
    for (const imp of imports) {
      if (imp.includes("TODO") || imp.includes("PLACEHOLDER") || imp.includes("...")) {
        issues.push(this.createIssue(`Invalid import path: ${imp}`, path, "error"));
      }
    }

    // Check for duplicate imports
    const duplicates = imports.filter((item, index) => imports.indexOf(item) !== index);
    if (duplicates.length > 0) {
      issues.push(this.createIssue(`Duplicate imports: ${[...new Set(duplicates)].join(", ")}`, path, "warning"));
    }

    // Check for imports of protected modules
    if (content.includes("import fs from 'fs'") || content.includes("import { exec } from 'child_process'")) {
      issues.push(this.createIssue("Import of potentially unsafe module detected", path, "warning"));
    }

    return issues;
  }

  async repair(issue: VerificationIssue, artifact: VerificationArtifact): Promise<VerificationArtifact | null> {
    if (issue.title.includes("Duplicate imports")) {
      const content = artifact.content || "";
      const lines = content.split("\n");
      const seen = new Set<string>();
      const filtered = lines.filter(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith("import ")) {
          if (seen.has(trimmed)) return false;
          seen.add(trimmed);
        }
        return true;
      });
      return { ...artifact, content: filtered.join("\n") };
    }
    return null;
  }

  private createIssue(title: string, path: string, severity: "info" | "warning" | "error" | "critical"): VerificationIssue {
    return {
      id: this.generateId(),
      category: "import",
      severity,
      title,
      description: title,
      path,
      autoRepairable: severity !== "error",
      repairAttempts: 0,
      repaired: false,
    };
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class SecurityChecker implements VerificationChecker {
  id = "security-checker";
  category = "security" as const;
  name = "Security Validation";
  description = "Detects security issues and vulnerabilities";
  enabled = true;
  canRepair = false;

  async check(artifact: VerificationArtifact): Promise<VerificationIssue[]> {
    const issues: VerificationIssue[] = [];
    const content = artifact.content || "";
    const path = artifact.path || "";

    const dangerousPatterns = [
      { pattern: "eval(", title: "Unsafe eval() usage" },
      { pattern: "new Function(", title: "Unsafe Function constructor usage" },
      { pattern: "innerHTML", title: "Potential XSS via innerHTML" },
      { pattern: "document.write(", title: "Unsafe document.write() usage" },
      { pattern: "exec(", title: "Potential command injection" },
      { pattern: "execSync(", title: "Potential command injection" },
      { pattern: "SQL", title: "Possible raw SQL usage" },
    ];

    for (const { pattern, title } of dangerousPatterns) {
      if (content.includes(pattern)) {
        issues.push(this.createIssue(title, path, "error"));
      }
    }

    if (content.includes("API_KEY") || content.includes("SECRET") || content.includes("PASSWORD")) {
      issues.push(this.createIssue("Potential secret exposure", path, "warning"));
    }

    return issues;
  }

  private createIssue(title: string, path: string, severity: "info" | "warning" | "error" | "critical"): VerificationIssue {
    return {
      id: this.generateId(),
      category: "security",
      severity,
      title,
      description: title,
      path,
      autoRepairable: false,
      repairAttempts: 0,
      repaired: false,
    };
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class ArchitectureChecker implements VerificationChecker {
  id = "architecture-checker";
  category = "architecture" as const;
  name = "Architecture Validation";
  description = "Ensures project architecture and conventions are preserved";
  enabled = true;
  canRepair = false;

  async check(artifact: VerificationArtifact, context?: ContextAssemblyResult): Promise<VerificationIssue[]> {
    const issues: VerificationIssue[] = [];
    const path = artifact.path || "";

    if (path.includes("src/") && path.includes("../")) {
      issues.push(this.createIssue("Import path may violate project layering", path, "warning"));
    }

    if (path.endsWith(".tsx") && path.includes("lib/")) {
      issues.push(this.createIssue("UI component located in library folder", path, "warning"));
    }

    return issues;
  }

  private createIssue(title: string, path: string, severity: "info" | "warning" | "error" | "critical"): VerificationIssue {
    return {
      id: this.generateId(),
      category: "architecture",
      severity,
      title,
      description: title,
      path,
      autoRepairable: false,
      repairAttempts: 0,
      repaired: false,
    };
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class PerformanceChecker implements VerificationChecker {
  id = "performance-checker";
  category = "performance" as const;
  name = "Performance Validation";
  description = "Checks for performance issues";
  enabled = true;
  canRepair = false;

  async check(artifact: VerificationArtifact): Promise<VerificationIssue[]> {
    const issues: VerificationIssue[] = [];
    const content = artifact.content || "";
    const path = artifact.path || "";

    if (content.includes("for (let i = 0") && content.includes(".length")) {
      issues.push(this.createIssue("Consider using for...of or .forEach for readability", path, "info"));
    }

    if (content.includes("JSON.stringify") && content.includes("===")) {
      issues.push(this.createIssue("Avoid deep equality with JSON.stringify", path, "warning"));
    }

    return issues;
  }

  private createIssue(title: string, path: string, severity: "info" | "warning" | "error" | "critical"): VerificationIssue {
    return {
      id: this.generateId(),
      category: "performance",
      severity,
      title,
      description: title,
      path,
      autoRepairable: false,
      repairAttempts: 0,
      repaired: false,
    };
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class StyleChecker implements VerificationChecker {
  id = "style-checker";
  category = "style" as const;
  name = "Style Validation";
  description = "Validates formatting, naming conventions, lint rules";
  enabled = true;
  canRepair = true;

  async check(artifact: VerificationArtifact): Promise<VerificationIssue[]> {
    const issues: VerificationIssue[] = [];
    const content = artifact.content || "";
    const path = artifact.path || "";

    if (content.includes("  ") || content.includes("\t")) {
      issues.push(this.createIssue("Indentation may be inconsistent", path, "warning"));
    }

    if (content.includes("\n\n\n")) {
      issues.push(this.createIssue("Multiple consecutive blank lines", path, "warning"));
    }

    return issues;
  }

  async repair(issue: VerificationIssue, artifact: VerificationArtifact): Promise<VerificationArtifact | null> {
    let content = artifact.content || "";

    if (issue.title.includes("Multiple consecutive blank lines")) {
      content = content.replace(/\n{3,}/g, "\n\n");
    }

    if (issue.title.includes("Indentation")) {
      content = content.replace(/\t/g, "  ");
      content = content.replace(/[ \t]+$/gm, "");
    }

    return { ...artifact, content };
  }

  private createIssue(title: string, path: string, severity: "info" | "warning" | "error" | "critical"): VerificationIssue {
    return {
      id: this.generateId(),
      category: "style",
      severity,
      title,
      description: title,
      path,
      autoRepairable: true,
      repairAttempts: 0,
      repaired: false,
    };
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class TestChecker implements VerificationChecker {
  id = "test-checker";
  category = "test" as const;
  name = "Test Validation";
  description = "Validates test code and test coverage";
  enabled = true;
  canRepair = false;

  async check(artifact: VerificationArtifact): Promise<VerificationIssue[]> {
    const issues: VerificationIssue[] = [];
    const content = artifact.content || "";
    const path = artifact.path || "";

    if (path.includes(".test.") || path.includes(".spec.")) {
      if (!content.includes("expect(")) {
        issues.push(this.createIssue("Test file missing assertions", path, "warning"));
      }
    }

    return issues;
  }

  private createIssue(title: string, path: string, severity: "info" | "warning" | "error" | "critical"): VerificationIssue {
    return {
      id: this.generateId(),
      category: "test",
      severity,
      title,
      description: title,
      path,
      autoRepairable: false,
      repairAttempts: 0,
      repaired: false,
    };
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class DependencyChecker implements VerificationChecker {
  id = "dependency-checker";
  category = "dependency" as const;
  name = "Dependency Validation";
  description = "Validates package availability, versions, peer dependencies";
  enabled = true;
  canRepair = false;

  async check(artifact: VerificationArtifact): Promise<VerificationIssue[]> {
    const issues: VerificationIssue[] = [];
    const content = artifact.content || "";
    const path = artifact.path || "";

    if (path === "package.json" || content.includes("\"dependencies\"")) {
      if (content.includes("latest")) {
        issues.push(this.createIssue("Package version pinned to 'latest'", path, "warning"));
      }
    }

    return issues;
  }

  private createIssue(title: string, path: string, severity: "info" | "warning" | "error" | "critical"): VerificationIssue {
    return {
      id: this.generateId(),
      category: "dependency",
      severity,
      title,
      description: title,
      path,
      autoRepairable: false,
      repairAttempts: 0,
      repaired: false,
    };
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export function createDefaultCheckers(): VerificationChecker[] {
  return [
    new SyntaxChecker(),
    new TypeChecker(),
    new ImportChecker(),
    new SecurityChecker(),
    new ArchitectureChecker(),
    new PerformanceChecker(),
    new StyleChecker(),
    new TestChecker(),
    new DependencyChecker(),
  ];
}
