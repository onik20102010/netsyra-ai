// d:\netsyra\src\ide\file-utils.ts

// ------------------------------------------------------------------
// 1. Language Mapping (Monaco Editor)
// ------------------------------------------------------------------

const LANGUAGE_MAP: Record<string, string> = {
  // Web Development
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'scss',
  sass: 'sass',
  less: 'less',
  json: 'json',
  jsonc: 'jsonc',
  md: 'markdown',
  mdx: 'markdown',

  // Backend / Systems
  py: 'python',
  go: 'go',
  rs: 'rust',
  cpp: 'cpp',
  cxx: 'cpp',
  h: 'cpp',
  hpp: 'cpp',
  c: 'c',
  java: 'java',
  rb: 'ruby',
  php: 'php',
  swift: 'swift',
  kt: 'kotlin',
  kts: 'kotlin',
  
  // Configs / Shell
  sh: 'shell',
  bash: 'shell',
  zsh: 'shell',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'toml',
  xml: 'xml',
  svg: 'xml',
  gitignore: 'ignore',
  env: 'plaintext',
  lock: 'plaintext',
};

export function getLanguageFromPath(path: string): string {
  const filename = path.split('/').pop() || path;
  
  // Handle dotfiles with no extension (e.g., .gitignore)
  if (filename.startsWith('.') && !filename.includes('.', 1)) {
    return LANGUAGE_MAP[filename.substring(1)] || 'plaintext';
  }

  const parts = filename.split('.');
  if (parts.length < 2) return 'plaintext';
  
  const ext = parts.pop()?.toLowerCase() || '';
  return LANGUAGE_MAP[ext] || 'plaintext';
}

// ------------------------------------------------------------------
// 2. File & Folder Icon Helpers (For Explorer Tree)
// ------------------------------------------------------------------

export type FileIconDetails = {
  iconName: string; // Name of a Lucide icon (e.g., 'File', 'FileCode')
  color: string;    // Hex color for the icon
};

// Map specific file extensions to VS Code-like color themes
const FILE_COLOR_MAP: Record<string, string> = {
  // JS/TS
  ts: '#3178c6',
  tsx: '#3178c6',
  js: '#f7df1e',
  jsx: '#f7df1e',
  mjs: '#f7df1e',
  cjs: '#f7df1e',
  
  // HTML/CSS
  html: '#e34c26',
  htm: '#e34c26',
  css: '#563d7c',
  scss: '#c6538c',
  sass: '#c6538c',
  less: '#1d365d',
  
  // Data/Config
  json: '#cbcb41',
  jsonc: '#cbcb41',
  yaml: '#cb4e1d',
  yml: '#cb4e1d',
  xml: '#0060ac',
  svg: '#ffb13b',
  toml: '#9c4221',
  env: '#d4b83d',
  
  // Docs
  md: '#083fa1',
  mdx: '#083fa1',
  
  // Backend
  py: '#3572a5',
  go: '#00add8',
  rs: '#dea584',
  cpp: '#f34b7d',
  c: '#555555',
  java: '#b07219',
  rb: '#701516',
  php: '#4f5d95',
  swift: '#ffac45',
  kt: '#a97bff',
  
  // Shell
  sh: '#89e051',
  bash: '#89e051',
  zsh: '#89e051',
  gitignore: '#e4e4e4',
  lock: '#d4d4d4',
};

export function getFileIconDetails(path: string, isDirectory: boolean): FileIconDetails {
  if (isDirectory) {
    return { iconName: 'Folder', color: '#90a4ae' }; // Muted blue-grey folder
  }

  const filename = path.split('/').pop() || path;
  const parts = filename.split('.');
  if (parts.length < 2) {
    return { iconName: 'File', color: '#d4d4d4' };
  }

  const ext = parts.pop()?.toLowerCase() || '';
  
  // Map to appropriate Lucide icon name based on extension
  let iconName = 'File';
  if (['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'py', 'go', 'rs', 'cpp', 'c', 'java'].includes(ext)) {
    iconName = 'FileCode';
  } else if (['json', 'jsonc', 'yaml', 'yml', 'toml', 'xml'].includes(ext)) {
    iconName = 'FileJson';
  } else if (['md', 'mdx'].includes(ext)) {
    iconName = 'FileText';
  } else if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(ext)) {
    iconName = 'Image';
  } else if (['css', 'scss', 'sass', 'less'].includes(ext)) {
    iconName = 'FileCode';
  }

  // Assign color or fallback to a default grey
  const color = FILE_COLOR_MAP[ext] || '#a0a0a0';
  
  return { iconName, color };
}