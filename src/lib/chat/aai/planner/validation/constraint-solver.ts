import { Constraint, ConstraintViolation } from "../planner-types";

export class ConstraintSolver {
  private constraints: Constraint[] = [];

  addConstraint(constraint: Constraint) {
    this.constraints.push(constraint);
  }

  check(state: any): ConstraintViolation[] {
    const violations: ConstraintViolation[] = [];
    for (const constraint of this.constraints) {
      if (!constraint.check(state)) {
        violations.push({
          constraintId: constraint.id,
          description: constraint.description,
        });
      }
    }
    return violations;
  }
}
