# Planning & Task Decomposition Engine - Implementation Summary

## Overview

Phase 6B — Planning & Task Decomposition Engine has been successfully implemented for the Netsyra IDE. This subsystem receives the structured output from the Intent & Objective Engine (Phase 6A) and transforms it into a complete execution strategy before any code is generated.

## Architecture

### Core Components

1. **Types Module** (`src/ide/intelligence/planning-engine/types.ts`)
   - Defines all interfaces for the planning engine
   - Includes 28 task categories (workspace_analysis, create_file, edit_file, verify, etc.)
   - Task statuses, priorities, complexities
   - Execution plan structure, parallel groups, blockers, risks
   - Token budgets, verification strategies, rollback strategies
   - Reusable components, milestone batches, plan diffs

2. **Planning Engine** (`src/ide/intelligence/planning-engine/planning-engine.ts`)
   - Core planning logic
   - Goal refinement and implementation strategy generation
   - Atomic task decomposition based on intent categories
   - Dependency detection and topological execution ordering
   - Parallel execution group detection
   - Blocker detection and risk assessment
   - Context optimization and reuse detection
   - Token budget planning
   - Verification and rollback strategy generation
   - Execution metadata and milestone generation
   - Incremental plan updates with plan diffing

3. **Planning Subsystem** (`src/ide/intelligence/planning-engine/planning-subsystem.ts`)
   - Wrapper class integrating Planning Engine with IDE runtime
   - Extends BaseSubsystem for lifecycle management
   - Listens for `intent:analysis_complete` events
   - Handles workspace update events for incremental replanning
   - Emits `plan:complete` events
   - Provides metrics and diagnostics

4. **Integration**
   - Added `PlanningEngine` to `src/ide/subsystems/builtin.ts`
   - Registered in default subsystems in `src/ide/subsystems/index.ts`
   - Positioned after Intent Engine, before Planner/Task Graph
   - Dependencies: intent-engine, knowledge-graph, memory-engine

## Key Features

### Goal Refinement
- Converts user's objective into implementation goals
- Adds intent type and scope context to goal
- Example: "Add GitHub login" → "Add GitHub OAuth authentication while preserving existing login flow"

### Atomic Task Decomposition
- Breaks work into smallest independent tasks
- Each task has exactly one responsibility
- Task categories: workspace_analysis, context, create_file, edit_file, delete_file, api, frontend, backend, verify, review, testing, documentation, configuration, etc.

### Task Metadata
Every task includes:
- Unique ID
- Title and description
- Category and priority
- Complexity and estimated duration
- Estimated tokens
- Dependencies
- Required context
- Expected output
- Possible risks
- Verification requirements
- Rollback strategy
- Completion criteria
- Status and retry policy

### Dependency Detection
- Explicit dependencies from task definitions
- Category-based dependencies (e.g., context before file operations, edits before verification)
- Topological sort for execution order
- Cycle detection and fallback ordering

### Parallel Execution
- Detects tasks that can safely execute together
- Groups them into execution batches
- Frontend UI, backend API, and documentation can run in parallel
- Sequential dependencies are respected

### Blocker Detection
Detects:
- Missing clarifications
- Low confidence intent analysis
- Missing database connections
- Missing configurations
- Missing dependencies

### Risk Assessment
- Breaking change risks
- Architecture impact risks
- Performance impact
- Security impact
- Token usage
- Regression probability
- Database/migration risks

### Context Optimization
- Determines exactly which files later phases need
- Collects files, folders, components, APIs, modules, symbols
- Minimizes token usage by avoiding unrelated files

### Token Planning
- Planning: 15%
- Context: 25%
- Generation: 30%
- Verification: 15%
- Patch: 5%
- Review: 5%
- Streaming: 5%
- Contingency: 20%

### Verification Strategy
- TypeScript
- Lint
- Build verification
- Unit tests
- Integration tests
- Regression testing
- Security checks
- Formatting

### Rollback Strategy
- Backup modified files
- Store previous patches
- Record changed symbols
- Preserve deleted files
- Restore commands

### Reuse Detection
- Searches for existing hooks, utilities, services, APIs, components
- Recommends reuse instead of recreation
- Integrates with knowledge graph summary

### Incremental Planning
- Reuses existing plans when possible
- Updates only affected tasks
- Replans on workspace changes
- Avoids regenerating entire plan

### Long Running Task Management
- Splits large requests into milestones
- Each milestone has multiple execution batches
- Each batch contains atomic tasks

## Runtime Position

```
User
    ↓
Intent & Objective Engine
    ↓
Planning & Task Decomposition Engine ← [NEW]
    ↓
Task Graph Engine
    ↓
Context Assembly
    ↓
Tool Runtime
    ↓
Code Generation
    ↓
Verification
    ↓
Patch Engine
    ↓
Streaming Runtime
```

## What It Does NOT Do

The Planning Engine strictly follows these rules:

- ❌ NEVER generates code
- ❌ NEVER edits files
- ❌ NEVER executes tools
- ❌ NEVER calls terminal
- ❌ NEVER modifies workspace
- ❌ NEVER generates patches
- ❌ NEVER verifies code
- ❌ NEVER updates project files
- ❌ NEVER answers like a chatbot
- ❌ NEVER bypasses planning

## Output Format

The engine produces a structured `ExecutionPlan` containing:

- Project Goal
- Execution Strategy
- Implementation Strategy
- Task List (with full metadata)
- Dependency List
- Execution Order
- Parallel Groups
- Blockers
- Risks
- Context Requirements
- Token Budget
- Verification Strategy
- Rollback Strategy
- Architecture Notes
- Planning Summary
- Execution Metadata
- Planning Confidence
- Reusable Components

## Usage Example

```typescript
import { PlanningEngine } from "@/ide/intelligence/planning-engine";
import type { PlanningEngineInput } from "@/ide/intelligence/planning-engine";

const engine = new PlanningEngine();

const plan = await engine.plan({
  intentAnalysis: {
    // ... from Intent Engine
    primaryGoal: "Add GitHub OAuth login",
    intentTypes: [{ category: "implement", confidence: 0.9 }],
    affectedScope: "feature",
    // ...
  },
  workspaceSummary: "Next.js app with Supabase auth",
  openFiles: ["src/app/auth/page.tsx"],
});

// Result includes:
// - Project goal with scope
// - Execution strategy (e.g., full_feature)
// - Atomic tasks:
//   - Analyze workspace context
//   - Gather required context
//   - Design new component structure
//   - Create OAuth provider
//   - Create API endpoints
//   - Create UI components
//   - Verify implementation
//   - Review changes
// - Dependencies and execution order
// - Parallel groups (e.g., API and UI can run in parallel)
// - Blockers (e.g., missing OAuth provider config)
// - Risks (e.g., breaking existing auth)
// - Token budget
// - Verification strategy (TypeScript, lint, tests)
// - Rollback strategy
```

## Integration with Intent Engine

The Intent Engine subsystem emits `intent:analysis_complete` events when analysis is complete. The Planning Engine subsystem listens for these events and immediately begins planning.

```
User Message
    ↓
IntentEngineSubsystem.analyze()
    ↓
emit "intent:analysis_complete"
    ↓
PlanningEngineSubsystem.onEvent()
    ↓
PlanningEngine.plan()
    ↓
emit "plan:complete"
```

## Success Criteria Met

✅ Every request is transformed into a clear execution strategy before implementation
✅ All work is decomposed into small, independent, dependency-aware tasks
✅ Execution order is optimized and parallel opportunities are identified
✅ Required context is minimized to reduce token usage
✅ Risks, blockers, and rollback strategies are identified before execution
✅ Existing project functionality is reused whenever possible
✅ Planning adapts incrementally to workspace or user changes
✅ No code is generated, no files are modified, and no tools are executed
✅ The engine produces a complete, structured execution plan for the Task Graph

## File Structure

```
src/ide/intelligence/planning-engine/
├── types.ts              # All type definitions
├── planning-engine.ts    # Core planning logic
├── planning-subsystem.ts # Runtime subsystem wrapper
└── index.ts              # Public exports
```

## Testing Recommendations

To test the Planning Engine:

1. Test with simple user requests (e.g., edit a file)
2. Test with complex feature requests (e.g., add authentication)
3. Verify task decomposition is atomic
4. Verify dependencies produce correct execution order
5. Verify parallel groups are independent
6. Verify blockers are detected for ambiguous inputs
7. Verify token budget is reasonable
8. Verify verification strategy matches the task types
9. Verify rollback strategy covers affected files
10. Verify incremental plan updates work
11. Verify the engine never generates code or modifies files

## Next Steps

The Planning Engine is now ready to feed the Task Graph Engine. The Task Graph Engine should:

1. Subscribe to `plan:complete` events
2. Build a DAG from the plan's tasks and dependencies
3. Schedule execution batches based on parallel groups
4. Pass context requirements to the Context Assembly phase
5. Trigger execution when tasks are ready
6. Update plan status as tasks complete or fail
