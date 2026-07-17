// d:\netsyra\src\ide\agent.ts

import { useIdeStore } from './store';
import { FileItem } from './types';

// Read specific lines from a file content
export function readFileLines(content: string, startLine: number, endLine: number): string {
  const lines = content.split('\n');
  const start = Math.max(0, startLine - 1);
  const end = Math.min(lines.length, endLine);
  return lines.slice(start, end).join('\n');
}

// Read a specific function or class from content
export function readFunction(content: string, functionName: string): string | null {
  const lines = content.split('\n');
  let inFunction = false;
  let braceCount = 0;
  let functionLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this line contains the function definition
    if (line.includes(`function ${functionName}`) || 
        line.includes(`${functionName}(`) ||
        line.includes(`${functionName} =`) ||
        line.match(new RegExp(`^\\s*(const|let|var)?\\s*${functionName}\\s*[:=]`))) {
      inFunction = true;
    }

    if (inFunction) {
      functionLines.push(line);
      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;

      if (braceCount === 0 && functionLines.length > 0) {
        return functionLines.join('\n');
      }
    }
  }

  return null;
}

// Read imports and dependencies from a file
export function readImports(content: string): string[] {
  const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
  const imports: string[] = [];
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

// Find a file by path in the workspace
export function findFileByPath(filePath: string): FileItem | null {
  const state = useIdeStore.getState();
  const workspace = state.workspace;
  
  if (!workspace) {
    return null;
  }

  const findFile = (items: FileItem[]): FileItem | null => {
    for (const item of items) {
      if (item.path === filePath && !item.isDirectory) return item;
      if (item.isDirectory && item.children) {
        const found = findFile(item.children);
        if (found) return found;
      }
    }
    return null;
  };

  return findFile(workspace.files);
}

// Search for files by name pattern
export function searchFiles(pattern: string): FileItem[] {
  const state = useIdeStore.getState();
  const workspace = state.workspace;
  
  if (!workspace) {
    return [];
  }

  const search = (items: FileItem[]): FileItem[] => {
    const results: FileItem[] = [];
    for (const item of items) {
      if (item.name.toLowerCase().includes(pattern.toLowerCase())) {
        results.push(item);
      }
      if (item.isDirectory && item.children) {
        results.push(...search(item.children));
      }
    }
    return results;
  };

  return search(workspace.files);
}

// Get file content by path
export function getFileContent(filePath: string): string | null {
  const file = findFileByPath(filePath);
  return file?.content || null;
}

// Get file context based on user request
export async function getFileContext(filePath: string, context: 'lines' | 'function' | 'imports', param?: string): Promise<string> {
  const file = findFileByPath(filePath);
  
  if (!file || !file.content) {
    return `File not found: ${filePath}`;
  }

  switch (context) {
    case 'lines':
      if (param) {
        const [start, end] = param.split('-').map(Number);
        return readFileLines(file.content, start, end);
      }
      return file.content;
    
    case 'function':
      if (param) {
        const funcContent = readFunction(file.content, param);
        return funcContent || `Function '${param}' not found`;
      }
      return file.content;
    
    case 'imports':
      const imports = readImports(file.content);
      return imports.length > 0 ? imports.join('\n') : 'No imports found';
    
    default:
      return file.content;
  }
}

// Get active file context
export function getActiveFileContext(): { path: string | null; content: string | null; language: string | null } {
  const state = useIdeStore.getState();
  const activeFileId = state.activeFileId;
  const openFiles = state.openFiles;
  
  const activeFile = openFiles.find(f => f.id === activeFileId);
  
  return {
    path: activeFile?.path || null,
    content: activeFile?.content || null,
    language: activeFile?.language || null,
  };
}

// Get workspace structure overview
export function getWorkspaceStructure(): string {
  const state = useIdeStore.getState();
  const workspace = state.workspace;
  
  if (!workspace) {
    return 'No workspace opened';
  }

  const formatTree = (items: FileItem[], level = 0): string => {
    return items.map(item => {
      const indent = '  '.repeat(level);
      if (item.isDirectory) {
        const children = item.children ? formatTree(item.children, level + 1) : '';
        return `${indent}${item.name}/\n${children}`;
      }
      return `${indent}${item.name}\n`;
    }).join('');
  };

  return `${workspace.name}/\n${formatTree(workspace.files)}`;
}
