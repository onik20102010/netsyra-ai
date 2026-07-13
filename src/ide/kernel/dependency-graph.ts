import type { ISubsystem } from "./types";

export interface DependencyNode {
  id: string;
  dependencies: string[];
  dependents: string[];
}

export interface DependencyValidationError {
  type: "missing" | "circular" | "duplicate";
  subsystemId: string;
  dependencyId?: string;
  message: string;
}

export interface DependencyReport {
  valid: boolean;
  total: number;
  order: string[];
  missing: { subsystemId: string; dependencyId: string; requiredBy: string[] }[];
  duplicates: { id: string; count: number }[];
  cycles: string[][];
  orphaned: string[];
  errors: DependencyValidationError[];
}

export class DependencyGraph {
  private nodes = new Map<string, DependencyNode>();
  private errors: DependencyValidationError[] = [];
  private cycles: string[][] = [];

  build(subsystems: ISubsystem[]): DependencyReport {
    this.nodes.clear();
    this.errors = [];
    this.cycles = [];

    const seenIds = new Set<string>();
    const duplicates = new Map<string, number>();

    // Register nodes
    for (const subsystem of subsystems) {
      if (seenIds.has(subsystem.id)) {
        duplicates.set(subsystem.id, (duplicates.get(subsystem.id) || 0) + 1);
        this.errors.push({
          type: "duplicate",
          subsystemId: subsystem.id,
          message: `Duplicate subsystem ID: ${subsystem.id}`,
        });
        continue;
      }
      seenIds.add(subsystem.id);

      this.nodes.set(subsystem.id, {
        id: subsystem.id,
        dependencies: [...subsystem.dependencies],
        dependents: [],
      });
    }

    // Resolve dependency links and detect missing dependencies
    for (const [id, node] of this.nodes) {
      for (const dep of node.dependencies) {
        const depNode = this.nodes.get(dep);
        if (depNode) {
          depNode.dependents.push(id);
        } else {
          this.errors.push({
            type: "missing",
            subsystemId: id,
            dependencyId: dep,
            message: `Subsystem ${id} depends on missing subsystem ${dep}.`,
          });
        }
      }
    }

    // Detect cycles
    const order = this.resolveOrder();

    // Find orphaned subsystems (no dependencies and no dependents)
    const orphaned: string[] = [];
    for (const [id, node] of this.nodes) {
      if (node.dependencies.length === 0 && node.dependents.length === 0) {
        orphaned.push(id);
      }
    }

    const missing = this.buildMissingReport();

    return {
      valid: this.errors.length === 0 && this.cycles.length === 0,
      total: this.nodes.size,
      order,
      missing,
      duplicates: Array.from(duplicates.entries()).map(([id, count]) => ({ id, count })),
      cycles: this.cycles,
      orphaned,
      errors: this.errors,
    };
  }

  resolveOrder(): string[] {
    const result: string[] = [];
    const visited = new Set<string>();
    const temp = new Set<string>();
    const path: string[] = [];

    const visit = (id: string) => {
      if (temp.has(id)) {
        const cycleStart = path.indexOf(id);
        const cycle = path.slice(cycleStart).concat(id);
        this.cycles.push(cycle);
        this.errors.push({
          type: "circular",
          subsystemId: id,
          message: `Circular dependency detected: ${cycle.join(" -> ")}`,
        });
        return;
      }
      if (visited.has(id)) return;

      const node = this.nodes.get(id);
      if (!node) {
        // Missing dependency; already reported in build.
        return;
      }

      temp.add(id);
      path.push(id);
      for (const dep of node.dependencies) {
        visit(dep);
      }
      path.pop();
      temp.delete(id);
      visited.add(id);
      result.push(id);
    };

    for (const id of this.nodes.keys()) {
      visit(id);
    }

    return result;
  }

  getDependencies(id: string): string[] {
    return this.nodes.get(id)?.dependencies ?? [];
  }

  getDependents(id: string): string[] {
    return this.nodes.get(id)?.dependents ?? [];
  }

  getNodes(): DependencyNode[] {
    return Array.from(this.nodes.values());
  }

  private buildMissingReport(): { subsystemId: string; dependencyId: string; requiredBy: string[] }[] {
    const missing = new Map<string, { dependencyId: string; requiredBy: string[] }>();
    for (const error of this.errors) {
      if (error.type === "missing" && error.dependencyId) {
        const key = error.dependencyId;
        const entry = missing.get(key) || { dependencyId: key, requiredBy: [] };
        entry.requiredBy.push(error.subsystemId);
        missing.set(key, entry);
      }
    }
    return Array.from(missing.values()).map(({ dependencyId, requiredBy }) => ({
      subsystemId: dependencyId,
      dependencyId,
      requiredBy: Array.from(new Set(requiredBy)),
    }));
  }

  formatReport(report: DependencyReport): string {
    const lines: string[] = [];
    lines.push("Runtime Boot Report");
    lines.push("");

    for (const id of report.order) {
      const hasError = report.errors.some(e => e.subsystemId === id || e.dependencyId === id);
      const symbol = hasError ? "✗" : "✓";
      lines.push(`${symbol} ${id}`);
    }

    for (const missing of report.missing) {
      lines.push("");
      lines.push(`✗ ${missing.subsystemId}`);
      lines.push("  Reason: Subsystem not registered.");
      lines.push("  Required by:");
      for (const dependent of missing.requiredBy) {
        lines.push(`    - ${dependent}`);
      }
    }

    for (const cycle of report.cycles) {
      lines.push("");
      lines.push(`✗ Circular dependency: ${cycle.join(" -> ")}`);
    }

    for (const dup of report.duplicates) {
      lines.push("");
      lines.push(`✗ Duplicate subsystem ID: ${dup.id} (count: ${dup.count})`);
    }

    return lines.join("\n");
  }
}
