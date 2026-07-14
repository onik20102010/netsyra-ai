/**
 * Benchmarking System
 * Evaluates improvements using standardized tasks
 */

export interface Benchmark {
  id: string;
  name: string;
  description: string;
  category: string;
  tasks: BenchmarkTask[];
  results: BenchmarkResult[];
  timestamp: number;
}

export interface BenchmarkTask {
  id: string;
  name: string;
  input: any;
  expectedOutput: any;
  difficulty: "easy" | "medium" | "hard";
}

export interface BenchmarkResult {
  taskId: string;
  success: boolean;
  duration: number;
  tokens: number;
  quality: number;
}

export class BenchmarkingSystem {
  private benchmarks: Map<string, Benchmark> = new Map();

  constructor() {
    this.initializeDefaultBenchmarks();
  }

  /**
   * Initialize default benchmarks
   */
  private initializeDefaultBenchmarks(): void {
    const planningBenchmark: Benchmark = {
      id: "planning_benchmark",
      name: "Planning Benchmark",
      description: "Evaluate planning capabilities",
      category: "planning",
      tasks: [
        {
          id: "task_1",
          name: "Simple Planning",
          input: { goal: "Create a simple API" },
          expectedOutput: { tasks: 5 },
          difficulty: "easy",
        },
        {
          id: "task_2",
          name: "Complex Planning",
          input: { goal: "Build a full-stack application" },
          expectedOutput: { tasks: 15 },
          difficulty: "hard",
        },
      ],
      results: [],
      timestamp: Date.now(),
    };

    const reasoningBenchmark: Benchmark = {
      id: "reasoning_benchmark",
      name: "Reasoning Benchmark",
      description: "Evaluate reasoning capabilities",
      category: "reasoning",
      tasks: [
        {
          id: "task_1",
          name: "Logical Reasoning",
          input: { problem: "Solve a logic puzzle" },
          expectedOutput: { solution: "valid" },
          difficulty: "medium",
        },
      ],
      results: [],
      timestamp: Date.now(),
    };

    this.benchmarks.set(planningBenchmark.id, planningBenchmark);
    this.benchmarks.set(reasoningBenchmark.id, reasoningBenchmark);
  }

  /**
   * Run a benchmark
   */
  public async runBenchmark(benchmarkId: string): Promise<Benchmark> {
    const benchmark = this.benchmarks.get(benchmarkId);
    if (!benchmark) {
      throw new Error(`Benchmark ${benchmarkId} not found`);
    }

    // Run all tasks
    for (const task of benchmark.tasks) {
      const result = await this.runTask(task);
      benchmark.results.push(result);
    }

    this.benchmarks.set(benchmarkId, benchmark);
    return benchmark;
  }

  /**
   * Run a single benchmark task
   */
  private async runTask(task: BenchmarkTask): Promise<BenchmarkResult> {
    const startTime = Date.now();

    // Simulate task execution
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));

    const duration = Date.now() - startTime;
    const success = Math.random() > 0.2; // 80% success rate

    return {
      taskId: task.id,
      success,
      duration,
      tokens: Math.floor(1000 + Math.random() * 5000),
      quality: success ? 0.8 + Math.random() * 0.2 : 0.3 + Math.random() * 0.3,
    };
  }

  /**
   * Get benchmark score
   */
  public getBenchmarkScore(benchmarkId: string): number {
    const benchmark = this.benchmarks.get(benchmarkId);
    if (!benchmark || benchmark.results.length === 0) return 0;

    const totalQuality = benchmark.results.reduce((sum, r) => sum + r.quality, 0);
    return totalQuality / benchmark.results.length;
  }

  /**
   * Get benchmark by ID
   */
  public getBenchmark(benchmarkId: string): Benchmark | undefined {
    return this.benchmarks.get(benchmarkId);
  }

  /**
   * Get all benchmarks
   */
  public getAllBenchmarks(): Benchmark[] {
    return Array.from(this.benchmarks.values());
  }

  /**
   * Get benchmarks by category
   */
  public getBenchmarksByCategory(category: string): Benchmark[] {
    return Array.from(this.benchmarks.values()).filter(
      b => b.category === category
    );
  }

  /**
   * Clear benchmarks
   */
  public clear(): void {
    this.benchmarks.clear();
  }
}
