/**
 * Planning & Task Decomposition Engine
 * 
 * This module provides the Planning Engine and its subsystem wrapper.
 * The Planning Engine receives structured output from the Intent Engine
 * and transforms it into a complete execution strategy.
 * 
 * It must NEVER generate code, edit files, or execute tools.
 * Its only purpose is to produce the best possible execution plan.
 */

export { PlanningEngine } from "./planning-engine";
export { PlanningEngineSubsystem } from "./planning-subsystem";
export * from "./types";
