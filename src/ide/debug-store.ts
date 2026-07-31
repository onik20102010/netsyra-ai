// d:\netsyra\src\ide\debug-store.ts
import { create } from 'zustand';

export type DebugStatus = 'idle' | 'running' | 'paused' | 'terminated' | 'error';

export interface StackFrame {
  id: string;
  functionName: string;
  location: string; // file:line:col
  filePath: string;
  line: number;
  column: number;
}

export interface ScopeVariable {
  name: string;
  value: string;
  type: string;
}

export interface Breakpoint {
  id: string;
  filePath: string;
  line: number;
  enabled: boolean;
  condition?: string;
  hit?: boolean;
}

export interface DebugConsoleEntry {
  id: string;
  timestamp: number;
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  content: string;
}

interface DebugStore {
  status: DebugStatus;
  currentSessionId: string | null;
  breakpoints: Breakpoint[];
  callStack: StackFrame[];
  variables: Record<string, ScopeVariable[]>; // scope name -> vars
  watchExpressions: Array<{ id: string; expression: string; value?: string }>;
  consoleEntries: DebugConsoleEntry[];

  // Actions
  setStatus: (status: DebugStatus) => void;
  setSessionId: (id: string | null) => void;
  addBreakpoint: (bp: Omit<Breakpoint, 'id'>) => void;
  removeBreakpoint: (id: string) => void;
  toggleBreakpoint: (id: string) => void;
  clearBreakpoints: () => void;
  setBreakpointHit: (filePath: string, line: number, hit: boolean) => void;
  setCallStack: (frames: StackFrame[]) => void;
  setVariables: (vars: Record<string, ScopeVariable[]>) => void;
  addWatchExpression: (expression: string) => void;
  removeWatchExpression: (id: string) => void;
  updateWatchValue: (id: string, value: string) => void;
  addConsoleEntry: (entry: Omit<DebugConsoleEntry, 'id' | 'timestamp'>) => void;
  clearConsole: () => void;
  reset: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useDebugStore = create<DebugStore>((set) => ({
  status: 'idle',
  currentSessionId: null,
  breakpoints: [],
  callStack: [],
  variables: {},
  watchExpressions: [],
  consoleEntries: [],

  setStatus: (status) => set({ status }),
  setSessionId: (id) => set({ currentSessionId: id }),

  addBreakpoint: (bp) =>
    set((s) => {
      // Don't add duplicate breakpoints
      const exists = s.breakpoints.some(
        (b) => b.filePath === bp.filePath && b.line === bp.line
      );
      if (exists) return s;
      return { breakpoints: [...s.breakpoints, { ...bp, id: generateId() }] };
    }),

  removeBreakpoint: (id) =>
    set((s) => ({ breakpoints: s.breakpoints.filter((b) => b.id !== id) })),

  toggleBreakpoint: (id) =>
    set((s) => ({
      breakpoints: s.breakpoints.map((b) =>
        b.id === id ? { ...b, enabled: !b.enabled } : b
      ),
    })),

  clearBreakpoints: () => set({ breakpoints: [] }),

  setBreakpointHit: (filePath, line, hit) =>
    set((s) => ({
      breakpoints: s.breakpoints.map((b) =>
        b.filePath === filePath && b.line === line ? { ...b, hit } : b
      ),
    })),

  setCallStack: (frames) => set({ callStack: frames }),
  setVariables: (vars) => set({ variables: vars }),

  addWatchExpression: (expression) =>
    set((s) => ({
      watchExpressions: [...s.watchExpressions, { id: generateId(), expression }],
    })),

  removeWatchExpression: (id) =>
    set((s) => ({
      watchExpressions: s.watchExpressions.filter((w) => w.id !== id),
    })),

  updateWatchValue: (id, value) =>
    set((s) => ({
      watchExpressions: s.watchExpressions.map((w) =>
        w.id === id ? { ...w, value } : w
      ),
    })),

  addConsoleEntry: (entry) =>
    set((s) => ({
      consoleEntries: [...s.consoleEntries, { ...entry, id: generateId(), timestamp: Date.now() }].slice(-500),
    })),

  clearConsole: () => set({ consoleEntries: [] }),

  reset: () =>
    set({
      status: 'idle',
      currentSessionId: null,
      callStack: [],
      variables: {},
      consoleEntries: [],
    }),
}));
