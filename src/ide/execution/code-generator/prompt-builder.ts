/**
 * Prompt Builder
 * 
 * Builds optimized prompts for code generation based on task type,
 * context, and target language/framework.
 */

import type { CodeGenerationRequest, PromptTemplate, GenerationType } from "./types";
import type { ContextAssemblyResult } from "@/ide/intelligence/context-engine";

export class PromptBuilder {
  private templates = new Map<GenerationType, PromptTemplate>();

  constructor() {
    this.registerDefaultTemplates();
  }

  /**
   * Register a prompt template
   */
  registerTemplate(template: PromptTemplate): void {
    this.templates.set(template.generationType, template);
  }

  /**
   * Build a prompt for code generation
   */
  build(request: CodeGenerationRequest): { systemPrompt: string; userPrompt: string } {
    const template = this.templates.get(request.generationType);
    const context = this.buildContextSection(request.context);
    const taskDescription = this.buildTaskDescription(request);
    const outputFormat = this.buildOutputFormat(request.generationType);
    const constraints = this.buildConstraints(request);

    const systemPrompt = `You are Netsyra, an expert AI software engineer. You write production-quality, clean, and well-typed code. Always follow the existing project's conventions and architecture. ${template?.role || ""}`;

    let userPrompt = "";
    if (template) {
      userPrompt = template.content
        .replace(/\{\{task\}\}/g, taskDescription)
        .replace(/\{\{context\}\}/g, context)
        .replace(/\{\{outputFormat\}\}/g, outputFormat)
        .replace(/\{\{constraints\}\}/g, constraints);
    } else {
      userPrompt = `${taskDescription}\n\n${context}\n\n${outputFormat}\n\n${constraints}`;
    }

    return { systemPrompt, userPrompt };
  }

  /**
   * Build context section from context assembly result
   */
  private buildContextSection(context: ContextAssemblyResult): string {
    const parts: string[] = [];

    parts.push(`# Current Objective\n${context.currentObjective}`);

    if (context.workspaceSummary) {
      parts.push(`# Workspace Summary\n${context.workspaceSummary}`);
    }

    if (context.architectureSummary) {
      parts.push(`# Architecture\n${context.architectureSummary}`);
    }

    if (context.relevantFiles.length > 0) {
      parts.push(`# Relevant Files\n${context.relevantFiles.map((f: { name: string; content: string }) => `File: ${f.name}\n${f.content}`).join("\n\n---\n\n")}`);
    }

    if (context.relevantSymbols.length > 0) {
      parts.push(`# Relevant Symbols\n${context.relevantSymbols.map((s: { name: string; content: string }) => `- ${s.name}: ${s.content}`).join("\n")}`);
    }

    if (context.relevantComponents.length > 0) {
      parts.push(`# Relevant Components\n${context.relevantComponents.map((c: { name: string; content: string }) => `- ${c.name}: ${c.content}`).join("\n")}`);
    }

    if (context.relevantApis.length > 0) {
      parts.push(`# Relevant APIs\n${context.relevantApis.map((a: { name: string; content: string }) => `- ${a.name}: ${a.content}`).join("\n")}`);
    }

    if (context.recentChanges.length > 0) {
      parts.push(`# Recent Changes\n${context.recentChanges.map((c: { content: string }) => `- ${c.content}`).join("\n")}`);
    }

    if (context.diagnostics.length > 0) {
      parts.push(`# Diagnostics\n${context.diagnostics.map((d: { content: string }) => `- ${d.content}`).join("\n")}`);
    }

    return parts.join("\n\n");
  }

  /**
   * Build task description
   */
  private buildTaskDescription(request: CodeGenerationRequest): string {
    const parts: string[] = [];

    parts.push(`Task: ${request.task.title}`);
    parts.push(`Description: ${request.task.description}`);
    parts.push(`Type: ${request.generationType}`);

    if (request.language) {
      parts.push(`Language: ${request.language}`);
    }

    if (request.framework) {
      parts.push(`Framework: ${request.framework}`);
    }

    if (request.targetFiles && request.targetFiles.length > 0) {
      parts.push(`Target files: ${request.targetFiles.join(", ")}`);
    }

    if (request.existingCode) {
      parts.push(`Existing code:\n${request.existingCode}`);
    }

    if (request.userMessage) {
      parts.push(`User request: ${request.userMessage}`);
    }

    return parts.join("\n");
  }

  /**
   * Build output format section
   */
  private buildOutputFormat(generationType: GenerationType): string {
    const codeOutput = `Start with a concise plan:

Plan:
- State what files you will touch and why
- Outline the key changes in 2–4 bullets

Then return the affected files using markers exactly like this:

File: path/to/file.ts
Operation: edit
Reasoning: one-line reason

code goes here...

Use the same marker pattern for each file you modify or create.
`;

    const formats: Record<GenerationType, string> = {
      create_file: `${codeOutput}\nFor each new file use Operation: create and include the full content.`,
      edit_file: `${codeOutput}\nOnly return the modified files. Preserve all existing behavior unless explicitly asked to change it.`,
      refactor: `${codeOutput}\nKeep behavior identical. Provide a brief refactoring rationale after Plan:.`,
      fix_bug: `${codeOutput}\nExplain the root cause in the Plan: section. Only touch files needed for the fix.`,
      optimize: `${codeOutput}\nExplain the performance improvements in the Plan: section.`,
      explain: `Explain the code in clear, concise terms. Include examples.`,
      review: `Review the code. List issues, improvements, and recommendations.`,
      generate_tests: `${codeOutput}\nFor each test file use Operation: create and follow existing testing conventions.`,
      generate_docs: `Return documentation in the appropriate format for the project.`,
      generate_sql: `Return valid SQL statements. Include table schema context.`,
      generate_api: `${codeOutput}\nFor each API file use Operation: create or edit as needed. Include routes, handlers, and validation.`,
      generate_ui: `${codeOutput}\nFor each UI file use Operation: create or edit as needed. Use the project's styling conventions.`,
      generate_backend: `${codeOutput}\nFor each backend file use Operation: create or edit as needed. Include service, controller, and validation logic.`,
      migrate_framework: `${codeOutput}\nPreserve all existing behavior and types.`,
      rename_symbols: `${codeOutput}\nUpdate all references across files.`,
      extract_component: `${codeOutput}\nReturn the extracted component and the updated usage file.`,
      extract_hook: `${codeOutput}\nReturn the extracted hook and the updated usage file.`,
      convert_language: `${codeOutput}\nReturn the converted code. Preserve logic and behavior.`,
      update_dependencies: `${codeOutput}\nReturn updated configuration files and any code changes required.`,
    };

    return `# Output Format\n${formats[generationType] || "Return the requested code."}`;
  }

  /**
   * Build constraints section
   */
  private buildConstraints(request: CodeGenerationRequest): string {
    const parts: string[] = [
      "# Constraints",
      "- Follow existing code conventions and architecture",
      "- Use TypeScript types where applicable",
      "- Do not use any deprecated APIs",
      "- Keep changes minimal and focused",
      "- Maintain backward compatibility when possible",
      "- Include proper error handling",
      "- Do not include unnecessary comments",
      "- Do not use emojis or non-standard characters",
    ];

    if (request.generationType === "edit_file" || request.generationType === "refactor") {
      parts.push("- Preserve all existing behavior unless explicitly asked to change it");
    }

    if (request.generationType === "generate_tests") {
      parts.push("- Use existing test framework and conventions");
      parts.push("- Mock external dependencies");
    }

    return parts.join("\n");
  }

  /**
   * Register default prompt templates
   */
  private registerDefaultTemplates(): void {
    const createTemplate: PromptTemplate = {
      id: "create-file",
      generationType: "create_file",
      role: "You create new files with clean, complete, production-ready code.",
      content: `{{task}}

{{context}}

{{outputFormat}}

{{constraints}}`,
      variables: ["task", "context", "outputFormat", "constraints"],
      version: "1.0.0",
    };

    const editTemplate: PromptTemplate = {
      id: "edit-file",
      generationType: "edit_file",
      role: "You edit existing files with surgical precision, preserving surrounding code.",
      content: `{{task}}

{{context}}

{{outputFormat}}

{{constraints}}`,
      variables: ["task", "context", "outputFormat", "constraints"],
      version: "1.0.0",
    };

    const refactorTemplate: PromptTemplate = {
      id: "refactor",
      generationType: "refactor",
      role: "You refactor code to improve quality while preserving behavior.",
      content: `{{task}}

{{context}}

{{outputFormat}}

{{constraints}}`,
      variables: ["task", "context", "outputFormat", "constraints"],
      version: "1.0.0",
    };

    const fixBugTemplate: PromptTemplate = {
      id: "fix-bug",
      generationType: "fix_bug",
      role: "You fix bugs by identifying root causes and applying minimal fixes.",
      content: `{{task}}

{{context}}

{{outputFormat}}

{{constraints}}`,
      variables: ["task", "context", "outputFormat", "constraints"],
      version: "1.0.0",
    };

    const explainTemplate: PromptTemplate = {
      id: "explain",
      generationType: "explain",
      role: "You explain code clearly and concisely for software engineers.",
      content: `{{task}}

{{context}}

{{outputFormat}}

{{constraints}}`,
      variables: ["task", "context", "outputFormat", "constraints"],
      version: "1.0.0",
    };

    const reviewTemplate: PromptTemplate = {
      id: "review",
      generationType: "review",
      role: "You review code for quality, bugs, security, and performance.",
      content: `{{task}}

{{context}}

{{outputFormat}}

{{constraints}}`,
      variables: ["task", "context", "outputFormat", "constraints"],
      version: "1.0.0",
    };

    const testTemplate: PromptTemplate = {
      id: "generate-tests",
      generationType: "generate_tests",
      role: "You generate comprehensive tests following project conventions.",
      content: `{{task}}

{{context}}

{{outputFormat}}

{{constraints}}`,
      variables: ["task", "context", "outputFormat", "constraints"],
      version: "1.0.0",
    };

    const apiTemplate: PromptTemplate = {
      id: "generate-api",
      generationType: "generate_api",
      role: "You create backend API endpoints with proper validation and routing.",
      content: `{{task}}

{{context}}

{{outputFormat}}

{{constraints}}`,
      variables: ["task", "context", "outputFormat", "constraints"],
      version: "1.0.0",
    };

    this.registerTemplate(createTemplate);
    this.registerTemplate(editTemplate);
    this.registerTemplate(refactorTemplate);
    this.registerTemplate(fixBugTemplate);
    this.registerTemplate(explainTemplate);
    this.registerTemplate(reviewTemplate);
    this.registerTemplate(testTemplate);
    this.registerTemplate(apiTemplate);
  }
}
