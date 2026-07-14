import {
  Task,
  TaskDependencyGraph,
  TaskGraphNode,
  TaskGraphEdge,
  ExecutionDAG,
} from "../planner-types";
import { DependencyBuilder } from "../decomposition/dependency-builder";

export class WorkflowCompiler {
  compile(tasks: Task[]): ExecutionDAG {
    const graph = DependencyBuilder.buildTaskGraph(tasks);
    const parallelBranches = this.findParallelBranches(graph);

    return {
      ...graph,
      compiledAt: new Date(),
      optimized: true,
      parallelBranches,
    };
  }

  private findParallelBranches(graph: TaskDependencyGraph): string[][] {
    const branches: string[][] = [];
    const levels: Map<number, string[]> = new Map();

    for (const node of graph.nodes) {
      const level = node.level;
      const levelNodes = levels.get(level) || [];
      levelNodes.push(node.id);
      levels.set(level, levelNodes);
    }

    for (const [_, levelNodes] of levels) {
      if (levelNodes.length > 1) {
        branches.push(levelNodes);
      }
    }

    return branches;
  }

  optimize(dag: ExecutionDAG): ExecutionDAG {
    const optimizedTasks = this.mergeDuplicates(dag.nodes.map((n) => n.task));
    const optimizedGraph = DependencyBuilder.buildTaskGraph(optimizedTasks);

    return {
      ...optimizedGraph,
      compiledAt: new Date(),
      optimized: true,
      parallelBranches: this.findParallelBranches(optimizedGraph),
    };
  }

  private mergeDuplicates(tasks: Task[]): Task[] {
    const unique = new Map<string, Task>();
    for (const task of tasks) {
      const key = `${task.title}-${task.description}`;
      if (!unique.has(key)) {
        unique.set(key, task);
      }
    }
    return Array.from(unique.values());
  }
}
