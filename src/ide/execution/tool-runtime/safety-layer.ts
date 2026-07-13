/**
 * Safety & Permission Layer
 * 
 * Validates every tool execution before it runs.
 * Enforces workspace boundaries, permission levels, protected files,
 * terminal safety, database safety, and secret exposure checks.
 */

import type {
  Tool,
  ToolExecutionRequest,
  UserPermissions,
  SafetyValidationResult,
  SafetyCheck,
  ToolPermissionLevel,
} from "./types";

export class SafetyLayer {
  private protectedPaths: string[];
  private protectedFiles: string[];
  private blockedCommands: string[];
  private allowedCommands: string[];
  private workspaceRoot: string;

  constructor(config: {
    protectedPaths?: string[];
    protectedFiles?: string[];
    blockedCommands?: string[];
    allowedCommands?: string[];
    workspaceRoot?: string;
  } = {}) {
    this.protectedPaths = config.protectedPaths || ["node_modules", ".git", ".env", "dist", "build"];
    this.protectedFiles = config.protectedFiles || [
      ".env",
      ".env.local",
      ".env.production",
      ".env.development",
      "secrets.json",
      "credentials.json",
      "id_rsa",
      "id_rsa.pub",
    ];
    this.blockedCommands = config.blockedCommands || [
      "rm -rf /",
      "rm -rf /*",
      "rm -rf ~",
      "rm -rf /root",
      ":(){ :|:& };:",
      "mkfs",
      "dd if=/dev/zero",
      "> /dev/sda",
      "del /f /s /q",
      "format",
    ];
    this.allowedCommands = config.allowedCommands || ["npm", "npx", "node", "git", "tsc", "eslint", "prettier"];
    this.workspaceRoot = config.workspaceRoot || process.cwd();
  }

  /**
   * Validate a tool execution request
   */
  validate(request: ToolExecutionRequest, tool: Tool, userPermissions?: UserPermissions): SafetyValidationResult {
    const checks: SafetyCheck[] = [];

    // Check permission level
    checks.push(this.checkPermissionLevel(tool, userPermissions));

    // Check user tool allow/block lists
    checks.push(this.checkToolAllowList(tool, userPermissions));

    // Check workspace boundaries
    checks.push(this.checkWorkspaceBoundaries(request, tool));

    // Check protected files
    checks.push(this.checkProtectedFiles(request, tool));

    // Check terminal safety
    checks.push(this.checkTerminalSafety(request, tool));

    // Check database safety
    checks.push(this.checkDatabaseSafety(request, tool));

    // Check secret exposure
    checks.push(this.checkSecretExposure(request, tool));

    // Check dangerous deletions
    checks.push(this.checkDangerousDeletions(request, tool));

    // Check large-scale modifications
    checks.push(this.checkLargeScaleModifications(request, tool));

    // Check environment modifications
    checks.push(this.checkEnvironmentModifications(request, tool));

    const failedChecks = checks.filter(c => !c.passed);
    const allowed = failedChecks.length === 0;
    const criticalOrError = failedChecks.filter(c => c.severity === "critical" || c.severity === "error");

    let reason: string | undefined;
    let alternatives: string[] | undefined;

    if (!allowed) {
      reason = criticalOrError.map(c => c.description).join("; ");
      alternatives = this.suggestAlternatives(request, tool, failedChecks);
    }

    return {
      allowed: allowed && criticalOrError.length === 0,
      level: tool.definition.permissions,
      checks,
      reason,
      alternatives,
    };
  }

  /**
   * Check if permission level is allowed
   */
  private checkPermissionLevel(tool: Tool, userPermissions?: UserPermissions): SafetyCheck {
    const level = tool.definition.permissions;
    let passed = true;
    let description = `Permission level ${level} is allowed`;

    if (userPermissions) {
      if (level === "critical" && !userPermissions.allowCritical) {
        passed = false;
        description = `Critical permission required for ${tool.definition.name}`;
      } else if (level === "high" && !userPermissions.allowHigh) {
        passed = false;
        description = `High permission required for ${tool.definition.name}`;
      } else if (level === "medium" && !userPermissions.allowMedium) {
        passed = false;
        description = `Medium permission required for ${tool.definition.name}`;
      }
    }

    return {
      id: "permission-level",
      type: "permission",
      description,
      passed,
      severity: passed ? "info" : "error",
    };
  }

  /**
   * Check tool allow/block lists
   */
  private checkToolAllowList(tool: Tool, userPermissions?: UserPermissions): SafetyCheck {
    if (userPermissions?.blockedTools?.includes(tool.definition.id)) {
      return {
        id: "tool-blocked",
        type: "permission",
        description: `Tool ${tool.definition.id} is blocked by user permissions`,
        passed: false,
        severity: "error",
      };
    }

    if (userPermissions?.allowedTools && !userPermissions.allowedTools.includes(tool.definition.id)) {
      return {
        id: "tool-not-allowed",
        type: "permission",
        description: `Tool ${tool.definition.id} is not in allowed tools list`,
        passed: false,
        severity: "error",
      };
    }

    return {
      id: "tool-allowed",
      type: "permission",
      description: `Tool ${tool.definition.id} is allowed`,
      passed: true,
      severity: "info",
    };
  }

  /**
   * Check workspace boundaries
   */
  private checkWorkspaceBoundaries(request: ToolExecutionRequest, tool: Tool): SafetyCheck {
    const input = request.input || {};
    const paths = this.extractPaths(input);

    for (const path of paths) {
      if (this.isOutsideWorkspace(path)) {
        return {
          id: "workspace-boundary",
          type: "path",
          description: `Path "${path}" is outside workspace boundaries`,
          passed: false,
          severity: "critical",
        };
      }
    }

    return {
      id: "workspace-boundary",
      type: "path",
      description: "All paths are within workspace boundaries",
      passed: true,
      severity: "info",
    };
  }

  /**
   * Check protected files
   */
  private checkProtectedFiles(request: ToolExecutionRequest, tool: Tool): SafetyCheck {
    const input = request.input || {};
    const paths = this.extractPaths(input);

    for (const path of paths) {
      const normalized = this.normalizePath(path).toLowerCase();
      for (const protectedFile of this.protectedFiles) {
        if (normalized.endsWith(protectedFile.toLowerCase()) || normalized.includes(`/${protectedFile.toLowerCase()}`)) {
          return {
            id: "protected-file",
            type: "file",
            description: `Protected file "${path}" cannot be modified by ${tool.definition.name}`,
            passed: false,
            severity: "critical",
          };
        }
      }
    }

    return {
      id: "protected-file",
      type: "file",
      description: "No protected files are targeted",
      passed: true,
      severity: "info",
    };
  }

  /**
   * Check terminal command safety
   */
  private checkTerminalSafety(request: ToolExecutionRequest, tool: Tool): SafetyCheck {
    if (tool.definition.category !== "terminal") {
      return {
        id: "terminal-safety",
        type: "command",
        description: "Not a terminal tool",
        passed: true,
        severity: "info",
      };
    }

    const command = String(request.input.command || request.input.input || "");
    const lowerCommand = command.toLowerCase();

    // Check blocked commands
    for (const blocked of this.blockedCommands) {
      if (lowerCommand.includes(blocked.toLowerCase())) {
        return {
          id: "terminal-blocked",
          type: "command",
          description: `Command contains blocked pattern: "${blocked}"`,
          passed: false,
          severity: "critical",
        };
      }
    }

    // Check if command starts with allowed command
    const commandName = command.trim().split(/\s+/)[0];
    if (commandName && !this.allowedCommands.includes(commandName)) {
      return {
        id: "terminal-allowed-commands",
        type: "command",
        description: `Command "${commandName}" is not in allowed commands list`,
        passed: false,
        severity: "warning",
      };
    }

    return {
      id: "terminal-safety",
      type: "command",
      description: "Terminal command is safe",
      passed: true,
      severity: "info",
    };
  }

  /**
   * Check database safety
   */
  private checkDatabaseSafety(request: ToolExecutionRequest, tool: Tool): SafetyCheck {
    if (tool.definition.category !== "database") {
      return {
        id: "database-safety",
        type: "database",
        description: "Not a database tool",
        passed: true,
        severity: "info",
      };
    }

    const query = String(request.input.query || request.input.command || "").toLowerCase();
    const destructiveKeywords = ["drop", "delete", "truncate", "alter", "update"];

    for (const keyword of destructiveKeywords) {
      if (query.includes(keyword)) {
        return {
          id: "database-destructive",
          type: "database",
          description: `Database query contains destructive operation: "${keyword}"`,
          passed: false,
          severity: "warning",
        };
      }
    }

    return {
      id: "database-safety",
      type: "database",
      description: "Database operation is safe",
      passed: true,
      severity: "info",
    };
  }

  /**
   * Check secret exposure
   */
  private checkSecretExposure(request: ToolExecutionRequest, tool: Tool): SafetyCheck {
    const input = JSON.stringify(request.input).toLowerCase();
    const secretPatterns = [
      "apikey",
      "api_key",
      "secret",
      "password",
      "token",
      "private_key",
      "credentials",
    ];

    for (const pattern of secretPatterns) {
      if (input.includes(pattern) && tool.definition.category !== "memory") {
        return {
          id: "secret-exposure",
          type: "security",
          description: `Input may contain sensitive data matching "${pattern}"`,
          passed: false,
          severity: "warning",
        };
      }
    }

    return {
      id: "secret-exposure",
      type: "security",
      description: "No sensitive data exposure detected",
      passed: true,
      severity: "info",
    };
  }

  /**
   * Check dangerous deletions
   */
  private checkDangerousDeletions(request: ToolExecutionRequest, tool: Tool): SafetyCheck {
    const toolId = tool.definition.id;
    if (toolId !== "delete_file" && toolId !== "delete_folder" && toolId !== "delete_memory") {
      return {
        id: "dangerous-deletion",
        type: "deletion",
        description: "Not a deletion operation",
        passed: true,
        severity: "info",
      };
    }

    const input = request.input || {};
    const paths = this.extractPaths(input);

    for (const path of paths) {
      const normalized = this.normalizePath(path).toLowerCase();
      for (const protectedPath of this.protectedPaths) {
        if (normalized.includes(protectedPath.toLowerCase())) {
          return {
            id: "dangerous-deletion",
            type: "deletion",
            description: `Cannot delete protected path: "${path}"`,
            passed: false,
            severity: "critical",
          };
        }
      }
    }

    return {
      id: "dangerous-deletion",
      type: "deletion",
      description: "Deletion targets are safe",
      passed: true,
      severity: "info",
    };
  }

  /**
   * Check large-scale modifications
   */
  private checkLargeScaleModifications(request: ToolExecutionRequest, tool: Tool): SafetyCheck {
    const paths = this.extractPaths(request.input || {});

    if (tool.definition.permissions === "high" && paths.length > 10) {
      return {
        id: "large-scale-modification",
        type: "modification",
        description: `High-permission tool targets ${paths.length} paths; requires confirmation`,
        passed: false,
        severity: "warning",
      };
    }

    return {
      id: "large-scale-modification",
      type: "modification",
      description: "Modification scope is acceptable",
      passed: true,
      severity: "info",
    };
  }

  /**
   * Check environment modifications
   */
  private checkEnvironmentModifications(request: ToolExecutionRequest, tool: Tool): SafetyCheck {
    if (tool.definition.category !== "terminal" && tool.definition.category !== "configuration") {
      return {
        id: "environment-modification",
        type: "environment",
        description: "Not an environment modification tool",
        passed: true,
        severity: "info",
      };
    }

    const input = JSON.stringify(request.input).toLowerCase();
    if (input.includes("env") || input.includes("environment")) {
      return {
        id: "environment-modification",
        type: "environment",
        description: "Environment modification requires confirmation",
        passed: false,
        severity: "warning",
      };
    }

    return {
      id: "environment-modification",
      type: "environment",
      description: "No environment modification detected",
      passed: true,
      severity: "info",
    };
  }

  /**
   * Suggest alternatives for failed checks
   */
  private suggestAlternatives(request: ToolExecutionRequest, tool: Tool, failedChecks: SafetyCheck[]): string[] {
    const alternatives: string[] = [];

    if (failedChecks.some(c => c.type === "permission")) {
      alternatives.push("Request user permission to execute this tool");
    }

    if (failedChecks.some(c => c.type === "path")) {
      alternatives.push("Use a path within the workspace");
    }

    if (failedChecks.some(c => c.type === "file")) {
      alternatives.push("Avoid modifying protected files");
    }

    if (failedChecks.some(c => c.type === "command")) {
      alternatives.push("Use a safer command or add it to allowed commands");
    }

    if (failedChecks.some(c => c.type === "deletion")) {
      alternatives.push("Use a more targeted deletion or backup first");
    }

    return alternatives.length > 0 ? alternatives : ["Review safety settings and retry"];
  }

  /**
   * Extract paths from tool input
   */
  private extractPaths(input: Record<string, unknown>): string[] {
    const paths: string[] = [];
    const pathKeys = ["path", "file", "files", "folder", "directory", "source", "destination", "target"];

    for (const key of pathKeys) {
      const value = input[key];
      if (typeof value === "string") {
        paths.push(value);
      } else if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === "string") {
            paths.push(item);
          }
        }
      }
    }

    return paths;
  }

  /**
   * Check if a path is outside the workspace
   */
  private isOutsideWorkspace(path: string): boolean {
    const normalized = this.normalizePath(path);
    const workspaceRoot = this.normalizePath(this.workspaceRoot);

    if (normalized.startsWith("..")) return true;
    if (normalized.startsWith("/") && !normalized.startsWith(workspaceRoot)) return true;
    if (normalized.includes("/..")) return true;

    return false;
  }

  /**
   * Normalize a path for comparison
   */
  private normalizePath(path: string): string {
    return path.replace(/\\/g, "/").replace(/\/+/g, "/");
  }
}
