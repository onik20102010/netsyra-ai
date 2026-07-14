/**
 * Lesson Generator
 * Converts failures and successes into reusable lessons
 */

import { Lesson, Mistake } from "../learning-types";

export class LessonGenerator {
  private lessons: Map<string, Lesson> = new Map();

  /**
   * Generate lessons from mistakes
   */
  public async generate(mistakes: Mistake[]): Promise<Lesson[]> {
    const generatedLessons: Lesson[] = [];

    mistakes.forEach(mistake => {
      const lesson = this.generateLessonFromMistake(mistake);
      if (lesson) {
        this.lessons.set(lesson.id, lesson);
        generatedLessons.push(lesson);
      }
    });

    return generatedLessons;
  }

  /**
   * Generate a lesson from a mistake
   */
  private generateLessonFromMistake(mistake: Mistake): Lesson | null {
    const lesson = this.createLessonForMistakeType(mistake);
    if (!lesson) return null;

    // Update lesson with specific details
    lesson.description = mistake.description;
    lesson.confidence = this.calculateLessonConfidence(mistake);

    return lesson;
  }

  /**
   * Create lesson based on mistake type
   */
  private createLessonForMistakeType(mistake: Mistake): Lesson | null {
    switch (mistake.type) {
      case "wrong_assumption":
        return {
          id: crypto.randomUUID(),
          category: "reasoning",
          description: "",
          condition: "When making assumptions about task requirements",
          action: "Always validate assumptions with explicit checks or user confirmation",
          confidence: 0.8,
          createdAt: Date.now(),
        };

      case "missing_memory":
        return {
          id: crypto.randomUUID(),
          category: "memory",
          description: "",
          condition: "When accessing information that should be in memory",
          action: "Verify memory availability before proceeding, or explicitly request missing information",
          confidence: 0.9,
          createdAt: Date.now(),
        };

      case "wrong_planner":
        return {
          id: crypto.randomUUID(),
          category: "planning",
          description: "",
          condition: "When selecting a planning strategy",
          action: "Match planner type to task complexity and requirements",
          confidence: 0.85,
          createdAt: Date.now(),
        };

      case "wrong_tool":
        return {
          id: crypto.randomUUID(),
          category: "tools",
          description: "",
          condition: "When selecting tools for task execution",
          action: "Consider tool reliability, past performance, and task suitability",
          confidence: 0.8,
          createdAt: Date.now(),
        };

      case "hallucination":
        return {
          id: crypto.randomUUID(),
          category: "reasoning",
          description: "",
          condition: "When generating factual information",
          action: "Verify facts with reliable sources or explicit checks before output",
          confidence: 0.95,
          createdAt: Date.now(),
        };

      case "safety_violation":
        return {
          id: crypto.randomUUID(),
          category: "safety",
          description: "",
          condition: "Before executing any action",
          action: "Run safety checks and validate against safety policies",
          confidence: 1.0,
          createdAt: Date.now(),
        };

      case "timeout":
        return {
          id: crypto.randomUUID(),
          category: "performance",
          description: "",
          condition: "When tasks risk timeout",
          action: "Break down complex tasks into smaller, manageable chunks",
          confidence: 0.85,
          createdAt: Date.now(),
        };

      default:
        return null;
    }
  }

  /**
   * Calculate lesson confidence based on mistake severity
   */
  private calculateLessonConfidence(mistake: Mistake): number {
    const severityMap: Record<string, number> = {
      low: 0.6,
      medium: 0.75,
      high: 0.9,
      critical: 1.0,
    };

    return severityMap[mistake.severity] || 0.7;
  }

  /**
   * Get lesson by ID
   */
  public getLesson(id: string): Lesson | undefined {
    return this.lessons.get(id);
  }

  /**
   * Get lessons by category
   */
  public getLessonsByCategory(category: string): Lesson[] {
    return Array.from(this.lessons.values()).filter(
      lesson => lesson.category === category
    );
  }

  /**
   * Get all lessons
   */
  public getAllLessons(): Lesson[] {
    return Array.from(this.lessons.values());
  }

  /**
   * Update lesson success rate
   */
  public updateLessonSuccessRate(lessonId: string, success: boolean): void {
    const lesson = this.lessons.get(lessonId);
    if (!lesson) return;

    const currentRate = lesson.successRate || 0.5;
    const currentCount = lesson.lastUsed ? 1 : 0;
    
    const newRate = (currentRate * currentCount + (success ? 1 : 0)) / (currentCount + 1);
    
    lesson.successRate = newRate;
    lesson.lastUsed = Date.now();
  }

  /**
   * Get applicable lessons for a condition
   */
  public getApplicableLessons(condition: string): Lesson[] {
    return Array.from(this.lessons.values()).filter(lesson => {
      // Simple matching - in production, use more sophisticated matching
      return condition.toLowerCase().includes(lesson.condition.toLowerCase().split(" ")[0].toLowerCase());
    });
  }
}
