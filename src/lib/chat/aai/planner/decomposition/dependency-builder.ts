import { Task, TaskDependencyGraph, TaskGraphNode, TaskGraphEdge } from "../planner-types";

export class DependencyBuilder {
  public static buildTaskGraph(tasks: Task[]): TaskDependencyGraph {
    const nodes: TaskGraphNode[] = tasks.map((task) => ({
      id: task.id,
      task,
      inDegree: 0,
      outDegree: 0,
      level: 0,
    }));

    const edges: TaskGraphEdge[] = [];

    // Build edges from task dependencies
    for (const task of tasks) {
      for (const depId of task.dependencies) {
        edges.push({
          from: depId,
          to: task.id,
          type: "required",
        });

        // Update in/out degrees
        const toNode = nodes.find((n) => n.id === task.id);
        if (toNode) toNode.inDegree++;

        const fromNode = nodes.find((n) => n.id === depId);
        if (fromNode) fromNode.outDegree++;
      }
    }

    const topologicalOrder = this.topologicalSort(nodes, edges);

    // Calculate levels
    const levelMap = new Map<string, number>();
    for (const nodeId of topologicalOrder) {
      const node = nodes.find(n => n.id === nodeId)!;
      let maxLevel = 0;

      for (const edge of edges) {
        if (edge.to === nodeId) {
          const depLevel = levelMap.get(edge.from) || 0;
          maxLevel = Math.max(maxLevel, depLevel + 1);
        }
      }

      node.level = maxLevel;
      levelMap.set(nodeId, maxLevel);
    }

    return { nodes, edges, topologicalOrder };
  }

  private static topologicalSort(
    nodes: TaskGraphNode[],
    edges: TaskGraphEdge[]
  ): string[] {
    // Kahn's algorithm for topological sort
    const order: string[] = [];
    const nodeMap = new Map<string, TaskGraphNode>();
    const inDegreeCopy = new Map<string, number>();

    for (const node of nodes) {
      nodeMap.set(node.id, node);
      inDegreeCopy.set(node.id, node.inDegree);
    }

    const queue: string[] = nodes.filter((n) => n.inDegree === 0).map((n) => n.id);

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      order.push(nodeId);

      // Find all edges from this node
      const outgoingEdges = edges.filter((e) => e.from === nodeId);
      for (const edge of outgoingEdges) {
        const newInDegree = (inDegreeCopy.get(edge.to) || 0) - 1;
        inDegreeCopy.set(edge.to, newInDegree);
        if (newInDegree === 0) {
          queue.push(edge.to);
        }
      }
    }

    return order;
  }
}
