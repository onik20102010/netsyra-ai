/**
 * Learning Manager
 * Central coordinator for the Autonomous Learning & Self-Improvement Layer
 */

import { Experience, LearningSession } from "./learning-types";
import { LearningPolicyManager } from "./learning-policy";
import { LearningSessionManager } from "./learning-session";
import { ExperienceRecorder } from "./experience/recorder";
import { ExperienceCollector } from "./experience/collector";
import { ExperienceReplay } from "./experience/replay";
import { ReflectionEngine } from "./reflection/reflection";
import { MistakeAnalyzer } from "./reflection/mistake-analysis";
import { LessonGenerator } from "./reflection/lesson-generator";
import { SkillExtractor } from "./skills/extractor";
import { SkillCompiler } from "./skills/compiler";
import { PatternDetector } from "./patterns/detector";
import { RoutingPolicy } from "./policies/routing";
import { RewardModel } from "./rewards/reward-model";
import { PromptOptimizer } from "./optimization/prompt";
import { SimulationSandbox } from "./simulation/sandbox";
import { EvolutionEngine } from "./evolution/self-improvement";

export class LearningManager {
  private static instance: LearningManager;

  // Policy & Session Management
  private policyManager: LearningPolicyManager;
  private sessionManager: LearningSessionManager;

  // Experience System
  private experienceRecorder: ExperienceRecorder;
  private experienceCollector: ExperienceCollector;
  private experienceReplay: ExperienceReplay;

  // Reflection System
  private reflectionEngine: ReflectionEngine;
  private mistakeAnalyzer: MistakeAnalyzer;
  private lessonGenerator: LessonGenerator;

  // Skill System
  private skillExtractor: SkillExtractor;
  private skillCompiler: SkillCompiler;

  // Pattern System
  private patternDetector: PatternDetector;

  // Policy System
  private routingPolicy: RoutingPolicy;

  // Reward System
  private rewardModel: RewardModel;

  // Optimization System
  private promptOptimizer: PromptOptimizer;

  // Simulation System
  private simulationSandbox: SimulationSandbox;

  // Evolution System
  private evolutionEngine: EvolutionEngine;

  private constructor() {
    // Initialize policy manager
    this.policyManager = new LearningPolicyManager();
    this.sessionManager = new LearningSessionManager();

    // Initialize experience system
    this.experienceRecorder = new ExperienceRecorder();
    this.experienceCollector = new ExperienceCollector();
    this.experienceReplay = new ExperienceReplay();

    // Initialize reflection system
    this.reflectionEngine = new ReflectionEngine();
    this.mistakeAnalyzer = new MistakeAnalyzer();
    this.lessonGenerator = new LessonGenerator();

    // Initialize skill system
    this.skillExtractor = new SkillExtractor();
    this.skillCompiler = new SkillCompiler();

    // Initialize pattern system
    this.patternDetector = new PatternDetector();

    // Initialize policy system
    this.routingPolicy = new RoutingPolicy();

    // Initialize reward system
    this.rewardModel = new RewardModel();

    // Initialize optimization system
    this.promptOptimizer = new PromptOptimizer();

    // Initialize simulation system
    this.simulationSandbox = new SimulationSandbox();

    // Initialize evolution system
    this.evolutionEngine = new EvolutionEngine();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): LearningManager {
    if (!LearningManager.instance) {
      LearningManager.instance = new LearningManager();
    }
    return LearningManager.instance;
  }

  /**
   * Process a completed task through the learning pipeline
   */
  public async processTaskCompletion(experience: Experience): Promise<void> {
    // Check if learning should trigger
    if (!this.policyManager.shouldTrigger(experience)) {
      return;
    }

    // Create learning session
    const session = this.sessionManager.createSession([experience.id]);

    try {
      // Step 1: Record experience
      await this.experienceRecorder.record(experience);
      this.sessionManager.incrementProcessedExperiences(session.id);

      // Step 2: Evaluate with reward model
      const reward = await this.rewardModel.evaluate(experience);

      // Step 3: Reflect on experience
      const reflection = await this.reflectionEngine.reflect(experience);
      this.sessionManager.addReflection(session.id, reflection);

      // Step 4: Analyze mistakes
      const mistakes = await this.mistakeAnalyzer.analyze(experience, reflection);

      // Step 5: Generate lessons
      const lessons = await this.lessonGenerator.generate(mistakes);
      for (const lesson of lessons) {
        this.sessionManager.addLesson(session.id, lesson);
      }

      // Step 6: Extract skills
      const skills = await this.skillExtractor.extract(experience);
      for (const skill of skills) {
        this.sessionManager.addSkill(session.id, skill);
      }

      // Step 7: Detect patterns
      const patterns = await this.patternDetector.detect(experience);
      for (const pattern of patterns) {
        this.sessionManager.addPattern(session.id, pattern);
      }

      // Step 8: Optimize policies
      const policyUpdates = await this.policyOptimizer.optimize(experience, reflection);
      for (const policy of policyUpdates) {
        this.sessionManager.addPolicyUpdate(session.id, policy);
      }

      // Step 9: Optimize prompts
      const promptOptimizations = await this.promptOptimizer.optimize(experience);
      for (const optimization of promptOptimizations) {
        this.sessionManager.addOptimization(session.id, optimization);
      }

      // Step 10: Complete session
      this.sessionManager.completeSession(session.id);

      // Step 11: Trigger evolution if conditions met
      await this.evolutionEngine.evolve(session);

    } catch (error) {
      console.error("Learning session failed:", error);
      this.sessionManager.failSession(session.id, String(error));
    }
  }

  /**
   * Find similar experiences for replay
   */
  public async findSimilarExperiences(currentTask: any): Promise<Experience[]> {
    return await this.experienceReplay.findSimilar(currentTask);
  }

  /**
   * Get learning metrics dashboard
   */
  public async getMetricsDashboard() {
    return {
      skillSuccessRate: await this.skillExtractor.getSuccessRate(),
      plannerEfficiency: await this.policyOptimizer.getEfficiency(),
      reasoningAccuracy: await this.reflectionEngine.getAccuracy(),
      memoryRetrievalPrecision: await this.experienceReplay.getPrecision(),
      toolReliability: await this.rewardModel.getToolReliability(),
      userSatisfaction: await this.rewardModel.getUserSatisfaction(),
      averageCost: await this.rewardModel.getAverageCost(),
      averageLatency: await this.rewardModel.getAverageLatency(),
    };
  }

  /**
   * Run background learning (batch processing)
   */
  public async runBackgroundLearning(): Promise<void> {
    // Collect pending experiences
    const experiences = await this.experienceCollector.collectPending();

    // Process in batch
    for (const experience of experiences) {
      await this.processTaskCompletion(experience);
    }

    // Run evolution
    await this.evolutionEngine.runEvolutionCycle();
  }

  /**
   * Update learning policy
   */
  public updateLearningPolicy(updates: any): void {
    this.policyManager.updatePolicy(updates);
  }

  /**
   * Get current learning policy
   */
  public getLearningPolicy() {
    return this.policyManager.getPolicy();
  }

  /**
   * Get active sessions
   */
  public getActiveSessions(): LearningSession[] {
    return this.sessionManager.getActiveSessions();
  }
}

// Export singleton instance
export const learningManager = LearningManager.getInstance();
