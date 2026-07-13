/**
 * Patch & File Integration Engine
 * 
 * This module provides the Patch Engine and its subsystem wrapper.
 * It safely integrates verified AI-generated changes into the user's workspace.
 */

export { PatchEngine } from "./patch-engine";
export { PatchEngineSubsystem } from "./patch-subsystem";
export { PatchParser } from "./patch-parser";
export { WorkspaceState } from "./workspace-state";
export { ConflictDetector } from "./conflict-detector";
export { StructuralMerge } from "./structural-merge";
export { PatchApplicator } from "./patch-applicator";
export { RollbackManager } from "./rollback-manager";
export * from "./types";
