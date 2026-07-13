import type { RuntimeEvent } from "@/ide/types";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class EventValidator {
  validate(event: RuntimeEvent): ValidationResult {
    const errors: string[] = [];

    if (!event.id) errors.push("Event id is required");
    if (!event.type) errors.push("Event type is required");
    if (!event.source) errors.push("Event source is required");
    if (!event.category) errors.push("Event category is required");
    if (!event.priority) errors.push("Event priority is required");
    if (typeof event.timestamp !== "number") errors.push("Event timestamp is required");
    if (event.payload === undefined) errors.push("Event payload is required");
    if (typeof event.version !== "number") errors.push("Event version is required");
    if (!event.lifecycle) errors.push("Event lifecycle is required");
    if (typeof event.retryCount !== "number") errors.push("Event retryCount is required");

    if (event.securityContext) {
      const ctx = event.securityContext;
      if (typeof ctx !== "object" || Array.isArray(ctx)) {
        errors.push("Event securityContext must be an object");
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
