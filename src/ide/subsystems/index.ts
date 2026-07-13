import type { IRuntimeKernel } from "@/ide/kernel/types";
import { WorkspaceEngine } from "@/ide/workspace";
import { AIRouter } from "@/ide/execution/ai-router";
import {
  ExplorerEngine,
  EditorEngine,
  MemoryEngine,
  KnowledgeGraph,
  ContextEngine,
  IntentEngine,
  PlanningEngine,
  Planner,
  TaskGraph,
  Scheduler,
  ExecutionEngine,
  CodeGenerator,
  VerificationEngine,
  PatchEngine,
  ToolEngine,
  Router,
  StreamingEngine,
  TimelineEngine,
  LearningEngine,
} from "./builtin";

export async function createDefaultSubsystems(runtime: IRuntimeKernel): Promise<void> {
  const subsystems = [
    new WorkspaceEngine(),
    new ExplorerEngine(),
    new EditorEngine(),
    new MemoryEngine(),
    new KnowledgeGraph(),
    new ContextEngine(),
    new IntentEngine(),
    new PlanningEngine(),
    new Planner(),
    new TaskGraph(),
    new Scheduler(),
    new ExecutionEngine(),
    new AIRouter(),
    new CodeGenerator(),
    new VerificationEngine(),
    new PatchEngine(),
    new ToolEngine(),
    new Router(),
    new StreamingEngine(),
    new TimelineEngine(),
    new LearningEngine(),
  ];

  for (const subsystem of subsystems) {
    await runtime.register(subsystem);
  }
}

export * from "./builtin";
