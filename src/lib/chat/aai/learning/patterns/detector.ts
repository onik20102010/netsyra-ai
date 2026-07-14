/**
 * Pattern Detector
 * Detects recurring patterns in experiences
 */

import { Experience, Pattern, PatternCondition } from "../learning-types";

export class PatternDetector {
  private patterns: Map<string, Pattern> = new Map();
  private experienceBuffer: Experience[] = [];

  /**
   * Detect patterns from an experience
   */
  public async detect(experience: Experience): Promise<Pattern[]> {
    // Add to buffer
    this.experienceBuffer.push(experience);

    // Detect patterns
    const detectedPatterns = this.detectPatterns(experience);

    // Store patterns
    for (const pattern of detectedPatterns) {
      this.patterns.set(pattern.id, pattern);
    }

    return detectedPatterns;
  }

  /**
   * Detect patterns from experience
   */
  private detectPatterns(experience: Experience): Pattern[] {
    const patterns: Pattern[] = [];

    // Detect sequence patterns
    const sequencePattern = this.detectSequencePattern(experience);
    if (sequencePattern) {
      patterns.push(sequencePattern);
    }

    // Detect tool usage patterns
    const toolPattern = this.detectToolPattern(experience);
    if (toolPattern) {
      patterns.push(toolPattern);
    }

    // Detect mistake patterns
    const mistakePattern = this.detectMistakePattern(experience);
    if (mistakePattern) {
      patterns.push(mistakePattern);
    }

    return patterns;
  }

  /**
   * Detect sequence patterns
   */
  private detectSequencePattern(experience: Experience): Pattern | null {
    if (this.experienceBuffer.length < 5) return null;

    // Check for recurring task sequences
    const recentExperiences = this.experienceBuffer.slice(-10);
    const commonSequences = this.findCommonSequences(recentExperiences);

    if (commonSequences.length === 0) return null;

    const pattern: Pattern = {
      id: crypto.randomUUID(),
      name: "Task Sequence Pattern",
      type: "sequence",
      description: `Common sequence: ${commonSequences[0].sequence.join(" -> ")}`,
      conditions: [],
      frequency: commonSequences[0].frequency,
      confidence: 0.8,
      affects: ["planner"],
      recommendation: "Consider creating a skill for this sequence",
      discoveredAt: Date.now(),
      lastObserved: Date.now(),
      sampleSize: recentExperiences.length,
    };

    return pattern;
  }

  /**
   * Find common sequences in experiences
   */
  private findCommonSequences(experiences: Experience[]): Array<{ sequence: string[]; frequency: number }> {
    const sequences: Map<string, number> = new Map();

    experiences.forEach(exp => {
      const taskSequence = exp.plan.map(t => t.description.substring(0, 20)).join(" -> ");
      sequences.set(taskSequence, (sequences.get(taskSequence) || 0) + 1);
    });

    return Array.from(sequences.entries())
      .filter(([_, freq]) => freq >= 2)
      .map(([sequence, frequency]) => ({
        sequence: sequence.split(" -> "),
        frequency,
      }))
      .sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Detect tool usage patterns
   */
  private detectToolPattern(experience: Experience): Pattern | null {
    if (experience.toolsUsed.length === 0) return null;

    const toolNames = experience.toolsUsed.map(t => t.toolName);

    const pattern: Pattern = {
      id: crypto.randomUUID(),
      name: "Tool Usage Pattern",
      type: "sequence",
      description: `Tools used: ${toolNames.join(", ")}`,
      conditions: [
        {
          field: "tools",
          operator: "contains",
          value: toolNames[0],
        },
      ],
      frequency: 1,
      confidence: 0.7,
      affects: ["tool_selection"],
      recommendation: "Consider optimizing tool selection for this task type",
      discoveredAt: Date.now(),
      lastObserved: Date.now(),
      sampleSize: 1,
    };

    return pattern;
  }

  /**
   * Detect mistake patterns
   */
  private detectMistakePattern(experience: Experience): Pattern | null {
    if (experience.mistakes.length === 0) return null;

    const mistakeTypes = experience.mistakes.map(m => m.type);

    const pattern: Pattern = {
      id: crypto.randomUUID(),
      name: "Mistake Pattern",
      type: "anomaly",
      description: `Common mistakes: ${mistakeTypes.join(", ")}`,
      conditions: [
        {
          field: "mistakes",
          operator: "contains",
          value: mistakeTypes[0],
        },
      ],
      frequency: 1,
      confidence: 0.6,
      affects: ["planner", "reasoning"],
      recommendation: "Add preventive measures for these mistake types",
      discoveredAt: Date.now(),
      lastObserved: Date.now(),
      sampleSize: 1,
    };

    return pattern;
  }

  /**
   * Get pattern by ID
   */
  public getPattern(id: string): Pattern | undefined {
    return this.patterns.get(id);
  }

  /**
   * Get patterns by type
   */
  public getPatternsByType(type: string): Pattern[] {
    return Array.from(this.patterns.values()).filter(
      pattern => pattern.type === type
    );
  }

  /**
   * Get all patterns
   */
  public getAllPatterns(): Pattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Get high-confidence patterns
   */
  public getHighConfidencePatterns(threshold: number = 0.8): Pattern[] {
    return Array.from(this.patterns.values()).filter(
      pattern => pattern.confidence >= threshold
    );
  }

  /**
   * Get frequent patterns
   */
  public getFrequentPatterns(threshold: number = 5): Pattern[] {
    return Array.from(this.patterns.values()).filter(
      pattern => pattern.frequency >= threshold
    );
  }
}
