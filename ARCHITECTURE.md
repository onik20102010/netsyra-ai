# Netsyra IDE — Phase 1: Overall Architecture

> **Phase 1 deliverable only.** This document defines the production-ready architecture for the new browser-based AI-native IDE. No implementation code, UI, components, pages, or APIs are created in this phase.

---

## 1. Product Vision

Netsyra IDE is a continuously running **software engineering runtime** that behaves like a single autonomous engineer rather than a request-response chatbot.

The runtime is always aware of:

- Current workspace and project structure
- Active and recently opened files
- Project architecture and conventions
- Execution state and running tasks
- Persistent project memory and user preferences
- Current plan and recent actions

The runtime loop is:

```
Runtime → Observe → Reason → Plan → Execute → Verify → Stream → Wait → Observe Again
```

It is not:

```
User → Request → Response
```

---

## 2. Core Principles

| Principle | Meaning |
|-----------|---------|
| **Modular** | Every subsystem is independently replaceable. |
| **Event-driven** | All communication is through the Runtime Kernel via typed events. |
| **Plugin-based** | New capabilities are added as plugins without changing the kernel. |
| **Incremental** | Indexing, execution, and streaming happen in small deltas. |
| **Streaming-first** | Every action produces a stream of progress events to the UI. |
| **Low-token** | Only the minimum context is sent to AI models. |
| **Memory-aware** | Long-term context is reconstructed from persistent memory, not long prompts. |
| **Fault-tolerant** | A failing subsystem does not crash the runtime. |
| **Scalable** | Stateless APIs and persistent memory support many workspaces. |
| **Commercial-ready** | Quotas, tiers, telemetry, and auditability are built in. |

---

## 3. Runtime Architecture

### 3.1. Layer Overview

The architecture is organized into seven layers. Each layer has a single responsibility and never calls another layer directly. The Runtime Kernel is the only coordinator.

| Layer | Responsibility |
|-------|----------------|
| **Runtime Kernel** | Central coordinator, lifecycle, event routing, dependency graph, health checks. |
| **Event Bus** | Typed, ordered, priority-based event stream with replay and interceptors. |
| **Workspace Layer** | File system abstraction, indexing, project intelligence, knowledge graph. |
| **Intelligence Layer** | Memory, context, planning, task graph, learning. |
| **Execution Layer** | Scheduling, code generation, sandbox execution, verification. |
| **Model & Tool Layer** | Model routing, tool definitions, provider abstraction, quotas. |
| **Streaming & Session Layer** | SSE streaming, session lifecycle, timeline, event history. |
| **UI Layer** | React client components that subscribe to events and send actions. |

### 3.2. Subsystem Reference

| Subsystem | Layer | Responsibility |
|-----------|-------|----------------|
| `Runtime Kernel` | Runtime | Bootstraps all subsystems, routes events, manages lifecycle, handles failures. |
| `Runtime Event Bus` | Runtime | Publish/subscribe, typed events, ordering, replay, priority queues. |
| `Plugin Manager` | Runtime | Loads, registers, isolates, and unloads plugins. |
| `Configuration Manager` | Runtime | Workspace, user, and feature-flag configuration. |
| `Diagnostics` | Runtime | Health checks, logs, traces, subsystem status. |
| `Telemetry` | Runtime | Usage metrics, latency, token counts, errors, quotas. |
| `Workspace Engine` | Workspace | File tree, watchers, snapshots, change tracking, CRUD. |
| `Workspace Indexer` | Workspace | Incremental parsing, AST, symbols, search, dependency graph. |
| `Project Intelligence` | Workspace | High-level project understanding, conventions, architecture. |
| `Knowledge Graph` | Workspace | Entities (files, classes, functions, APIs) and their relationships. |
| `Workspace Operations` | Workspace | File operations, refactoring, diff/patch, git operations. |
| `Context Engine` | Intelligence | Context-window assembly, relevance scoring, compression, summarization. |
| `Memory Engine` | Intelligence | Short-term, long-term, project, user memory backed by Supabase. |
| `Planning Engine` | Intelligence | Plan generation, decomposition, replanning, plan validation. |
| `Task Graph` | Intelligence | DAG of tasks, dependencies, priorities, status. |
| `Learning Engine` | Intelligence | Feedback loop, pattern detection, preference adaptation. |
| `Execution Scheduler` | Execution | Concurrency, quotas, resource limits, task ordering. |
| `Execution Runtime` | Execution | Sandbox for shell, tests, preview, code execution. |
| `Code Generator` | Execution | Model-driven code generation, diff generation, patch application. |
| `Verification Engine` | Execution | Type check, lint, tests, run, compare, verify. |
| `Model Router` | Model | Provider selection, quotas, budget, fallback, rate limiting. |
| `Tool Engine` | Model | Tool definitions, execution, validation, result parsing. |
| `Streaming Engine` | Streaming | SSE/WebSocket, event delivery, heartbeat, reconnection. |
| `Timeline Engine` | Streaming | Event history, undo, timeline, session replay. |
| `Session Manager` | Session | Session lifecycle, multi-tab, auth, state persistence. |
| `UI State Store` | UI | Thin state layer that subscribes to runtime events. |
| `UI Components` | UI | Editor, panels, tree, status bar, chat, timeline. |

---

## 4. Communication Rules

1. **No direct subsystem calls.** Every subsystem registers with the Runtime Kernel and communicates through events.
2. **Typed events.** Every event has a name, schema, version, and source subsystem.
3. **Event routing.** The Kernel decides which subsystems receive which events. It can route, filter, and transform.
4. **Interceptors.** Plugins can intercept and modify events before they are delivered.
5. **No business logic in the UI.** The UI only sends actions and renders events. It does not plan or execute.

---

## 5. Data Flow

Every user action becomes a runtime workflow.

```
User Action
    ↓
Runtime Event (action)
    ↓
Runtime Kernel
    ↓
Router (Model / Tool)
    ↓
Planner (Planning Engine + Task Graph)
    ↓
Execution (Code Generator + Execution Runtime)
    ↓
Verification (Verification Engine)
    ↓
Streaming Engine
    ↓
UI
```

At each stage, subsystems emit events back to the Kernel. The Kernel updates state, streams progress, and advances the workflow.

---

## 6. State Management

State is split by responsibility. Subsystems own their own state. The Kernel owns a small amount of orchestration state.

| State | Owner | Persistence |
|-------|-------|-------------|
| Workspace | Workspace Engine | Memory + disk (real-time) |
| Index | Workspace Indexer | Memory + partial rebuild on changes |
| Knowledge Graph | Knowledge Graph | Supabase + memory cache |
| Memory | Memory Engine | Supabase + short-term memory |
| Plan | Planning Engine | Supabase + session memory |
| Tasks | Task Graph | Supabase + session memory |
| Execution | Execution Runtime | Session memory + logs |
| Session | Session Manager | Supabase + cookies |
| UI | UI State Store | Client memory only |
| Config | Configuration Manager | Supabase + env vars |

No state is shared by direct mutation. State changes are published as events.

---

## 7. Memory Strategy

- **Last-3-prompt rule.** Only the last three conversation messages are sent to the AI model.
- **Context reconstruction.** Everything else is reconstructed from persistent project memory.
- **Memory sources:**
  - Workspace summary and active file context
  - Knowledge graph (entities, relationships, recent changes)
  - Current plan and task graph
  - Execution history and verification results
  - User preferences and learned patterns
- **Persistent storage:** Supabase tables for project memory, execution sessions, and chat summaries.
- **Compression:** Long context is summarized and indexed before being stored.

---

## 8. Model Router

| Concern | Rule |
|---------|------|
| Free tier | Use `GROQ_API_KEY_2`, lightweight models, strict quotas. |
| Paid tier | Use Mesh API, premium reasoning, larger execution budgets. |
| Selection | Automatic based on task complexity, model availability, user tier, and budget. |
| Fallback | If a provider fails, the router falls back to the next available model. |
| Rate limiting | Quotas are enforced per user, per model, per workspace. |
| Token budget | Each call is capped; responses are streamed to avoid token spikes. |

The router is a plugin. New providers can be added without changing the planner or execution layer.

---

## 9. UI Independence

- The UI is a **subscriber** to the runtime.
- It receives events such as `workspace:updated`, `plan:changed`, `execution:progress`, `stream:chunk`, `verification:completed`.
- It sends **actions** such as `user:message`, `file:opened`, `task:accepted`, `task:rejected`.
- It never contains business logic.
- The UI layer is free to be rebuilt (React, Web Components, etc.) as long as it speaks the event protocol.

---

## 10. Performance & Scalability

- **Incremental indexing:** Only changed files are reindexed.
- **Lazy loading:** The workspace indexer loads symbols on demand.
- **Debouncing:** File watchers and model calls are batched.
- **Parallel execution:** Independent tasks run in parallel.
- **Streaming:** Large responses are streamed to the UI in chunks.
- **Stateless runtime APIs:** API routes are stateless; state lives in Supabase and the client.
- **Distributed execution:** Long-running tasks can be moved to a job queue or worker.
- **Large repositories:** The indexer uses file trees and shallow scans first; deep analysis is on demand.

---

## 11. Error Handling

- **Health checks.** The Kernel periodically checks every subsystem.
- **Circuit breakers.** Repeated failures pause a subsystem and trigger fallback.
- **Retries.** Transient failures are retried with exponential backoff.
- **Isolation.** A failing subsystem does not stop the runtime or other subsystems.
- **Recovery.** The Kernel can restart a failed subsystem, reload its state, and continue.
- **Streaming errors.** Errors are streamed to the UI as events with severity and recovery hints.

---

## 12. Lifecycle

### Startup

1. Load configuration.
2. Initialize the Runtime Event Bus.
3. Initialize the Runtime Kernel.
4. Load and register plugins.
5. Start Workspace Engine and load the workspace tree.
6. Start Workspace Indexer and build the index.
7. Start Memory, Context, Planning, Execution, and Model layers.
8. Start Streaming Engine and Session Manager.
9. Emit `runtime:ready` event.

### Runtime

1. Wait for user action or system event.
2. Kernel creates a runtime workflow.
3. Router, Planner, Execution, and Verification stages run.
4. Progress events stream to the UI.
5. State is persisted to Supabase.
6. Loop.

### Shutdown

1. Stop accepting new actions.
2. Flush pending events.
3. Persist runtime state and memory.
4. Close streaming connections.
5. Stop subsystems in reverse dependency order.
6. Emit `runtime:stopped`.

---

## 13. Extension Points

- **Plugin API:** Register new subsystems, intercept events, add lifecycle hooks.
- **Tool API:** Register new tools with name, schema, validation, and executor.
- **Model Provider API:** Register new model providers with routing rules.
- **Indexer Provider API:** Add new language parsers or analyzers.
- **UI Theme API:** Optional future extension for custom UI themes.

---

## 14. Proposed Directory Layout

The runtime lives under `src/ide/`. The UI lives under `src/components/ide/`. The `app/ide/` route is a thin entry point. No implementation files are created in Phase 1.

```
src/ide/
  kernel/
    kernel.ts
    lifecycle.ts
  bus/
    event-bus.ts
    event-types.ts
    interceptors.ts
  workspace/
    engine.ts
    indexer.ts
    intelligence.ts
    knowledge-graph.ts
    operations.ts
  intelligence/
    context.ts
    memory.ts
    planning.ts
    task-graph.ts
    learning.ts
  execution/
    scheduler.ts
    runtime.ts
    code-generator.ts
    verification.ts
  models/
    router.ts
    providers/
    tools/
  streaming/
    streamer.ts
    timeline.ts
  session/
    session-manager.ts
  plugins/
    registry.ts
    types.ts
  config/
    manager.ts
  telemetry/
    telemetry.ts
  diagnostics/
    diagnostics.ts

src/components/ide/
  IDE.tsx
  panels/
  editor/
  layout/
  hooks/

src/app/ide/
  layout.tsx
  page.tsx
  api/
    runtime/
    stream/

src/lib/ide/
  types.ts
```

This structure is a blueprint. Phase 2 will create the minimal files needed for the runtime entry point.

---

## 15. Dependencies

- **Framework:** Next.js 16 App Router
- **Language:** TypeScript 5
- **UI:** React 19
- **Auth & Storage:** Supabase
- **Streaming:** Server-Sent Events (primary), WebSocket (fallback for premium)
- **Models:** GROQ API, Mesh API
- **Editor:** Monaco Editor
- **Execution:** WebContainer or Node.js child process (server-side)
- **Telemetry:** OpenTelemetry (via `instrumentation.ts`)

---

## 16. Summary

This architecture treats Netsyra IDE as a long-running AI software engineer. It is modular, event-driven, plugin-based, and streaming-first. Every subsystem is independent, communicates through the Runtime Kernel, and follows a strict data flow. Memory is persistent and low-token, the model router is tier-aware, and the UI is a thin subscriber. The system is designed for commercial scale, fault tolerance, and incremental evolution.

Phase 2 will implement the Runtime Kernel and Event Bus first, then layer the remaining subsystems on top.
