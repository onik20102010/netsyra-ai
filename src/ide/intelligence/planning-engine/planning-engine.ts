/**
 * Planning & Task Decomposition Engine
 * 
 * This engine receives the structured output from the Intent Engine
 * and transforms it into a complete execution strategy.
 * 
 * It must NEVER generate code, edit files, or execute tools.
 * Its only purpose is to produce the best possible execution plan.
 */

import type { IntentAnalysisResult } from "@/ide/intelligence/intent-engine";
import type {
  PlanningEngineInput,
  ExecutionPlan,
  Task,
  TaskCategory,
  TaskPriority,
  TaskComplexity,
  TaskDependency,
  ParallelGroup,
  Blocker,
  PlanRisk,
  TokenBudget,
  VerificationStrategy,
  RollbackStrategy,
  ReusableComponent,
  ExecutionMetadata,
  MilestoneBatch,
  ContextRequirement,
  PlanDiff,
  ExecutionStrategy,
  VerificationMethod,
} from "./types";

export class PlanningEngine {
  private planHistory = new Map<string, ExecutionPlan>();

  /**
   * Main entry point: create a complete execution plan from intent analysis
   */
  async plan(input: PlanningEngineInput): Promise<ExecutionPlan> {
    const intent = input.intentAnalysis;

    // If we have a previous plan and the changes are incremental, reuse it
    if (input.previousPlan && this.isIncrementalPlan(input)) {
      return this.updatePlan(input.previousPlan, input);
    }

    // Refine the goal and create implementation strategy
    const projectGoal = this.refineGoal(intent);
    const executionStrategy = this.determineExecutionStrategy(intent);
    const implementationStrategy = this.buildImplementationStrategy(intent, projectGoal);

    // Decompose into atomic tasks
    const tasks = this.decomposeIntoTasks(intent, projectGoal);

    // Detect dependencies and execution order
    const dependencies = this.detectDependencies(tasks, intent);
    const executionOrder = this.computeExecutionOrder(tasks, dependencies);

    // Detect parallel groups
    const parallelGroups = this.detectParallelGroups(tasks, dependencies, executionOrder);

    // Detect blockers and risks
    const blockers = this.detectBlockers(intent, tasks);
    const risks = this.assessRisks(intent, tasks);

    // Optimize context
    const contextRequirements = this.optimizeContext(intent, tasks);

    // Plan token budget
    const tokenBudget = this.planTokenBudget(intent, tasks);

    // Build verification and rollback strategies
    const verificationStrategy = this.buildVerificationStrategy(intent, tasks);
    const rollbackStrategy = this.buildRollbackStrategy(intent, tasks);

    // Find reusable components
    const reusableComponents = this.detectReusableComponents(intent, tasks);

    // Build execution metadata
    const executionMetadata = this.buildExecutionMetadata(tasks, parallelGroups, tokenBudget);

    // Compose the final plan
    const plan: ExecutionPlan = {
      planId: this.generateId(),
      version: 1,
      timestamp: Date.now(),
      userId: input.userId,
      workspaceId: input.workspaceId,

      projectGoal,
      executionStrategy: executionStrategy as ExecutionStrategy,
      implementationStrategy,

      tasks,
      dependencies,
      executionOrder,
      parallelGroups,

      blockers,
      risks,
      contextRequirements,
      tokenBudget,
      verificationStrategy,
      rollbackStrategy,
      architectureNotes: this.buildArchitectureNotes(intent),
      planningSummary: this.buildPlanningSummary(tasks, projectGoal),
      executionMetadata,
      planningConfidence: this.calculatePlanningConfidence(intent, tasks, blockers),
      reusableComponents,
      isIncremental: false,
    };

    this.planHistory.set(plan.planId, plan);
    return plan;
  }

  /**
   * Update an existing plan incrementally
   */
  private async updatePlan(previousPlan: ExecutionPlan, input: PlanningEngineInput): Promise<ExecutionPlan> {
    const diff = this.diffPlan(previousPlan, input);

    const updatedTasks = [
      ...previousPlan.tasks.filter(t => !diff.removed.find(r => r.id === t.id)),
      ...diff.added,
      ...diff.modified,
    ];

    const updatedDependencies = [
      ...previousPlan.dependencies.filter(d => !diff.removedDependencies.find(r => r.fromTaskId === d.fromTaskId && r.toTaskId === d.toTaskId)),
      ...diff.newDependencies,
    ];

    const executionOrder = this.computeExecutionOrder(updatedTasks, updatedDependencies);
    const parallelGroups = this.detectParallelGroups(updatedTasks, updatedDependencies, executionOrder);

    const plan: ExecutionPlan = {
      ...previousPlan,
      planId: this.generateId(),
      version: previousPlan.version + 1,
      timestamp: Date.now(),
      tasks: updatedTasks,
      dependencies: updatedDependencies,
      executionOrder,
      parallelGroups,
      blockers: [...previousPlan.blockers, ...diff.updatedBlockers],
      risks: [...previousPlan.risks, ...diff.updatedRisks],
      contextRequirements: this.optimizeContext(input.intentAnalysis, updatedTasks),
      tokenBudget: this.planTokenBudget(input.intentAnalysis, updatedTasks),
      executionMetadata: this.buildExecutionMetadata(updatedTasks, parallelGroups, this.planTokenBudget(input.intentAnalysis, updatedTasks)),
      isIncremental: true,
      previousPlanId: previousPlan.planId,
    };

    this.planHistory.set(plan.planId, plan);
    return plan;
  }

  /**
   * Refine the user's objective into implementation goals
   */
  private refineGoal(intent: IntentAnalysisResult): string {
    let goal = intent.primaryGoal;

    // Add context from intent types
    if (intent.intentTypes.length > 0) {
      const categories = intent.intentTypes.map(t => t.category).join(", ");
      goal = `${intent.primaryGoal} (intent: ${categories})`;
    }

    // Add scope context
    if (intent.affectedScope) {
      goal = `${goal} [scope: ${intent.affectedScope}]`;
    }

    return goal;
  }

  /**
   * Determine execution strategy from intent analysis
   */
  private determineExecutionStrategy(intent: IntentAnalysisResult): string {
    return intent.executionStrategy;
  }

  /**
   * Build implementation strategy text
   */
  private buildImplementationStrategy(intent: IntentAnalysisResult, goal: string): string {
    const strategies: string[] = [];

    // Base strategy from execution strategy
    const strategyMap: Record<string, string> = {
      simple_edit: "Apply minimal targeted changes to the affected files",
      patch: "Use patch-based edits to preserve surrounding code context",
      full_feature: "Implement new feature with proper structure, tests, and documentation",
      large_refactor: "Refactor incrementally while maintaining tests and behavior",
      incremental_implementation: "Break into milestones and implement progressively with verification",
      parallel_implementation: "Execute independent frontend, backend, and configuration tasks in parallel",
    };

    strategies.push(strategyMap[intent.executionStrategy] || "Implement according to the identified intent");

    // Add constraint-aware strategy
    if (intent.constraints.length > 0) {
      strategies.push(`Respect constraints: ${intent.constraints.map(c => c.description).join("; ")}`);
    }

    // Add reuse strategy
    if (intent.affectedFeatures.length > 0) {
      strategies.push(`Investigate existing features: ${intent.affectedFeatures.join(", ")}`);
    }

    return strategies.join(". ");
  }

  /**
   * Decompose intent into atomic tasks
   */
  private decomposeIntoTasks(intent: IntentAnalysisResult, goal: string): Task[] {
    const tasks: Task[] = [];
    const intents = intent.intentTypes.map(t => t.category);

    // Always start with workspace/context analysis tasks
    tasks.push(this.createTask({
      title: "Analyze workspace context",
      description: "Review current file, open tabs, and workspace summary to understand the starting point",
      category: "workspace_analysis",
      priority: this.mapPriority(intent.planningMetadata.priority),
      complexity: "very_small",
      dependencies: [],
      requiredContext: intent.recommendedContext,
      expectedOutput: "Summary of relevant workspace context",
      canParallelize: false,
    }));

    tasks.push(this.createTask({
      title: "Gather required context",
      description: "Load the minimum set of files, components, and APIs needed for the plan",
      category: "context",
      priority: "high",
      complexity: "very_small",
      dependencies: [tasks[0].id],
      requiredContext: intent.recommendedContext,
      expectedOutput: "Loaded context references",
      canParallelize: false,
    }));

    // Add intent-specific tasks
    if (intents.includes("create") || intents.includes("generate") || intents.includes("implement")) {
      tasks.push(...this.buildCreateTasks(intent, tasks));
    }

    if (intents.includes("edit")) {
      tasks.push(...this.buildEditTasks(intent, tasks));
    }

    if (intents.includes("delete")) {
      tasks.push(...this.buildDeleteTasks(intent, tasks));
    }

    if (intents.includes("fix") || intents.includes("debug")) {
      tasks.push(...this.buildFixTasks(intent, tasks));
    }

    if (intents.includes("refactor") || intents.includes("optimize")) {
      tasks.push(...this.buildRefactorTasks(intent, tasks));
    }

    if (intents.includes("test")) {
      tasks.push(...this.buildTestTasks(intent, tasks));
    }

    if (intents.includes("document")) {
      tasks.push(...this.buildDocumentTasks(intent, tasks));
    }

    if (intents.includes("configure") || intents.includes("upgrade") || intents.includes("migrate")) {
      tasks.push(...this.buildConfigTasks(intent, tasks));
    }

    // Add verification tasks
    tasks.push(this.createTask({
      title: "Verify implementation",
      description: "Run verification steps to ensure changes are correct and safe",
      category: "verify",
      priority: "high",
      complexity: this.mapComplexity(intent.complexity),
      dependencies: this.getLastTaskIds(tasks, 2),
      requiredContext: { ...intent.recommendedContext, reason: "Verification requires changed files and tests" },
      expectedOutput: "Verification results and pass/fail status",
      canParallelize: false,
    }));

    // Add final review/memory update task
    tasks.push(this.createTask({
      title: "Review and summarize changes",
      description: "Review the completed work and prepare a summary for the user and memory system",
      category: "review",
      priority: "medium",
      complexity: "very_small",
      dependencies: [tasks[tasks.length - 1].id],
      requiredContext: { ...intent.recommendedContext, reason: "Final review requires all changed files" },
      expectedOutput: "Summary of changes and verification results",
      canParallelize: false,
    }));

    return tasks;
  }

  /**
   * Build create/generate tasks
   */
  private buildCreateTasks(intent: IntentAnalysisResult, existingTasks: Task[]): Task[] {
    const tasks: Task[] = [];
    const lastId = existingTasks[existingTasks.length - 1]?.id;

    tasks.push(this.createTask({
      title: "Design new component structure",
      description: "Determine files, exports, and placement for the new implementation",
      category: "planning",
      priority: "high",
      complexity: "small",
      dependencies: [lastId],
      requiredContext: intent.recommendedContext,
      expectedOutput: "Component/file structure plan",
      canParallelize: false,
    }));

    tasks.push(this.createTask({
      title: "Create new files",
      description: "Generate the new files with correct structure and conventions",
      category: "create_file",
      priority: "high",
      complexity: this.mapComplexity(intent.complexity),
      dependencies: [tasks[0].id],
      requiredContext: intent.recommendedContext,
      expectedOutput: "New files created with implementations",
      canParallelize: false,
    }));

    if (intent.affectedScope === "api" || intent.affectedScope === "route" || intent.affectedFeatures.includes("api")) {
      tasks.push(this.createTask({
        title: "Create API endpoints",
        description: "Create backend routes, handlers, and validation for the new feature",
        category: "api",
        priority: "high",
        complexity: this.mapComplexity(intent.complexity),
        dependencies: [tasks[0].id],
        requiredContext: { ...intent.recommendedContext, reason: "API creation requires route and middleware context" },
        expectedOutput: "New API endpoints implemented",
        canParallelize: true,
      }));
    }

    if (intent.affectedScope === "component" || intent.affectedFeatures.includes("ui")) {
      tasks.push(this.createTask({
        title: "Create UI components",
        description: "Create frontend components and integrate with existing UI",
        category: "frontend",
        priority: "high",
        complexity: this.mapComplexity(intent.complexity),
        dependencies: [tasks[0].id],
        requiredContext: { ...intent.recommendedContext, reason: "UI creation requires component and style context" },
        expectedOutput: "New UI components implemented",
        canParallelize: true,
      }));
    }

    return tasks;
  }

  /**
   * Build edit tasks
   */
  private buildEditTasks(intent: IntentAnalysisResult, existingTasks: Task[]): Task[] {
    const tasks: Task[] = [];
    const lastId = existingTasks[existingTasks.length - 1]?.id;

    tasks.push(this.createTask({
      title: "Identify files to edit",
      description: "Determine which existing files need modifications and why",
      category: "planning",
      priority: "high",
      complexity: "small",
      dependencies: [lastId],
      requiredContext: intent.recommendedContext,
      expectedOutput: "List of files to edit with change descriptions",
      canParallelize: false,
    }));

    tasks.push(this.createTask({
      title: "Apply edits",
      description: "Modify existing files according to the requirements",
      category: "edit_file",
      priority: "high",
      complexity: this.mapComplexity(intent.complexity),
      dependencies: [tasks[0].id],
      requiredContext: intent.recommendedContext,
      expectedOutput: "Files edited with required changes",
      canParallelize: false,
    }));

    return tasks;
  }

  /**
   * Build delete tasks
   */
  private buildDeleteTasks(intent: IntentAnalysisResult, existingTasks: Task[]): Task[] {
    const tasks: Task[] = [];
    const lastId = existingTasks[existingTasks.length - 1]?.id;

    tasks.push(this.createTask({
      title: "Identify files and references to remove",
      description: "Find all files, imports, and references that must be removed",
      category: "search",
      priority: "high",
      complexity: "small",
      dependencies: [lastId],
      requiredContext: intent.recommendedContext,
      expectedOutput: "List of files and references to remove",
      canParallelize: false,
    }));

    tasks.push(this.createTask({
      title: "Remove files and references",
      description: "Delete files and update references safely",
      category: "delete_file",
      priority: "high",
      complexity: "small",
      dependencies: [tasks[0].id],
      requiredContext: intent.recommendedContext,
      expectedOutput: "Files removed and references cleaned up",
      canParallelize: false,
    }));

    return tasks;
  }

  /**
   * Build fix/debug tasks
   */
  private buildFixTasks(intent: IntentAnalysisResult, existingTasks: Task[]): Task[] {
    const tasks: Task[] = [];
    const lastId = existingTasks[existingTasks.length - 1]?.id;

    tasks.push(this.createTask({
      title: "Investigate issue",
      description: "Reproduce and identify the root cause of the issue",
      category: "workspace_analysis",
      priority: "high",
      complexity: "small",
      dependencies: [lastId],
      requiredContext: intent.recommendedContext,
      expectedOutput: "Root cause analysis",
      canParallelize: false,
    }));

    tasks.push(this.createTask({
      title: "Apply fix",
      description: "Implement the fix based on the root cause analysis",
      category: "edit_file",
      priority: "high",
      complexity: this.mapComplexity(intent.complexity),
      dependencies: [tasks[0].id],
      requiredContext: intent.recommendedContext,
      expectedOutput: "Bug fixed and behavior verified",
      canParallelize: false,
    }));

    return tasks;
  }

  /**
   * Build refactor/optimize tasks
   */
  private buildRefactorTasks(intent: IntentAnalysisResult, existingTasks: Task[]): Task[] {
    const tasks: Task[] = [];
    const lastId = existingTasks[existingTasks.length - 1]?.id;

    tasks.push(this.createTask({
      title: "Analyze current implementation",
      description: "Review current code and identify refactoring targets",
      category: "review",
      priority: "high",
      complexity: "small",
      dependencies: [lastId],
      requiredContext: intent.recommendedContext,
      expectedOutput: "Refactoring targets identified",
      canParallelize: false,
    }));

    tasks.push(this.createTask({
      title: "Apply refactoring",
      description: "Restructure code while preserving behavior",
      category: "edit_file",
      priority: "high",
      complexity: this.mapComplexity(intent.complexity),
      dependencies: [tasks[0].id],
      requiredContext: intent.recommendedContext,
      expectedOutput: "Refactored code with same behavior",
      canParallelize: false,
    }));

    return tasks;
  }

  /**
   * Build test/verify tasks
   */
  private buildTestTasks(intent: IntentAnalysisResult, existingTasks: Task[]): Task[] {
    const tasks: Task[] = [];
    const lastId = existingTasks[existingTasks.length - 1]?.id;

    tasks.push(this.createTask({
      title: "Identify test requirements",
      description: "Determine what tests are needed for the changes",
      category: "testing",
      priority: "high",
      complexity: "small",
      dependencies: [lastId],
      requiredContext: intent.recommendedContext,
      expectedOutput: "Test coverage plan",
      canParallelize: false,
    }));

    tasks.push(this.createTask({
      title: "Create or update tests",
      description: "Add or update tests to cover the changes",
      category: "testing",
      priority: "high",
      complexity: this.mapComplexity(intent.complexity),
      dependencies: [tasks[0].id],
      requiredContext: { ...intent.recommendedContext, reason: "Tests require implementation files" },
      expectedOutput: "Tests created or updated",
      canParallelize: true,
    }));

    return tasks;
  }

  /**
   * Build documentation tasks
   */
  private buildDocumentTasks(intent: IntentAnalysisResult, existingTasks: Task[]): Task[] {
    const tasks: Task[] = [];
    const lastId = existingTasks[existingTasks.length - 1]?.id;

    tasks.push(this.createTask({
      title: "Update documentation",
      description: "Add or update documentation for the changes",
      category: "documentation",
      priority: "medium",
      complexity: "small",
      dependencies: [lastId],
      requiredContext: intent.recommendedContext,
      expectedOutput: "Documentation updated",
      canParallelize: true,
    }));

    return tasks;
  }

  /**
   * Build configuration/upgrade/migrate tasks
   */
  private buildConfigTasks(intent: IntentAnalysisResult, existingTasks: Task[]): Task[] {
    const tasks: Task[] = [];
    const lastId = existingTasks[existingTasks.length - 1]?.id;

    tasks.push(this.createTask({
      title: "Update configuration files",
      description: "Modify configuration, dependencies, or environment files as needed",
      category: "configuration",
      priority: "high",
      complexity: "small",
      dependencies: [lastId],
      requiredContext: intent.recommendedContext,
      expectedOutput: "Configuration files updated",
      canParallelize: false,
    }));

    if (intent.intentTypes.some(t => t.category === "migrate" || t.category === "upgrade")) {
      tasks.push(this.createTask({
        title: "Plan migration steps",
        description: "Identify migration steps, breaking changes, and rollback options",
        category: "planning",
        priority: "high",
        complexity: "small",
        dependencies: [tasks[0].id],
        requiredContext: intent.recommendedContext,
        expectedOutput: "Migration plan with rollback options",
        canParallelize: false,
      }));
    }

    return tasks;
  }

  /**
   * Create a task with defaults and metadata
   */
  private createTask(options: {
    title: string;
    description: string;
    category: TaskCategory;
    priority: TaskPriority;
    complexity: TaskComplexity;
    dependencies: string[];
    requiredContext: ContextRequirement;
    expectedOutput: string;
    canParallelize: boolean;
  }): Task {
    const id = this.generateId();
    const duration = this.estimateDuration(options.complexity);
    const tokens = this.estimateTaskTokens(options.complexity, options.category);

    return {
      id,
      title: options.title,
      description: options.description,
      category: options.category,
      priority: options.priority,
      complexity: options.complexity,
      estimatedDuration: duration,
      estimatedTokens: tokens,
      dependencies: options.dependencies,
      requiredContext: options.requiredContext,
      expectedOutput: options.expectedOutput,
      possibleRisks: this.deriveTaskRisks(options.category),
      verification: this.deriveTaskVerification(options.category),
      rollbackStrategy: this.deriveTaskRollback(options.category),
      completionCriteria: [options.expectedOutput, "No errors or regressions"],
      status: "pending",
      retryPolicy: {
        maxAttempts: options.category === "terminal" ? 3 : 2,
        backoffMs: 500,
        retryableErrors: ["timeout", "transient", "temporary"],
      },
      canParallelize: options.canParallelize,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  /**
   * Detect dependencies between tasks
   */
  private detectDependencies(tasks: Task[], intent: IntentAnalysisResult): TaskDependency[] {
    const dependencies: TaskDependency[] = [];

    for (const task of tasks) {
      // Add explicit dependencies as dependency edges
      for (const depId of task.dependencies) {
        dependencies.push({
          fromTaskId: depId,
          toTaskId: task.id,
          type: "requires",
          reason: `Task "${task.title}" requires completion of dependency task`,
        });
      }

      // Add category-based dependencies
      if (task.category === "edit_file" || task.category === "create_file") {
        const contextTask = tasks.find(t => t.category === "context");
        if (contextTask && !task.dependencies.includes(contextTask.id)) {
          dependencies.push({
            fromTaskId: contextTask.id,
            toTaskId: task.id,
            type: "requires",
            reason: "File operations require context assembly",
          });
        }
      }

      if (task.category === "verify") {
        const editTasks = tasks.filter(t => t.category === "edit_file" || t.category === "create_file" || t.category === "delete_file");
        for (const editTask of editTasks) {
          if (!task.dependencies.includes(editTask.id)) {
            dependencies.push({
              fromTaskId: editTask.id,
              toTaskId: task.id,
              type: "requires",
              reason: "Verification must run after code changes",
            });
          }
        }
      }
    }

    return dependencies;
  }

  /**
   * Compute topological execution order
   */
  private computeExecutionOrder(tasks: Task[], dependencies: TaskDependency[]): string[] {
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialize
    for (const task of tasks) {
      graph.set(task.id, []);
      inDegree.set(task.id, 0);
    }

    // Build graph and in-degrees
    for (const dep of dependencies) {
      if (dep.type === "requires" || dep.type === "depends_on") {
        graph.get(dep.fromTaskId)?.push(dep.toTaskId);
        inDegree.set(dep.toTaskId, (inDegree.get(dep.toTaskId) || 0) + 1);
      }
    }

    // Start with tasks that have no dependencies
    const queue: string[] = [];
    for (const [taskId, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(taskId);
      }
    }

    const order: string[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      order.push(current);

      const neighbors = graph.get(current) || [];
      for (const neighbor of neighbors) {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }

    // If not all tasks are in order, there is a cycle
    if (order.length !== tasks.length) {
      // Add remaining tasks in arbitrary order
      const remaining = tasks.filter(t => !order.includes(t.id)).map(t => t.id);
      order.push(...remaining);
    }

    return order;
  }

  /**
   * Detect parallel execution groups
   */
  private detectParallelGroups(tasks: Task[], dependencies: TaskDependency[], executionOrder: string[]): ParallelGroup[] {
    const groups: ParallelGroup[] = [];
    const processed = new Set<string>();
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    // Build reverse dependency graph for quick lookups
    const dependsOn = new Map<string, string[]>();
    for (const dep of dependencies) {
      if (dep.type === "requires" || dep.type === "depends_on") {
        if (!dependsOn.has(dep.toTaskId)) {
          dependsOn.set(dep.toTaskId, []);
        }
        dependsOn.get(dep.toTaskId)!.push(dep.fromTaskId);
      }
    }

    let batchNumber = 0;
    while (processed.size < tasks.length) {
      batchNumber++;
      const batch: string[] = [];

      for (const taskId of executionOrder) {
        if (processed.has(taskId)) continue;

        const task = taskMap.get(taskId);
        if (!task) continue;

        const dependenciesMet = dependsOn.get(taskId)?.every(depId => processed.has(depId)) ?? true;

        if (dependenciesMet && task.canParallelize) {
          batch.push(taskId);
        }
      }

      // If batch is empty, take the first task whose dependencies are met
      if (batch.length === 0) {
        for (const taskId of executionOrder) {
          if (processed.has(taskId)) continue;
          const dependenciesMet = dependsOn.get(taskId)?.every(depId => processed.has(depId)) ?? true;
          if (dependenciesMet) {
            batch.push(taskId);
            break;
          }
        }
      }

      for (const taskId of batch) {
        processed.add(taskId);
      }

      if (batch.length > 0) {
        const totalTokens = batch.map(id => taskMap.get(id)?.estimatedTokens || 0).reduce((a, b) => a + b, 0);
        const maxDuration = batch.map(id => taskMap.get(id)?.estimatedDuration || "0").sort().reverse()[0] || "0";

        groups.push({
          batchId: this.generateId(),
          batchNumber,
          taskIds: batch,
          reason: batch.length > 1 ? "Independent tasks can execute in parallel" : "Sequential task",
          estimatedDuration: maxDuration,
          estimatedTokens: totalTokens,
        });
      } else {
        // Avoid infinite loop
        break;
      }
    }

    return groups;
  }

  /**
   * Detect blockers before execution
   */
  private detectBlockers(intent: IntentAnalysisResult, tasks: Task[]): Blocker[] {
    const blockers: Blocker[] = [];

    if (intent.clarificationNeeded && intent.clarificationQuestions.length > 0) {
      blockers.push({
        id: this.generateId(),
        type: "clarification_required",
        description: "User clarification is required before execution",
        severity: "critical",
        resolution: "Answer the clarification questions",
        taskIds: tasks.map(t => t.id),
      });
    }

    if (intent.overallConfidence === "very_low" || intent.overallConfidence === "low") {
      blockers.push({
        id: this.generateId(),
        type: "low_confidence",
        description: "Intent analysis confidence is low",
        severity: "high",
        resolution: "Request more details or context",
        taskIds: tasks.map(t => t.id),
      });
    }

    // Check for missing dependencies based on task categories
    if (tasks.some(t => t.category === "database")) {
      blockers.push({
        id: this.generateId(),
        type: "database_connection",
        description: "Database connection may be required",
        severity: "medium",
        resolution: "Verify database availability and schema access",
        taskIds: tasks.filter(t => t.category === "database").map(t => t.id),
      });
    }

    return blockers;
  }

  /**
   * Assess risks for the plan
   */
  private assessRisks(intent: IntentAnalysisResult, tasks: Task[]): PlanRisk[] {
    const risks: PlanRisk[] = [];

    for (const risk of intent.risks) {
      const affectedTaskIds = tasks
        .filter(t => t.category === "edit_file" || t.category === "delete_file" || t.category === "create_file")
        .map(t => t.id);

      risks.push({
        id: this.generateId(),
        type: risk.type,
        description: risk.description,
        severity: risk.severity,
        probability: "medium",
        mitigation: risk.mitigation || "No mitigation provided",
        affectedTasks: affectedTaskIds,
      });
    }

    // Add risk for breaking changes
    if (intent.architecturalImpact === "high") {
      risks.push({
        id: this.generateId(),
        type: "breaking_change",
        description: "High architectural impact may introduce breaking changes",
        severity: "high",
        probability: "medium",
        mitigation: "Run comprehensive tests and verify integrations",
        affectedTasks: tasks.map(t => t.id),
      });
    }

    return risks;
  }

  /**
   * Optimize context requirements for the plan
   */
  private optimizeContext(intent: IntentAnalysisResult, tasks: Task[]): ContextRequirement {
    const context: ContextRequirement = {
      files: [...intent.recommendedContext.files],
      folders: [...intent.recommendedContext.folders],
      components: [...intent.recommendedContext.components],
      apis: [...intent.recommendedContext.apis],
      modules: [...intent.recommendedContext.modules],
      symbols: [],
      reason: intent.recommendedContext.reason,
    };

    // Add context from tasks
    for (const task of tasks) {
      for (const file of task.requiredContext.files) {
        if (!context.files.includes(file)) {
          context.files.push(file);
        }
      }
      for (const folder of task.requiredContext.folders) {
        if (!context.folders.includes(folder)) {
          context.folders.push(folder);
        }
      }
      for (const component of task.requiredContext.components) {
        if (!context.components.includes(component)) {
          context.components.push(component);
        }
      }
      for (const api of task.requiredContext.apis) {
        if (!context.apis.includes(api)) {
          context.apis.push(api);
        }
      }
      for (const module of task.requiredContext.modules) {
        if (!context.modules.includes(module)) {
          context.modules.push(module);
        }
      }
      for (const symbol of task.requiredContext.symbols || []) {
        if (!context.symbols.includes(symbol)) {
          context.symbols.push(symbol);
        }
      }
    }

    return context;
  }

  /**
   * Plan token budget for the entire plan
   */
  private planTokenBudget(intent: IntentAnalysisResult, tasks: Task[]): TokenBudget {
    const taskTotal = tasks.reduce((sum, t) => sum + t.estimatedTokens, 0);
    const base = intent.tokenEstimation.total || taskTotal;

    return {
      planning: Math.round(base * 0.15),
      context: Math.round(base * 0.25),
      generation: Math.round(base * 0.30),
      verification: Math.round(base * 0.15),
      patch: Math.round(base * 0.05),
      review: Math.round(base * 0.05),
      streaming: Math.round(base * 0.05),
      total: Math.round(base * 1.2),
      contingency: Math.round(base * 0.2),
    };
  }

  /**
   * Build verification strategy
   */
  private buildVerificationStrategy(intent: IntentAnalysisResult, tasks: Task[]): VerificationStrategy {
    const methods: VerificationMethod[] = ["typescript"];
    const order: number[] = [];

    if (intent.affectedScope === "component" || intent.affectedFeatures.includes("ui")) {
      methods.push("lint");
      methods.push("build_verification");
    }

    if (intent.affectedScope === "api" || intent.affectedScope === "route" || intent.affectedFeatures.includes("api")) {
      methods.push("unit_tests");
      methods.push("integration_tests");
    }

    if (intent.intentTypes.some(t => t.category === "test")) {
      methods.push("unit_tests");
      methods.push("regression_testing");
    }

    if (intent.intentTypes.some(t => t.category === "secure")) {
      methods.push("security_checks");
    }

    // Add formatting if files are edited
    if (tasks.some(t => t.category === "edit_file" || t.category === "create_file")) {
      methods.push("formatting");
    }

    // Remove duplicates and assign order
    const uniqueMethods = Array.from(new Set(methods));
    for (let i = 0; i < uniqueMethods.length; i++) {
      order.push(i + 1);
    }

    return {
      methods: uniqueMethods,
      order,
      requiredFiles: intent.estimatedAffectedFiles,
      expectedOutcomes: [
        "All verification checks pass",
        "No TypeScript errors",
        "No lint errors",
      ],
      fallbackStrategy: "If verification fails, rollback changes and replan affected tasks",
    };
  }

  /**
   * Build rollback strategy
   */
  private buildRollbackStrategy(intent: IntentAnalysisResult, tasks: Task[]): RollbackStrategy {
    const affectedFiles = intent.estimatedAffectedFiles.length > 0
      ? intent.estimatedAffectedFiles
      : tasks
          .filter(t => t.category === "edit_file" || t.category === "create_file" || t.category === "delete_file")
          .flatMap(t => t.requiredContext.files);

    const steps = [
      "Backup modified files before making changes",
      "Store previous patch for each edited file",
      "Record changed symbols and references",
    ];

    if (intent.intentTypes.some(t => t.category === "delete")) {
      steps.push("Preserve deleted files in a backup location");
    }

    return {
      steps,
      backupFiles: [...new Set(affectedFiles)],
      restoreCommands: [
        "git checkout -- <file>",
        "Apply stored patch in reverse",
      ],
      recoveryTime: "Less than 5 minutes",
    };
  }

  /**
   * Detect reusable components in the project
   */
  private detectReusableComponents(intent: IntentAnalysisResult, tasks: Task[]): ReusableComponent[] {
    const components: ReusableComponent[] = [];

    // Use knowledge graph summary to detect reusable components
    const summary = intent.recommendedContext?.reason?.toLowerCase() || "";

    if (summary.includes("auth") || intent.affectedFeatures.includes("authentication")) {
      components.push({
        id: this.generateId(),
        type: "service",
        name: "auth-service",
        location: "src/lib/auth.ts",
        description: "Existing authentication service",
        usage: "Reuse or extend for new auth flow",
        confidence: 0.8,
      });
    }

    if (summary.includes("supabase")) {
      components.push({
        id: this.generateId(),
        type: "service",
        name: "supabase-client",
        location: "src/lib/supabase",
        description: "Supabase client for database operations",
        usage: "Use for database queries and auth",
        confidence: 0.9,
      });
    }

    return components;
  }

  /**
   * Build execution metadata
   */
  private buildExecutionMetadata(tasks: Task[], parallelGroups: ParallelGroup[], tokenBudget: TokenBudget): ExecutionMetadata {
    const totalDurationMinutes = this.sumDurationsMinutes(tasks.map(t => t.estimatedDuration));
    const maxParallel = Math.max(...parallelGroups.map(g => g.taskIds.length));
    const requiresUserInput = tasks.some(t => t.category === "planning" && t.priority === "critical");

    // Build milestones for large plans
    const milestones: MilestoneBatch[] = [];
    if (parallelGroups.length > 3) {
      const groupSize = Math.ceil(parallelGroups.length / 3);
      for (let i = 0; i < 3; i++) {
        const groups = parallelGroups.slice(i * groupSize, (i + 1) * groupSize);
        if (groups.length === 0) continue;

        const taskIds = groups.flatMap(g => g.taskIds);
        const tokens = groups.reduce((sum, g) => sum + g.estimatedTokens, 0);
        const maxDuration = groups.map(g => g.estimatedDuration).sort().reverse()[0] || "0";

        milestones.push({
          milestoneId: this.generateId(),
          title: `Milestone ${i + 1}`,
          description: `Execute batch ${groups[0].batchNumber} to ${groups[groups.length - 1].batchNumber}`,
          batchNumbers: groups.map(g => g.batchNumber),
          tasks: taskIds,
          estimatedDuration: maxDuration,
          estimatedTokens: tokens,
          completionCriteria: ["All tasks in milestone completed"],
        });
      }
    }

    return {
      estimatedTotalDuration: this.formatDuration(totalDurationMinutes),
      estimatedTotalTokens: tokenBudget.total,
      maxParallelTasks: maxParallel,
      requiresUserInput,
      canAutostart: !requiresUserInput,
      needsApproval: tasks.some(t => t.category === "delete_file" || t.priority === "critical"),
      milestoneCount: milestones.length,
      milestoneBatches: milestones,
    };
  }

  /**
   * Build architecture notes
   */
  private buildArchitectureNotes(intent: IntentAnalysisResult): string[] {
    const notes: string[] = [];

    notes.push(`Affected scope: ${intent.affectedScope}`);
    notes.push(`Architectural impact: ${intent.architecturalImpact}`);

    if (intent.dependencies.dependsOn.length > 0) {
      notes.push(`Dependencies: ${intent.dependencies.dependsOn.join(", ")}`);
    }

    if (intent.affectedFeatures.length > 0) {
      notes.push(`Affected features: ${intent.affectedFeatures.join(", ")}`);
    }

    return notes;
  }

  /**
   * Build planning summary
   */
  private buildPlanningSummary(tasks: Task[], goal: string): string {
    const taskCount = tasks.length;
    const criticalTasks = tasks.filter(t => t.priority === "critical").length;
    const highTasks = tasks.filter(t => t.priority === "high").length;

    return `Plan for "${goal}" includes ${taskCount} tasks (${criticalTasks} critical, ${highTasks} high). Execution follows dependency order with parallel batches where safe. Verification and rollback are included.`;
  }

  /**
   * Calculate planning confidence
   */
  private calculatePlanningConfidence(intent: IntentAnalysisResult, tasks: Task[], blockers: Blocker[]): number {
    let confidence = 0.8;

    if (intent.overallConfidence === "very_low") confidence -= 0.4;
    if (intent.overallConfidence === "low") confidence -= 0.2;
    if (intent.overallConfidence === "medium") confidence -= 0.1;

    if (blockers.length > 0) {
      const criticalBlockers = blockers.filter(b => b.severity === "critical").length;
      confidence -= criticalBlockers * 0.15;
    }

    if (tasks.length === 0) confidence -= 0.2;

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Determine if plan should be incremental
   */
  private isIncrementalPlan(input: PlanningEngineInput): boolean {
    if (!input.previousPlan) return false;

    // Check if the goal is similar to previous plan
    const previousGoal = input.previousPlan.projectGoal;
    const currentGoal = this.refineGoal(input.intentAnalysis);

    // Simple similarity check
    const previousWords = new Set(previousGoal.toLowerCase().split(/\s+/));
    const currentWords = currentGoal.toLowerCase().split(/\s+/);
    const common = currentWords.filter(w => previousWords.has(w));
    const similarity = common.length / Math.max(previousWords.size, currentWords.length);

    return similarity > 0.7;
  }

  /**
   * Diff a previous plan against new input
   */
  private diffPlan(previousPlan: ExecutionPlan, input: PlanningEngineInput): PlanDiff {
    const newTasks = this.decomposeIntoTasks(input.intentAnalysis, this.refineGoal(input.intentAnalysis));
    const oldTaskMap = new Map(previousPlan.tasks.map(t => [t.id, t]));

    const added: Task[] = [];
    const modified: Task[] = [];
    const unchanged: Task[] = [];
    const removed: Task[] = [];

    // Compare new tasks to old tasks by title
    const newTaskTitles = new Set(newTasks.map(t => t.title));
    const oldTaskTitles = new Set(previousPlan.tasks.map(t => t.title));

    for (const task of newTasks) {
      if (!oldTaskTitles.has(task.title)) {
        added.push(task);
      } else {
        // Find matching old task
        const oldTask = previousPlan.tasks.find(t => t.title === task.title);
        if (oldTask && this.taskChanged(oldTask, task)) {
          modified.push(task);
        } else {
          unchanged.push(task);
        }
      }
    }

    for (const task of previousPlan.tasks) {
      if (!newTaskTitles.has(task.title)) {
        removed.push(task);
      }
    }

    // Recompute dependencies for new/modified tasks
    const newDependencies = this.detectDependencies([...added, ...modified], input.intentAnalysis);

    return {
      added,
      removed,
      modified,
      unchanged,
      newDependencies,
      removedDependencies: [],
      updatedBlockers: this.detectBlockers(input.intentAnalysis, [...newTasks]),
      updatedRisks: this.assessRisks(input.intentAnalysis, [...newTasks]),
    };
  }

  /**
   * Check if a task has changed
   */
  private taskChanged(oldTask: Task, newTask: Task): boolean {
    return oldTask.description !== newTask.description ||
      oldTask.priority !== newTask.priority ||
      oldTask.complexity !== newTask.complexity;
  }

  /**
   * Map priority from intent to task priority
   */
  private mapPriority(priority: "critical" | "high" | "medium" | "low" | undefined): TaskPriority {
    return priority || "medium";
  }

  /**
   * Map complexity from intent to task complexity
   */
  private mapComplexity(complexity: string): TaskComplexity {
    const valid: TaskComplexity[] = ["very_small", "small", "medium", "large", "enterprise"];
    return valid.includes(complexity as TaskComplexity) ? (complexity as TaskComplexity) : "medium";
  }

  /**
   * Estimate duration for a task complexity
   */
  private estimateDuration(complexity: TaskComplexity): string {
    const map: Record<TaskComplexity, string> = {
      very_small: "5-15 minutes",
      small: "15-30 minutes",
      medium: "30-60 minutes",
      large: "1-2 hours",
      enterprise: "2-4 hours",
    };
    return map[complexity];
  }

  /**
   * Estimate tokens for a task
   */
  private estimateTaskTokens(complexity: TaskComplexity, category: TaskCategory): number {
    const base: Record<TaskComplexity, number> = {
      very_small: 500,
      small: 1500,
      medium: 4000,
      large: 10000,
      enterprise: 25000,
    };

    const categoryMultiplier: Record<TaskCategory, number> = {
      workspace_analysis: 0.5,
      planning: 0.5,
      context: 0.3,
      search: 0.4,
      read_file: 0.3,
      write_file: 1.5,
      edit_file: 1.2,
      delete_file: 0.5,
      rename_file: 0.6,
      move_file: 0.6,
      create_file: 1.5,
      patch: 1.0,
      generate: 1.3,
      verify: 0.8,
      review: 0.5,
      research: 0.6,
      terminal: 0.4,
      git: 0.3,
      testing: 0.8,
      documentation: 0.5,
      database: 1.0,
      api: 1.2,
      frontend: 1.2,
      backend: 1.2,
      configuration: 0.5,
      deployment: 0.6,
      memory: 0.2,
      tool_call: 0.3,
    };

    return Math.round(base[complexity] * (categoryMultiplier[category] || 1));
  }

  /**
   * Get the last N task IDs
   */
  private getLastTaskIds(tasks: Task[], count: number): string[] {
    return tasks.slice(-count).map(t => t.id);
  }

  /**
   * Derive task risks from category
   */
  private deriveTaskRisks(category: TaskCategory): string[] {
    const risks: Record<TaskCategory, string[]> = {
      workspace_analysis: ["Context may be incomplete"],
      planning: ["Plan may not cover all edge cases"],
      context: ["Required files may not be available"],
      search: ["Search results may be incomplete"],
      read_file: ["File may not exist"],
      write_file: ["May overwrite existing content"],
      edit_file: ["May introduce syntax errors"],
      delete_file: ["May remove referenced files"],
      rename_file: ["References may not be updated"],
      move_file: ["Imports may break"],
      create_file: ["May conflict with existing files"],
      patch: ["Patch may not apply cleanly"],
      generate: ["Generated code may not match conventions"],
      verify: ["Verification may fail"],
      review: ["Review may miss issues"],
      research: ["Research may not find all relevant information"],
      terminal: ["Command may fail or have side effects"],
      git: ["Git operation may conflict"],
      testing: ["Tests may not cover all cases"],
      documentation: ["Documentation may become outdated"],
      database: ["Migration may fail or cause data loss"],
      api: ["API may break existing clients"],
      frontend: ["UI may break responsiveness"],
      backend: ["API may introduce security issues"],
      configuration: ["Config may break existing setup"],
      deployment: ["Deployment may fail"],
      memory: ["Memory may not persist"],
      tool_call: ["Tool may return unexpected results"],
    };

    return risks[category] || ["Unknown risk"];
  }

  /**
   * Derive task verification from category
   */
  private deriveTaskVerification(category: TaskCategory): string[] {
    const verification: Record<TaskCategory, string[]> = {
      workspace_analysis: ["Context is complete"],
      planning: ["Plan is actionable"],
      context: ["Required files loaded"],
      search: ["Search results verified"],
      read_file: ["File read successfully"],
      write_file: ["File written and exists"],
      edit_file: ["Syntax is valid", "Tests pass"],
      delete_file: ["References updated", "No broken imports"],
      rename_file: ["References updated"],
      move_file: ["Imports updated"],
      create_file: ["File exists and is valid"],
      patch: ["Patch applied cleanly"],
      generate: ["Generated code compiles"],
      verify: ["Verification passed"],
      review: ["Review completed"],
      research: ["Research findings documented"],
      terminal: ["Command succeeded"],
      git: ["Git state is clean"],
      testing: ["Tests pass"],
      documentation: ["Documentation is accurate"],
      database: ["Migration succeeded", "Data is consistent"],
      api: ["API responds correctly", "Tests pass"],
      frontend: ["UI renders correctly", "Responsive"],
      backend: ["API tests pass"],
      configuration: ["Config is valid"],
      deployment: ["Deployment succeeded"],
      memory: ["Memory persisted"],
      tool_call: ["Tool result is valid"],
    };

    return verification[category] || ["Task completed"];
  }

  /**
   * Derive task rollback strategy from category
   */
  private deriveTaskRollback(category: TaskCategory): string {
    const rollback: Record<TaskCategory, string> = {
      workspace_analysis: "Discard context and re-analyze",
      planning: "Replan with updated context",
      context: "Reload context with different files",
      search: "Refine search query",
      read_file: "Skip file and report missing",
      write_file: "Delete written file",
      edit_file: "Revert file to previous version",
      delete_file: "Restore file from backup",
      rename_file: "Rename back to original",
      move_file: "Move file back to original location",
      create_file: "Delete created file",
      patch: "Reverse patch if applied",
      generate: "Regenerate or discard generated code",
      verify: "Fix issues and re-verify",
      review: "Re-review with more context",
      research: "Research again with refined queries",
      terminal: "Undo command if possible",
      git: "Revert git operation",
      testing: "Fix tests or implementation",
      documentation: "Remove or revert documentation",
      database: "Rollback transaction or restore backup",
      api: "Revert API changes",
      frontend: "Revert UI changes",
      backend: "Revert backend changes",
      configuration: "Restore previous configuration",
      deployment: "Rollback deployment",
      memory: "Clear memory entry",
      tool_call: "Retry tool call or skip",
    };

    return rollback[category] || "Revert any changes";
  }

  /**
   * Sum durations in minutes from strings
   */
  private sumDurationsMinutes(durations: string[]): number {
    let total = 0;
    for (const duration of durations) {
      const match = duration.match(/(\d+)(?:-(\d+))?\s*minute/i);
      if (match) {
        const max = match[2] ? parseInt(match[2]) : parseInt(match[1]);
        total += max;
      }
      const hourMatch = duration.match(/(\d+)(?:-(\d+))?\s*hour/i);
      if (hourMatch) {
        const max = hourMatch[2] ? parseInt(hourMatch[2]) : parseInt(hourMatch[1]);
        total += max * 60;
      }
    }
    return total;
  }

  /**
   * Format duration in minutes to a readable string
   */
  private formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.round(minutes / 60);
    if (hours < 4) {
      return `${hours} hours`;
    }
    return `${hours}+ hours`;
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get plan by ID
   */
  getPlan(planId: string): ExecutionPlan | undefined {
    return this.planHistory.get(planId);
  }

  /**
   * Get recent plans
   */
  getRecentPlans(limit: number = 10): ExecutionPlan[] {
    return Array.from(this.planHistory.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }
}
