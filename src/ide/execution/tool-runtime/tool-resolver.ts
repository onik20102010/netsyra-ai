/**
 * Tool Resolver
 * 
 * Determines which tool should execute each task.
 * Maps task categories and descriptions to the appropriate tool.
 */

import type { Task } from "@/ide/intelligence/planning-engine";
import { ToolRegistry } from "./tool-registry";
import type { Tool, ToolExecutionRequest } from "./types";

export class ToolResolver {
  private registry: ToolRegistry;

  constructor(registry: ToolRegistry) {
    this.registry = registry;
  }

  /**
   * Resolve the best tool for a given task
   */
  resolve(task: Task): Tool | undefined {
    const taskCategory = task.category;
    const taskTitle = task.title.toLowerCase();
    const taskDescription = task.description.toLowerCase();
    const taskContext = task.requiredContext;

    // Direct mapping by task category
    const toolId = this.mapTaskCategoryToToolId(taskCategory);
    if (toolId && this.registry.has(toolId)) {
      return this.registry.get(toolId);
    }

    // Keyword-based resolution
    const keywords = this.extractKeywords(taskTitle + " " + taskDescription);
    for (const keyword of keywords) {
      const tools = this.registry.findByKeyword(keyword);
      const tool = this.findBestMatch(tools, taskCategory);
      if (tool) return tool;
    }

    // Fallback to category-based search
    const categoryTools = this.registry.getByCategory(this.mapTaskCategory(taskCategory));
    const bestMatch = this.findBestMatch(categoryTools, taskCategory);
    if (bestMatch) return bestMatch;

    // Last resort: find any tool matching context
    if (taskContext.files.length > 0) {
      return this.registry.get("read_file");
    }

    return undefined;
  }

  /**
   * Build a tool execution request from a task
   */
  buildRequest(task: Task, planId?: string): ToolExecutionRequest {
    const tool = this.resolve(task);
    const toolId = tool?.definition.id || "unknown";

    const input = this.buildToolInput(task, toolId);

    return {
      executionId: this.generateId(),
      taskId: task.id,
      toolId,
      input,
      correlationId: planId,
    };
  }

  /**
   * Map task category to tool ID
   */
  private mapTaskCategoryToToolId(taskCategory: string): string | undefined {
    const mappings: Record<string, string> = {
      workspace_analysis: "scan_project",
      planning: "planning",
      context: "context_assembly",
      search: "workspace_search",
      read_file: "read_file",
      write_file: "write_file",
      edit_file: "edit_file",
      delete_file: "delete_file",
      rename_file: "rename_file",
      move_file: "move_file",
      create_file: "write_file",
      patch: "apply_patch",
      generate: "code_generation",
      verify: "verification",
      review: "review",
      research: "documentation_search",
      terminal: "run_command",
      git: "status",
      testing: "run_tests",
      documentation: "summarization",
      database: "run_sql",
      api: "api_search",
      frontend: "read_file",
      backend: "read_file",
      configuration: "read_file",
      deployment: "run_command",
      memory: "retrieve_summaries",
      tool_call: "run_command",
    };

    return mappings[taskCategory];
  }

  /**
   * Map task category to tool category
   */
  private mapTaskCategory(taskCategory: string): "workspace" | "editor" | "terminal" | "search" | "ai" | "runtime" | "git" | "browser" | "database" | "memory" | "filesystem" {
    const mappings: Record<string, "workspace" | "editor" | "terminal" | "search" | "ai" | "runtime" | "git" | "browser" | "database" | "memory" | "filesystem"> = {
      workspace_analysis: "workspace",
      planning: "ai",
      context: "ai",
      search: "search",
      read_file: "workspace",
      write_file: "workspace",
      edit_file: "workspace",
      delete_file: "workspace",
      rename_file: "workspace",
      move_file: "workspace",
      create_file: "workspace",
      patch: "editor",
      generate: "ai",
      verify: "ai",
      review: "ai",
      research: "search",
      terminal: "terminal",
      git: "git",
      testing: "terminal",
      documentation: "ai",
      database: "database",
      api: "search",
      frontend: "workspace",
      backend: "workspace",
      configuration: "workspace",
      deployment: "terminal",
      memory: "memory",
      tool_call: "runtime",
    };

    return mappings[taskCategory] || "workspace";
  }

  /**
   * Build tool input from task and tool ID
   */
  private buildToolInput(task: Task, toolId: string): Record<string, unknown> {
    const input: Record<string, unknown> = {
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        category: task.category,
      },
      context: {
        files: task.requiredContext.files,
        folders: task.requiredContext.folders,
        components: task.requiredContext.components,
        apis: task.requiredContext.apis,
        modules: task.requiredContext.modules,
        symbols: task.requiredContext.symbols,
      },
    };

    switch (toolId) {
      case "read_file":
      case "write_file":
      case "edit_file":
      case "delete_file":
      case "rename_file":
      case "move_file":
      case "copy_file":
      case "apply_patch":
      case "format_document":
        input.path = task.requiredContext.files[0];
        break;
      case "read_directory":
      case "create_folder":
      case "delete_folder":
      case "scan_project":
      case "list_files":
        input.path = task.requiredContext.folders[0] || ".";
        break;
      case "run_command":
      case "run_build":
      case "run_tests":
      case "install_package":
      case "run_linter":
      case "run_formatter":
        input.command = this.inferCommand(task);
        break;
      case "workspace_search":
      case "documentation_search":
      case "web_search":
      case "api_search":
      case "semantic_search":
        input.query = task.title + " " + task.description;
        break;
      case "knowledge_graph_lookup":
      case "memory_lookup":
        input.query = task.title;
        break;
      case "status":
      case "diff":
      case "stage":
      case "commit":
      case "branch":
      case "checkout":
      case "history":
      case "restore":
        input.subcommand = this.inferGitCommand(toolId, task);
        break;
      case "run_sql":
      case "inspect_schema":
      case "read_tables":
      case "migration":
      case "seed":
      case "backup":
        input.query = task.description;
        break;
      default:
        input.input = task.description;
    }

    return input;
  }

  /**
   * Find the best matching tool from a list
   */
  private findBestMatch(tools: Tool[], taskCategory: string): Tool | undefined {
    if (tools.length === 0) return undefined;
    if (tools.length === 1) return tools[0];

    // Prefer tools matching the task category
    const categoryMapped = this.mapTaskCategory(taskCategory);
    const matchingCategory = tools.find(tool => tool.definition.category === categoryMapped);
    if (matchingCategory) return matchingCategory;

    // Prefer safe tools
    const safeTools = tools.filter(tool => tool.definition.permissions === "safe");
    if (safeTools.length > 0) return safeTools[0];

    return tools[0];
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter((word, index, arr) => arr.indexOf(word) === index);
  }

  /**
   * Infer command from task
   */
  private inferCommand(task: Task): string {
    const lower = (task.title + " " + task.description).toLowerCase();

    if (lower.includes("test")) return "npm test";
    if (lower.includes("build")) return "npm run build";
    if (lower.includes("lint")) return "npm run lint";
    if (lower.includes("format")) return "npm run format";
    if (lower.includes("install")) return "npm install";
    if (lower.includes("migrate")) return "npm run migrate";
    if (lower.includes("seed")) return "npm run seed";

    return "echo 'No command inferred'";
  }

  /**
   * Infer git command from task
   */
  private inferGitCommand(toolId: string, task: Task): string {
    const lower = task.title.toLowerCase();
    if (lower.includes("status")) return "status";
    if (lower.includes("diff")) return "diff";
    if (lower.includes("stage")) return "add";
    if (lower.includes("commit")) return "commit";
    if (lower.includes("branch")) return "branch";
    if (lower.includes("checkout")) return "checkout";
    if (lower.includes("history")) return "log";
    if (lower.includes("restore")) return "restore";
    return toolId;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
