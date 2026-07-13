/**
 * Context Assembly Engine
 * 
 * This module provides the Context Engine and its subsystem wrapper.
 * The Context Engine is responsible for building the smallest, most relevant,
 * and highest-quality context for the AI model before every reasoning
 * or code generation request.
 */

export { ContextEngine } from "./context-engine";
export { ContextEngineSubsystem } from "./context-subsystem";
export * from "./types";
