/**
 * Learning Session Management
 * Manages individual learning sessions that process experiences
 */

import {
  LearningSession,
  Experience,
  Reflection,
  Lesson,
  Skill,
  Pattern,
  Policy,
  Optimization,
  LearningMetrics,
} from "./learning-types";

export class LearningSessionManager {
  private activeSessions: Map<string, LearningSession> = new Map();

  /**
   * Create a new learning session
   */
  public createSession(experienceIds: string[]): LearningSession {
    const session: LearningSession = {
      id: crypto.randomUUID(),
      startTime: Date.now(),
      status: "active",
      experienceIds,
      reflections: [],
      lessons: [],
      skills: [],
      patterns: [],
      policyUpdates: [],
      optimizations: [],
      metrics: {
        experiencesProcessed: 0,
        reflectionsGenerated: 0,
        lessonsLearned: 0,
        skillsExtracted: 0,
        patternsDiscovered: 0,
        policiesUpdated: 0,
        optimizationsProposed: 0,
        duration: 0,
      },
    };

    this.activeSessions.set(session.id, session);
    return session;
  }

  /**
   * Get active session
   */
  public getSession(sessionId: string): LearningSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Complete a learning session
   */
  public completeSession(sessionId: string): LearningSession | undefined {
    const session = this.activeSessions.get(sessionId);
    if (!session) return undefined;

    session.status = "completed";
    session.endTime = Date.now();
    session.metrics.duration = session.endTime - session.startTime;

    this.activeSessions.delete(sessionId);
    return session;
  }

  /**
   * Fail a learning session
   */
  public failSession(sessionId: string, error?: string): LearningSession | undefined {
    const session = this.activeSessions.get(sessionId);
    if (!session) return undefined;

    session.status = "failed";
    session.endTime = Date.now();
    session.metrics.duration = session.endTime - session.startTime;

    this.activeSessions.delete(sessionId);
    return session;
  }

  /**
   * Add reflection to session
   */
  public addReflection(sessionId: string, reflection: Reflection): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.reflections.push(reflection);
    session.metrics.reflectionsGenerated++;
  }

  /**
   * Add lesson to session
   */
  public addLesson(sessionId: string, lesson: Lesson): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.lessons.push(lesson);
    session.metrics.lessonsLearned++;
  }

  /**
   * Add skill to session
   */
  public addSkill(sessionId: string, skill: Skill): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.skills.push(skill);
    session.metrics.skillsExtracted++;
  }

  /**
   * Add pattern to session
   */
  public addPattern(sessionId: string, pattern: Pattern): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.patterns.push(pattern);
    session.metrics.patternsDiscovered++;
  }

  /**
   * Add policy update to session
   */
  public addPolicyUpdate(sessionId: string, policy: Policy): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.policyUpdates.push(policy);
    session.metrics.policiesUpdated++;
  }

  /**
   * Add optimization to session
   */
  public addOptimization(sessionId: string, optimization: Optimization): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.optimizations.push(optimization);
    session.metrics.optimizationsProposed++;
  }

  /**
   * Increment processed experiences count
   */
  public incrementProcessedExperiences(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.metrics.experiencesProcessed++;
  }

  /**
   * Get all active sessions
   */
  public getActiveSessions(): LearningSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Get session count
   */
  public getActiveSessionCount(): number {
    return this.activeSessions.size;
  }
}
