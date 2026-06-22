export interface ValidationError {
  file: string;
  line: number;
  message: string;
  type: "syntax" | "import" | "reference" | "consistency";
}

export function validatePatch(
  files: { path: string; content: string }[],
  projectFiles: Record<string, string>
): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  for (const file of files) {
    let brackets = 0, parens = 0;
    const lines = file.content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      for (const ch of lines[i]) {
        if (ch === "(") parens++;
        if (ch === ")") parens--;
        if (ch === "[") brackets++;
        if (ch === "]") brackets--;
      }
      if (parens < 0) {
        errors.push({ file: file.path, line: i + 1, message: "Unexpected closing parenthesis", type: "syntax" });
        parens = 0;
      }
      if (brackets < 0) {
        errors.push({ file: file.path, line: i + 1, message: "Unexpected closing bracket", type: "syntax" });
        brackets = 0;
      }
    }
    if (parens !== 0) errors.push({ file: file.path, line: lines.length, message: "Missing closing parenthesis", type: "syntax" });
    if (brackets !== 0) errors.push({ file: file.path, line: lines.length, message: "Missing closing bracket", type: "syntax" });
  }
  return { valid: errors.length === 0, errors };
}