interface ValidationResult {
  valid: boolean;
  errors: string[];
  fixPlan?: string[];
}

export function validateGeneratedFiles(files: Record<string, string>): ValidationResult {
  const errors: string[] = [];
  // Simple checks: missing imports for React, etc.
  for (const [path, content] of Object.entries(files)) {
    if (path.endsWith(".tsx") || path.endsWith(".jsx")) {
      if (!content.includes("import React") && !content.includes('from "react"') && !content.includes("from 'react'")) {
        errors.push(`${path}: missing React import`);
      }
    }
    if (content.includes("<") && !content.includes("export default") && !content.includes("export function")) {
      errors.push(`${path}: possible missing export`);
    }
  }
  const valid = errors.length === 0;
  return {
    valid,
    errors,
    fixPlan: valid ? undefined : errors.map(e => `Fix ${e}`),
  };
}