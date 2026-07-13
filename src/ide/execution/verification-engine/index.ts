/**
 * Verification & Self-Correction Engine
 * 
 * This module provides the Verification Engine and its subsystem wrapper.
 * It validates every artifact produced by Netsyra before integration,
 * detects defects, assesses quality, and automatically repairs issues.
 */

export { VerificationEngine } from "./verification-engine";
export { VerificationEngineSubsystem } from "./verification-subsystem";
export { SelfCorrectionEngine } from "./self-correction-engine";
export { VerificationModelRouter } from "./model-router";
export * from "./verification-checkers";
export * from "./types";
