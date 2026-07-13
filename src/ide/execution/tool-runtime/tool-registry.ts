/**
 * Tool Registry
 * 
 * Stores every available tool and provides lookup, registration,
 * and discovery capabilities for the Tool Calling Runtime.
 */

import type {
  Tool,
  ToolDefinition,
  ToolCategory,
  ToolExecutionRequest,
  ToolExecutionResult,
  ToolExecutionStatus,
} from "./types";

export class ToolRegistry {
  private tools = new Map<string, Tool>();
  private categoryIndex = new Map<ToolCategory, string[]>();
  private capabilityIndex = new Map<string, string[]>();

  constructor() {
    this.registerDefaultTools();
  }

  /**
   * Register a tool in the registry
   */
  register(tool: Tool): void {
    this.tools.set(tool.definition.id, tool);

    const categoryTools = this.categoryIndex.get(tool.definition.category) || [];
    categoryTools.push(tool.definition.id);
    this.categoryIndex.set(tool.definition.category, categoryTools);

    // Index by keywords in name and description
    const keywords = this.extractKeywords(tool.definition.name + " " + tool.definition.description);
    for (const keyword of keywords) {
      const tools = this.capabilityIndex.get(keyword) || [];
      if (!tools.includes(tool.definition.id)) {
        tools.push(tool.definition.id);
        this.capabilityIndex.set(keyword, tools);
      }
    }
  }

  /**
   * Unregister a tool
   */
  unregister(toolId: string): void {
    const tool = this.tools.get(toolId);
    if (!tool) return;

    this.tools.delete(toolId);

    const categoryTools = this.categoryIndex.get(tool.definition.category) || [];
    this.categoryIndex.set(
      tool.definition.category,
      categoryTools.filter(id => id !== toolId)
    );

    for (const [keyword, tools] of this.capabilityIndex.entries()) {
      this.capabilityIndex.set(
        keyword,
        tools.filter(id => id !== toolId)
      );
    }
  }

  /**
   * Get a tool by ID
   */
  get(toolId: string): Tool | undefined {
    return this.tools.get(toolId);
  }

  /**
   * Check if a tool is registered
   */
  has(toolId: string): boolean {
    return this.tools.has(toolId);
  }

  /**
   * Get all registered tools
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get all tool definitions
   */
  getAllDefinitions(): ToolDefinition[] {
    return this.getAllTools().map(tool => tool.definition);
  }

  /**
   * Get tools by category
   */
  getByCategory(category: ToolCategory): Tool[] {
    const toolIds = this.categoryIndex.get(category) || [];
    return toolIds.map(id => this.tools.get(id)).filter((tool): tool is Tool => tool !== undefined);
  }

  /**
   * Find tools by keyword
   */
  findByKeyword(keyword: string): Tool[] {
    const normalized = keyword.toLowerCase().trim();
    const toolIds = new Set<string>();

    // Search by exact keyword
    if (this.capabilityIndex.has(normalized)) {
      for (const id of this.capabilityIndex.get(normalized) || []) {
        toolIds.add(id);
      }
    }

    // Search by partial keyword
    for (const [key, ids] of this.capabilityIndex.entries()) {
      if (key.includes(normalized) || normalized.includes(key)) {
        for (const id of ids) {
          toolIds.add(id);
        }
      }
    }

    // Search by name
    for (const [id, tool] of this.tools.entries()) {
      if (
        tool.definition.name.toLowerCase().includes(normalized) ||
        tool.definition.description.toLowerCase().includes(normalized)
      ) {
        toolIds.add(id);
      }
    }

    return Array.from(toolIds)
      .map(id => this.tools.get(id))
      .filter((tool): tool is Tool => tool !== undefined);
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
   * Register default built-in tools
   */
  private registerDefaultTools(): void {
    // Workspace tools
    this.register(this.createWorkspaceTool("read_file", "Read file contents", "Read a file from the workspace"));
    this.register(this.createWorkspaceTool("write_file", "Write file", "Write contents to a file"));
    this.register(this.createWorkspaceTool("edit_file", "Edit file", "Apply edits to a file"));
    this.register(this.createWorkspaceTool("delete_file", "Delete file", "Delete a file from the workspace"));
    this.register(this.createWorkspaceTool("rename_file", "Rename file", "Rename a file"));
    this.register(this.createWorkspaceTool("move_file", "Move file", "Move a file"));
    this.register(this.createWorkspaceTool("copy_file", "Copy file", "Copy a file"));
    this.register(this.createWorkspaceTool("create_folder", "Create folder", "Create a directory"));
    this.register(this.createWorkspaceTool("delete_folder", "Delete folder", "Delete a directory"));
    this.register(this.createWorkspaceTool("read_directory", "Read directory", "List directory contents"));
    this.register(this.createWorkspaceTool("scan_project", "Scan project", "Scan project structure"));
    this.register(this.createWorkspaceTool("list_files", "List files", "List files matching pattern"));
    this.register(this.createWorkspaceTool("resolve_imports", "Resolve imports", "Resolve file imports"));
    this.register(this.createWorkspaceTool("read_symbols", "Read symbols", "Read symbols from a file"));

    // Editor tools
    this.register(this.createEditorTool("read_cursor", "Read cursor", "Get current cursor position"));
    this.register(this.createEditorTool("read_selection", "Read selection", "Get current selection"));
    this.register(this.createEditorTool("read_diagnostics", "Read diagnostics", "Get current diagnostics"));
    this.register(this.createEditorTool("read_open_tabs", "Read open tabs", "Get open tabs"));
    this.register(this.createEditorTool("reveal_file", "Reveal file", "Reveal a file in the editor"));
    this.register(this.createEditorTool("open_file", "Open file", "Open a file in the editor"));
    this.register(this.createEditorTool("close_file", "Close file", "Close a file in the editor"));
    this.register(this.createEditorTool("apply_patch", "Apply patch", "Apply a patch to a file"));
    this.register(this.createEditorTool("format_document", "Format document", "Format a document"));

    // Terminal tools
    this.register(this.createTerminalTool("run_command", "Run command", "Run a terminal command"));
    this.register(this.createTerminalTool("run_build", "Run build", "Run a build command"));
    this.register(this.createTerminalTool("run_tests", "Run tests", "Run tests"));
    this.register(this.createTerminalTool("install_package", "Install package", "Install a package"));
    this.register(this.createTerminalTool("run_linter", "Run linter", "Run linter"));
    this.register(this.createTerminalTool("run_formatter", "Run formatter", "Run formatter"));
    this.register(this.createTerminalTool("cancel_process", "Cancel process", "Cancel a running process"));
    this.register(this.createTerminalTool("monitor_process", "Monitor process", "Monitor a process"));

    // Search tools
    this.register(this.createSearchTool("workspace_search", "Workspace search", "Search workspace files"));
    this.register(this.createSearchTool("semantic_search", "Semantic search", "Search semantically"));
    this.register(this.createSearchTool("knowledge_graph_lookup", "Knowledge Graph lookup", "Query knowledge graph"));
    this.register(this.createSearchTool("memory_lookup", "Memory lookup", "Search memory"));
    this.register(this.createSearchTool("documentation_search", "Documentation search", "Search documentation"));
    this.register(this.createSearchTool("web_search", "Web search", "Search the web"));
    this.register(this.createSearchTool("api_search", "API search", "Search API documentation"));

    // AI tools
    this.register(this.createAITool("intent_analysis", "Intent analysis", "Analyze user intent"));
    this.register(this.createAITool("planning", "Planning", "Generate execution plan"));
    this.register(this.createAITool("context_assembly", "Context assembly", "Assemble context"));
    this.register(this.createAITool("code_generation", "Code generation", "Generate code"));
    this.register(this.createAITool("verification", "Verification", "Verify code"));
    this.register(this.createAITool("review", "Review", "Review code"));
    this.register(this.createAITool("summarization", "Summarization", "Summarize content"));
    this.register(this.createAITool("embedding_generation", "Embedding generation", "Generate embeddings"));

    // Runtime tools
    this.register(this.createRuntimeTool("task_scheduler", "Task scheduler", "Schedule tasks"));
    this.register(this.createRuntimeTool("dependency_graph", "Dependency graph", "Build dependency graph"));
    this.register(this.createRuntimeTool("progress_tracker", "Progress tracker", "Track progress"));
    this.register(this.createRuntimeTool("event_dispatcher", "Event dispatcher", "Dispatch events"));
    this.register(this.createRuntimeTool("cancellation", "Cancellation", "Cancel operations"));
    this.register(this.createRuntimeTool("retry_manager", "Retry manager", "Manage retries"));

    // Git tools
    this.register(this.createGitTool("status", "Git status", "Get git status"));
    this.register(this.createGitTool("diff", "Git diff", "Get git diff"));
    this.register(this.createGitTool("stage", "Git stage", "Stage files"));
    this.register(this.createGitTool("commit", "Git commit", "Commit changes"));
    this.register(this.createGitTool("branch", "Git branch", "Manage branches"));
    this.register(this.createGitTool("checkout", "Git checkout", "Checkout branch"));
    this.register(this.createGitTool("history", "Git history", "Get git history"));
    this.register(this.createGitTool("restore", "Git restore", "Restore files"));

    // Browser tools
    this.register(this.createBrowserTool("preview_app", "Preview app", "Preview application"));
    this.register(this.createBrowserTool("reload", "Reload", "Reload browser"));
    this.register(this.createBrowserTool("inspect_console", "Inspect console", "Inspect console logs"));
    this.register(this.createBrowserTool("capture_screenshot", "Capture screenshot", "Capture screenshot"));
    this.register(this.createBrowserTool("collect_network_logs", "Collect network logs", "Collect network logs"));

    // Database tools
    this.register(this.createDatabaseTool("run_sql", "Run SQL", "Execute SQL query"));
    this.register(this.createDatabaseTool("inspect_schema", "Inspect schema", "Inspect database schema"));
    this.register(this.createDatabaseTool("read_tables", "Read tables", "Read database tables"));
    this.register(this.createDatabaseTool("migration", "Migration", "Run database migration"));
    this.register(this.createDatabaseTool("seed", "Seed", "Seed database"));
    this.register(this.createDatabaseTool("backup", "Backup", "Backup database"));

    // Memory tools
    this.register(this.createMemoryTool("retrieve_summaries", "Retrieve summaries", "Retrieve memory summaries"));
    this.register(this.createMemoryTool("store_summary", "Store summary", "Store memory summary"));
    this.register(this.createMemoryTool("update_summary", "Update summary", "Update memory summary"));
    this.register(this.createMemoryTool("delete_memory", "Delete memory", "Delete memory"));
    this.register(this.createMemoryTool("merge_summaries", "Merge summaries", "Merge memory summaries"));
    this.register(this.createMemoryTool("refresh_embeddings", "Refresh embeddings", "Refresh embeddings"));
  }

  /**
   * Create a workspace tool stub
   */
  private createWorkspaceTool(id: string, name: string, description: string): Tool {
    return this.createToolStub(id, name, description, "workspace", "medium");
  }

  private createEditorTool(id: string, name: string, description: string): Tool {
    return this.createToolStub(id, name, description, "editor", "safe");
  }

  private createTerminalTool(id: string, name: string, description: string): Tool {
    return this.createToolStub(id, name, description, "terminal", "high");
  }

  private createSearchTool(id: string, name: string, description: string): Tool {
    return this.createToolStub(id, name, description, "search", "safe");
  }

  private createAITool(id: string, name: string, description: string): Tool {
    return this.createToolStub(id, name, description, "ai", "safe");
  }

  private createRuntimeTool(id: string, name: string, description: string): Tool {
    return this.createToolStub(id, name, description, "runtime", "safe");
  }

  private createGitTool(id: string, name: string, description: string): Tool {
    return this.createToolStub(id, name, description, "git", "medium");
  }

  private createBrowserTool(id: string, name: string, description: string): Tool {
    return this.createToolStub(id, name, description, "browser", "medium");
  }

  private createDatabaseTool(id: string, name: string, description: string): Tool {
    return this.createToolStub(id, name, description, "database", "high");
  }

  private createMemoryTool(id: string, name: string, description: string): Tool {
    return this.createToolStub(id, name, description, "memory", "safe");
  }

  private createToolStub(
    id: string,
    name: string,
    description: string,
    category: ToolCategory,
    permission: "safe" | "medium" | "high" | "critical"
  ): Tool {
    return {
      definition: {
        id,
        name,
        description,
        version: "1.0.0",
        category,
        permissions: permission,
        timeout: 30000,
        retryPolicy: {
          maxAttempts: 2,
          backoffMs: 500,
          backoffMultiplier: 2,
          retryableErrors: ["timeout", "network"],
        },
        inputSchema: {
          type: "object",
          properties: {
            input: {
              type: "string",
              description: "Tool input",
            },
          },
          required: ["input"],
        },
        outputSchema: {
          type: "object",
          properties: {
            output: {
              type: "string",
              description: "Tool output",
            },
          },
          required: ["output"],
        },
        cacheable: category !== "terminal" && category !== "database",
        parallelizable: category !== "database",
      },
      execute: async (request: ToolExecutionRequest): Promise<ToolExecutionResult> => {
        return {
          executionId: request.executionId,
          taskId: request.taskId,
          toolId: id,
          status: "completed" as ToolExecutionStatus,
          success: true,
          output: { result: `Tool ${id} executed with input: ${JSON.stringify(request.input)}` },
          duration: 0,
          startTime: Date.now(),
          endTime: Date.now(),
          retryCount: 0,
          cached: false,
          logs: [],
          artifacts: [],
          metadata: {
            inputSize: JSON.stringify(request.input).length,
            outputSize: 0,
            cacheHit: false,
            permissionLevel: permission,
          },
        };
      },
    };
  }
}
