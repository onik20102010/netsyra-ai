/**
 * Context Assembly Engine
 * 
 * This engine is responsible for building the smallest, most relevant,
 * and highest-quality context for the AI model before every reasoning
 * or code generation request.
 * 
 * It must NEVER generate code, modify files, or execute tools.
 * Its only purpose is to assemble and optimize context.
 */

import type { ExecutionPlan, Task } from "@/ide/intelligence/planning-engine";
import type {
  ContextAssemblyRequest,
  ContextAssemblyResult,
  ContextItem,
  ContextItemType,
  SymbolInfo,
  ContextCacheEntry,
  ContextValidationResult,
  ContextSource,
  ContextLayer,
  CompressionStatistics,
} from "./types";

export class ContextEngine {
  private cache = new Map<string, ContextCacheEntry>();
  private contextHistory = new Map<string, ContextAssemblyResult>();

  /**
   * Main entry point: assemble context for a task or request
   */
  async assemble(request: ContextAssemblyRequest): Promise<ContextAssemblyResult> {
    const startTime = Date.now();
    const contextId = this.generateId();

    // Determine the target task and objective
    const task = request.task;
    const plan = request.plan;
    const currentObjective = task?.title || plan?.projectGoal || "Execute current task";

    // Build context sources status
    const sources = await this.buildContextSources(request);

    // Layer 1: Current task and immediate context
    const layers: ContextLayer[] = [];
    layers.push(this.buildLayer(1, "Current Task", this.buildTaskContext(task, plan), true));

    // Layer 2: Current file and open tabs
    layers.push(this.buildLayer(2, "Current Files", this.buildCurrentFileContext(request), true));

    // Layer 3: Imported files and direct dependencies
    layers.push(this.buildLayer(3, "Dependencies", this.buildDependencyContext(request, task), true));

    // Layer 4: Related components and symbols
    layers.push(this.buildLayer(4, "Related Components", this.buildRelatedComponentContext(request, task), false));

    // Layer 5: Feature and API context
    layers.push(this.buildLayer(5, "Feature Context", this.buildFeatureContext(request, task, plan), false));

    // Layer 6: Architecture and workspace summary
    layers.push(this.buildLayer(6, "Architecture", this.buildArchitectureContext(request, plan), false));

    // Layer 7: Memory and diagnostics
    layers.push(this.buildLayer(7, "Memory & Diagnostics", this.buildMemoryContext(request), false));

    // Flatten all items and rank them
    const allItems = this.flattenAndRankContext(layers, request);

    // Apply model-specific context limits
    const modelType = request.modelType || "code_specialist";
    const maxTokens = request.maxTokens || this.getDefaultMaxTokens(modelType);
    const optimizedItems = this.optimizeContext(allItems, maxTokens, request);

    // Compute statistics
    const originalTokenCount = allItems.reduce((sum, item) => sum + item.tokenCount, 0);
    const tokenCount = optimizedItems.reduce((sum, item) => sum + item.tokenCount, 0);
    const compressionRatio = originalTokenCount > 0 ? (originalTokenCount - tokenCount) / originalTokenCount : 0;
    const cacheHitRate = this.calculateCacheHitRate(optimizedItems);
    const relevanceScore = this.calculateRelevanceScore(optimizedItems);

    // Split items by category
    const categorized = this.categorizeItems(optimizedItems);

    // Validate context
    const validation = this.validateContext(optimizedItems, request);

    const result: ContextAssemblyResult = {
      contextId,
      version: 1,
      timestamp: Date.now(),

      currentObjective,
      currentTask: task,
      taskMetadata: task ? {
        taskId: task.id,
        title: task.title,
        category: task.category,
        priority: task.priority,
      } : undefined,

      relevantFiles: categorized.files,
      relevantSymbols: categorized.symbols,
      relevantComponents: categorized.components,
      relevantApis: categorized.apis,
      relevantRoutes: categorized.routes,
      relevantDatabaseModels: categorized.database,
      relevantConfigurations: categorized.config,

      workspaceSummary: this.buildWorkspaceSummary(request),
      knowledgeGraphNodes: categorized.knowledgeGraph,
      memorySummaries: categorized.memory,
      architectureSummary: this.buildArchitectureSummary(request, plan),
      recentChanges: categorized.recentChanges,
      diagnostics: categorized.diagnostics,
      verificationNotes: categorized.verification,

      allItems: optimizedItems,

      tokenCount,
      originalTokenCount,
      compressionRatio,
      cacheHitRate,
      relevanceScore,
      contextVersion: 1,

      validation,
      sources,
      assembledFor: task?.id || "general",
    };

    this.contextHistory.set(contextId, result);

    return result;
  }

  /**
   * Build context from current task and plan
   */
  private buildTaskContext(task?: Task, plan?: ExecutionPlan): ContextItem[] {
    const items: ContextItem[] = [];

    if (task) {
      items.push({
        id: this.generateId(),
        type: "summary",
        name: "Current Task",
        content: this.summarizeTask(task),
        relevanceScore: 100,
        tokenCount: this.estimateTokens(this.summarizeTask(task)),
        summaryTokenCount: this.estimateTokens(this.summarizeTask(task)),
        source: "planning-engine",
        cached: false,
        compressed: false,
        lastUpdated: Date.now(),
      });
    }

    if (plan) {
      items.push({
        id: this.generateId(),
        type: "summary",
        name: "Execution Plan",
        content: this.summarizePlan(plan),
        relevanceScore: 95,
        tokenCount: this.estimateTokens(this.summarizePlan(plan)),
        summaryTokenCount: this.estimateTokens(this.summarizePlan(plan)),
        source: "planning-engine",
        cached: false,
        compressed: false,
        lastUpdated: Date.now(),
      });
    }

    return items;
  }

  /**
   * Build context from current file and open tabs
   */
  private buildCurrentFileContext(request: ContextAssemblyRequest): ContextItem[] {
    const items: ContextItem[] = [];

    if (request.currentFile) {
      items.push({
        id: this.generateId(),
        type: "file",
        name: request.currentFile,
        location: request.currentFile,
        content: `Current file: ${request.currentFile}`,
        relevanceScore: 98,
        tokenCount: 50,
        summaryTokenCount: 50,
        source: "workspace",
        cached: false,
        compressed: false,
        lastUpdated: Date.now(),
      });
    }

    if (request.openTabs) {
      for (const tab of request.openTabs) {
        if (tab !== request.currentFile) {
          items.push({
            id: this.generateId(),
            type: "file",
            name: tab,
            location: tab,
            content: `Open tab: ${tab}`,
            relevanceScore: 80,
            tokenCount: 30,
            summaryTokenCount: 30,
            source: "workspace",
            cached: false,
            compressed: false,
            lastUpdated: Date.now(),
          });
        }
      }
    }

    if (request.cursorPosition) {
      items.push({
        id: this.generateId(),
        type: "summary",
        name: "Cursor Position",
        content: `Cursor at line ${request.cursorPosition.line}, column ${request.cursorPosition.column}`,
        relevanceScore: 90,
        tokenCount: 20,
        summaryTokenCount: 20,
        source: "workspace",
        cached: false,
        compressed: false,
        lastUpdated: Date.now(),
      });
    }

    return items;
  }

  /**
   * Build dependency context from task requirements
   */
  private buildDependencyContext(request: ContextAssemblyRequest, task?: Task): ContextItem[] {
    const items: ContextItem[] = [];
    const contextFiles = task?.requiredContext?.files || [];
    const contextFolders = task?.requiredContext?.folders || [];
    const contextApis = task?.requiredContext?.apis || [];
    const contextModules = task?.requiredContext?.modules || [];
    const contextComponents = task?.requiredContext?.components || [];
    const contextSymbols = task?.requiredContext?.symbols || [];

    for (const file of contextFiles) {
      items.push(this.createContextItem("file", file, file, `File required for context: ${file}`, 96, "workspace"));
    }

    for (const folder of contextFolders) {
      items.push(this.createContextItem("summary", folder, folder, `Folder: ${folder}`, 70, "workspace"));
    }

    for (const api of contextApis) {
      items.push(this.createContextItem("api", api, api, `API: ${api}`, 86, "workspace"));
    }

    for (const module of contextModules) {
      items.push(this.createContextItem("summary", module, module, `Module: ${module}`, 84, "workspace"));
    }

    for (const component of contextComponents) {
      items.push(this.createContextItem("component", component, component, `Component: ${component}`, 92, "workspace"));
    }

    for (const symbol of contextSymbols) {
      items.push(this.createContextItem("symbol", symbol, symbol, `Symbol: ${symbol}`, 94, "workspace"));
    }

    return items;
  }

  /**
   * Build related component context
   */
  private buildRelatedComponentContext(request: ContextAssemblyRequest, task?: Task): ContextItem[] {
    const items: ContextItem[] = [];

    // Use feature hints from task or request
    const features = this.extractFeatureHints(task, request);

    for (const feature of features) {
      items.push(this.createContextItem("component", feature, feature, `Related component: ${feature}`, 85, "knowledge_graph"));
    }

    return items;
  }

  /**
   * Build feature and API context
   */
  private buildFeatureContext(request: ContextAssemblyRequest, task?: Task, plan?: ExecutionPlan): ContextItem[] {
    const items: ContextItem[] = [];

    if (plan) {
      for (const note of plan.architectureNotes) {
        items.push(this.createContextItem("architecture", `arch-${note}`, undefined, note, 75, "planning-engine"));
      }
    }

    return items;
  }

  /**
   * Build architecture and workspace context
   */
  private buildArchitectureContext(request: ContextAssemblyRequest, plan?: ExecutionPlan): ContextItem[] {
    const items: ContextItem[] = [];

    if (plan) {
      items.push(this.createContextItem("summary", "Implementation Strategy", undefined, plan.implementationStrategy, 72, "planning-engine"));
      items.push(this.createContextItem("summary", "Execution Strategy", undefined, plan.executionStrategy, 70, "planning-engine"));
    }

    const workspaceSummary = request.workspaceId ? `Workspace: ${request.workspaceId}` : "Workspace summary";
    items.push(this.createContextItem("workspace", "Workspace Summary", undefined, workspaceSummary, 60, "workspace"));

    return items;
  }

  /**
   * Build memory and diagnostics context
   */
  private buildMemoryContext(request: ContextAssemblyRequest): ContextItem[] {
    const items: ContextItem[] = [];

    if (request.currentErrors && request.currentErrors.length > 0) {
      for (const error of request.currentErrors) {
        items.push(this.createContextItem("diagnostic", `error-${error}`, undefined, error, 88, "diagnostics"));
      }
    }

    if (request.recentEdits && request.recentEdits.length > 0) {
      for (const edit of request.recentEdits) {
        items.push(this.createContextItem("summary", `edit-${edit}`, undefined, edit, 75, "memory"));
      }
    }

    return items;
  }

  /**
   * Create a context item with consistent defaults
   */
  private createContextItem(
    type: ContextItemType,
    name: string,
    location: string | undefined,
    content: string,
    relevanceScore: number,
    source: string
  ): ContextItem {
    const cacheKey = `${type}:${name}`;
    const cached = this.cache.has(cacheKey);

    return {
      id: this.generateId(),
      type,
      name,
      location,
      content,
      relevanceScore,
      tokenCount: this.estimateTokens(content),
      summaryTokenCount: this.estimateTokens(content),
      source,
      cached,
      compressed: false,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Build a context layer
   */
  private buildLayer(level: number, name: string, items: ContextItem[], expandIfNeeded: boolean): ContextLayer {
    return {
      level,
      name,
      items,
      tokenCount: items.reduce((sum, item) => sum + item.tokenCount, 0),
      expandIfNeeded,
    };
  }

  /**
   * Flatten all layers and rank by relevance score
   */
  private flattenAndRankContext(layers: ContextLayer[], request: ContextAssemblyRequest): ContextItem[] {
    const allItems: ContextItem[] = [];
    for (const layer of layers.sort((a, b) => a.level - b.level)) {
      for (const item of layer.items) {
        // Boost relevance for lower layers (closer to current task)
        const layerBoost = Math.max(0, (7 - layer.level) * 2);
        allItems.push({
          ...item,
          relevanceScore: Math.min(100, item.relevanceScore + layerBoost),
        });
      }
    }

    // Remove duplicates and sort by relevance
    const seen = new Set<string>();
    const unique = allItems.filter(item => {
      const key = `${item.type}:${item.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return unique.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Optimize context to fit within token budget
   */
  private optimizeContext(items: ContextItem[], maxTokens: number, request: ContextAssemblyRequest): ContextItem[] {
    const optimized: ContextItem[] = [];
    let tokenCount = 0;

    // First pass: include high-relevance items
    const sortedItems = [...items].sort((a, b) => b.relevanceScore - a.relevanceScore);

    for (const item of sortedItems) {
      if (tokenCount + item.tokenCount <= maxTokens) {
        optimized.push(item);
        tokenCount += item.tokenCount;
      } else if (item.relevanceScore >= 90) {
        // For very high relevance items, compress instead of dropping
        const compressed = this.compressItem(item);
        if (tokenCount + compressed.tokenCount <= maxTokens) {
          optimized.push(compressed);
          tokenCount += compressed.tokenCount;
        }
      }
    }

    return optimized;
  }

  /**
   * Compress a context item by creating a summary
   */
  private compressItem(item: ContextItem): ContextItem {
    if (item.summary && item.tokenCount > item.summaryTokenCount) {
      return {
        ...item,
        content: item.summary,
        tokenCount: item.summaryTokenCount,
        compressed: true,
      };
    }

    // Simple compression: truncate with ellipsis
    const words = item.content.split(" ");
    if (words.length > 20) {
      const summary = words.slice(0, 20).join(" ") + "...";
      return {
        ...item,
        content: summary,
        tokenCount: this.estimateTokens(summary),
        compressed: true,
      };
    }

    return item;
  }

  /**
   * Categorize items by type
   */
  private categorizeItems(items: ContextItem[]): {
    files: ContextItem[];
    symbols: ContextItem[];
    components: ContextItem[];
    apis: ContextItem[];
    routes: ContextItem[];
    database: ContextItem[];
    config: ContextItem[];
    knowledgeGraph: ContextItem[];
    memory: ContextItem[];
    recentChanges: ContextItem[];
    diagnostics: ContextItem[];
    verification: ContextItem[];
  } {
    return {
      files: items.filter(i => i.type === "file"),
      symbols: items.filter(i => i.type === "symbol"),
      components: items.filter(i => i.type === "component"),
      apis: items.filter(i => i.type === "api"),
      routes: items.filter(i => i.type === "route"),
      database: items.filter(i => i.type === "database"),
      config: items.filter(i => i.type === "config"),
      knowledgeGraph: items.filter(i => i.type === "knowledge_graph"),
      memory: items.filter(i => i.type === "memory"),
      recentChanges: items.filter(i => i.type === "summary" && i.source === "memory"),
      diagnostics: items.filter(i => i.type === "diagnostic"),
      verification: items.filter(i => i.type === "verification"),
    };
  }

  /**
   * Validate assembled context
   */
  private validateContext(items: ContextItem[], request: ContextAssemblyRequest): ContextValidationResult {
    const duplicateFiles: string[] = [];
    const duplicateSummaries: string[] = [];
    const missingDependencies: string[] = [];
    const brokenReferences: string[] = [];
    const unnecessaryFiles: string[] = [];
    const staleCache: string[] = [];
    const outdatedSummaries: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    const fileNames = new Set<string>();
    const summaryNames = new Set<string>();

    for (const item of items) {
      if (item.type === "file" && item.name) {
        if (fileNames.has(item.name)) {
          duplicateFiles.push(item.name);
        }
        fileNames.add(item.name);
      }

      if (item.type === "summary" && item.name) {
        if (summaryNames.has(item.name)) {
          duplicateSummaries.push(item.name);
        }
        summaryNames.add(item.name);
      }

      if (item.relevanceScore < 30) {
        unnecessaryFiles.push(item.name);
      }

      if (item.cached && Date.now() - item.lastUpdated > 300000) {
        staleCache.push(item.name);
      }
    }

    if (items.length === 0) {
      errors.push("No context items assembled");
    }

    if (items.some(i => i.tokenCount > 5000)) {
      warnings.push("Some context items are very large");
    }

    const valid = errors.length === 0;

    return {
      valid,
      duplicateFiles,
      duplicateSummaries,
      missingDependencies,
      brokenReferences,
      unnecessaryFiles,
      staleCache,
      outdatedSummaries,
      errors,
      warnings,
    };
  }

  /**
   * Build workspace summary
   */
  private buildWorkspaceSummary(request: ContextAssemblyRequest): string {
    const parts: string[] = [];
    if (request.workspaceId) parts.push(`Workspace: ${request.workspaceId}`);
    if (request.currentFile) parts.push(`Current file: ${request.currentFile}`);
    if (request.openTabs) parts.push(`Open tabs: ${request.openTabs.length}`);
    return parts.join(" | ");
  }

  /**
   * Build architecture summary
   */
  private buildArchitectureSummary(request: ContextAssemblyRequest, plan?: ExecutionPlan): string {
    if (plan) {
      return plan.implementationStrategy;
    }
    return "Architecture summary not available";
  }

  /**
   * Build context sources status
   */
  private async buildContextSources(request: ContextAssemblyRequest): Promise<ContextSource[]> {
    return [
      { id: "workspace", type: "workspace", priority: 1, isReady: !!request.workspaceId },
      { id: "knowledge_graph", type: "knowledge_graph", priority: 2, isReady: true },
      { id: "plan", type: "plan", priority: 3, isReady: !!request.plan },
      { id: "task", type: "task", priority: 4, isReady: !!request.task },
      { id: "memory", type: "memory", priority: 5, isReady: true },
    ];
  }

  /**
   * Extract feature hints from task and request
   */
  private extractFeatureHints(task?: Task, request?: ContextAssemblyRequest): string[] {
    const hints: string[] = [];
    const taskContext = task?.requiredContext;
    if (taskContext?.components) {
      hints.push(...taskContext.components);
    }
    if (taskContext?.modules) {
      hints.push(...taskContext.modules);
    }
    return hints;
  }

  /**
   * Summarize a task for context
   */
  private summarizeTask(task: Task): string {
    return `Task: ${task.title}. Description: ${task.description}. Expected output: ${task.expectedOutput}.`;
  }

  /**
   * Summarize a plan for context
   */
  private summarizePlan(plan: ExecutionPlan): string {
    return `Plan: ${plan.projectGoal}. Strategy: ${plan.executionStrategy}. Tasks: ${plan.tasks.length}.`;
  }

  /**
   * Estimate token count from text
   */
  private estimateTokens(text: string): number {
    return Math.max(1, Math.ceil(text.length / 4));
  }

  /**
   * Get default max tokens for model type
   */
  private getDefaultMaxTokens(modelType: string): number {
    const map: Record<string, number> = {
      fast: 4000,
      reasoning: 8000,
      long_context: 16000,
      code_specialist: 12000,
      verification: 6000,
    };
    return map[modelType] || 12000;
  }

  /**
   * Calculate cache hit rate
   */
  private calculateCacheHitRate(items: ContextItem[]): number {
    if (items.length === 0) return 0;
    const cached = items.filter(i => i.cached).length;
    return cached / items.length;
  }

  /**
   * Calculate average relevance score
   */
  private calculateRelevanceScore(items: ContextItem[]): number {
    if (items.length === 0) return 0;
    const sum = items.reduce((acc, item) => acc + item.relevanceScore, 0);
    return sum / items.length;
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get cached context
   */
  getCachedContext(contextId: string): ContextAssemblyResult | undefined {
    return this.contextHistory.get(contextId);
  }

  /**
   * Get cache entry
   */
  getCacheEntry(key: string): ContextCacheEntry | undefined {
    return this.cache.get(key);
  }

  /**
   * Update cache entry
   */
  updateCache(key: string, entry: ContextCacheEntry): void {
    this.cache.set(key, entry);
  }

  /**
   * Clear context history
   */
  clearHistory(): void {
    this.contextHistory.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; historySize: number } {
    return {
      size: this.cache.size,
      historySize: this.contextHistory.size,
    };
  }
}
