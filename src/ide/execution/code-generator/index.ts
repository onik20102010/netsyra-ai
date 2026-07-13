/**
 * Code Generation Engine
 * 
 * This module provides the Code Generation Engine and its subsystem wrapper.
 * It is an intelligent orchestration layer for generating, editing, refactoring,
 * debugging, reviewing, and explaining code inside the IDE.
 */

export { CodeGeneratorEngine } from "./code-generator-engine";
export { CodeGeneratorSubsystem } from "./code-generator-subsystem";
export { ModelRegistry } from "./model-registry";
export { ModelRouter } from "./model-router";
export { PromptBuilder } from "./prompt-builder";
export { PatchGenerator } from "./patch-generator";
export { StreamHandler } from "./stream-handler";
export { VerificationService } from "./verification-service";
export * from "./providers";
export * from "./types";
