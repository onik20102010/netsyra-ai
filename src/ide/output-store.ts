// d:\netsyra\src\ide\output-store.ts
import { create } from 'zustand';

export type OutputLevel = 'info' | 'success' | 'warning' | 'error' | 'command';

export interface OutputLine {
  id: string;
  timestamp: number;
  level: OutputLevel;
  content: string;
  source: string; // e.g. 'build', 'typecheck', 'lint', 'dev'
}

export type TaskStatus = 'idle' | 'running' | 'success' | 'failed' | 'cancelled';

export interface OutputChannel {
  id: string;
  label: string;
  lines: OutputLine[];
  status: TaskStatus;
  startedAt?: number;
  finishedAt?: number;
}

interface OutputStore {
  channels: Record<string, OutputChannel>;
  activeChannelId: string;
  setActiveChannel: (id: string) => void;
  appendLine: (channelId: string, line: Omit<OutputLine, 'id' | 'timestamp'>) => void;
  appendLines: (channelId: string, lines: Array<Omit<OutputLine, 'id' | 'timestamp'>>) => void;
  clearChannel: (channelId: string) => void;
  setChannelStatus: (channelId: string, status: TaskStatus) => void;
  startChannel: (channelId: string) => void;
  finishChannel: (channelId: string, status: 'success' | 'failed' | 'cancelled') => void;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

const defaultChannels: Record<string, OutputChannel> = {
  build: { id: 'build', label: 'Build', lines: [], status: 'idle' },
  typecheck: { id: 'typecheck', label: 'Typecheck', lines: [], status: 'idle' },
  lint: { id: 'lint', label: 'Lint', lines: [], status: 'idle' },
  dev: { id: 'dev', label: 'Dev Server', lines: [], status: 'idle' },
};

export const useOutputStore = create<OutputStore>((set) => ({
  channels: defaultChannels,
  activeChannelId: 'build',

  setActiveChannel: (id) => set({ activeChannelId: id }),

  appendLine: (channelId, line) =>
    set((s) => {
      const channel = s.channels[channelId];
      if (!channel) return s;
      const newLine: OutputLine = {
        ...line,
        id: generateId(),
        timestamp: Date.now(),
      };
      // Cap at 1000 lines per channel to prevent memory bloat
      const lines = [...channel.lines, newLine].slice(-1000);
      return {
        channels: {
          ...s.channels,
          [channelId]: { ...channel, lines },
        },
      };
    }),

  appendLines: (channelId, newLines) =>
    set((s) => {
      const channel = s.channels[channelId];
      if (!channel) return s;
      const mapped: OutputLine[] = newLines.map((l) => ({
        ...l,
        id: generateId(),
        timestamp: Date.now(),
      }));
      const lines = [...channel.lines, ...mapped].slice(-1000);
      return {
        channels: {
          ...s.channels,
          [channelId]: { ...channel, lines },
        },
      };
    }),

  clearChannel: (channelId) =>
    set((s) => {
      const channel = s.channels[channelId];
      if (!channel) return s;
      return {
        channels: {
          ...s.channels,
          [channelId]: { ...channel, lines: [], status: 'idle' },
        },
      };
    }),

  setChannelStatus: (channelId, status) =>
    set((s) => {
      const channel = s.channels[channelId];
      if (!channel) return s;
      return {
        channels: {
          ...s.channels,
          [channelId]: { ...channel, status },
        },
      };
    }),

  startChannel: (channelId) =>
    set((s) => {
      const channel = s.channels[channelId];
      if (!channel) return s;
      return {
        channels: {
          ...s.channels,
          [channelId]: {
            ...channel,
            status: 'running',
            startedAt: Date.now(),
            finishedAt: undefined,
            lines: [], // clear previous output on new run
          },
        },
      };
    }),

  finishChannel: (channelId, status) =>
    set((s) => {
      const channel = s.channels[channelId];
      if (!channel) return s;
      return {
        channels: {
          ...s.channels,
          [channelId]: {
            ...channel,
            status,
            finishedAt: Date.now(),
          },
        },
      };
    }),
}));
