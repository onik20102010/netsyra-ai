// d:\netsyra\src\ide\theme-constants.ts
// Unified Windsurf-inspired palette for the entire Netsyra IDE.
// All components should reference these instead of hardcoded colors.

export const THEME = {
  // Backgrounds (dark → light)
  bgDarkest: '#0d1117',    // Main editor/chat background
  bgDark: '#161b22',       // Cards, bubbles, input boxes
  bgMid: '#1f2428',        // Hover states, secondary surfaces
  bgLight: '#21262d',      // Borders, subtle separators
  bgLighter: '#30363d',    // Active borders, stronger separators

  // Text
  textPrimary: '#e6edf3',   // Main text
  textSecondary: '#8b949e', // Secondary text
  textMuted: '#6e7681',     // Muted labels, icons
  textFaint: '#484f58',     // Very faint text, line numbers

  // Accents
  accent: '#34e8bb',        // Primary teal accent (Windsurf signature)
  accentHover: '#2dd4a8',   // Hover state for accent
  accentDim: 'rgba(52, 232, 187, 0.1)',  // Dimmed accent backgrounds
  accentBorder: 'rgba(52, 232, 187, 0.3)', // Accent borders

  // Semantic colors
  blue: '#58a6ff',
  green: '#3fb950',
  greenBg: '#238636',
  greenHover: '#2ea043',
  red: '#f85149',
  yellow: '#d29922',
  purple: '#a371f7',
  orange: '#db6d28',

  // Borders
  border: '#21262d',
  borderStrong: '#30363d',
  borderHover: '#484f58',

  // Status bar
  statusBarBg: '#0d1117',
  statusBarAccent: '#34e8bb',

  // Activity bar
  activityBarBg: '#0d1117',
  activityBarIcon: '#6e7681',
  activityBarIconActive: '#e6edf3',
  activityBarBorder: '#1f2428',

  // Sidebar
  sidebarBg: '#0d1117',
  sidebarHeader: '#161b22',

  // Tab bar
  tabActiveBg: '#0d1117',
  tabInactiveBg: '#161b22',
  tabBorder: '#1f2428',
  tabActiveText: '#e6edf3',
  tabInactiveText: '#6e7681',

  // Editor
  editorBg: '#0d1117',
  editorFg: '#e6edf3',
  editorLineNumber: '#484f58',
  editorLineNumberActive: '#8b949e',
  editorSelection: '#1f6feb40',
  editorLineHighlight: '#161b22',
  editorCursor: '#34e8bb',
} as const;

// Tailwind-friendly class fragments for common patterns
export const SURFACE_CLASSES = {
  panel: 'bg-[#0d1117] text-[#e6edf3]',
  card: 'bg-[#161b22] border border-[#30363d]',
  hover: 'hover:bg-[#1f2428]',
  border: 'border-[#21262d]',
  borderStrong: 'border-[#30363d]',
  textPrimary: 'text-[#e6edf3]',
  textSecondary: 'text-[#8b949e]',
  textMuted: 'text-[#6e7681]',
  textFaint: 'text-[#484f58]',
  accent: 'text-[#34e8bb]',
  accentBg: 'bg-[#34e8bb]',
  accentBorder: 'border-[#34e8bb]',
} as const;
