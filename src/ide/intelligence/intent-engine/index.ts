/**
 * Intent & Objective Engine
 * 
 * This module provides the Intent Engine and its subsystem wrapper.
 * The Intent Engine is the first intelligent stage executed after every user message.
 * It must NEVER generate code, modify files, or call tools.
 * Its only purpose is to completely understand the user's objective.
 */

export { IntentEngine } from "./intent-engine";
export { IntentEngineSubsystem } from "./intent-subsystem";
export * from "./types";
