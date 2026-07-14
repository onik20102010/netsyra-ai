import { PlanTemplate, Task } from "../planner-types";

export class TemplateManager {
  private templates: Map<string, PlanTemplate> = new Map();

  addTemplate(template: PlanTemplate) {
    this.templates.set(template.id, template);
  }

  findMatchingTemplate(userMessage: string): PlanTemplate | null {
    const lower = userMessage.toLowerCase();
    for (const template of this.templates.values()) {
      for (const keyword of template.triggerKeywords) {
        if (lower.includes(keyword.toLowerCase())) {
          return template;
        }
      }
    }
    return null;
  }
}
