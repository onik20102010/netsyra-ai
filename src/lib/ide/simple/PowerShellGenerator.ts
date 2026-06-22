export interface ProjectConfig {
  projectName: string;
  drive: "C:" | "D:" | "E:" | "F:";
  directory: string;
}

export interface FileToCreate {
  name: string;
  content: string;
}

export function generateDirectoryCommand(config: ProjectConfig): string {
  const fullPath = `${config.drive}\\${config.directory}`;
  return `New-Item -ItemType Directory -Path "${fullPath}"`;
}

export function generateFileCommand(config: ProjectConfig, file: FileToCreate): string {
  const fullPath = `${config.drive}\\${config.directory}\\${file.name}`;
  const escapedContent = file.content.replace(/"/g, '`"');
  return `@"
${escapedContent}
"@ | Set-Content "${fullPath}"`;
}

export function generateProjectCommands(config: ProjectConfig, files: FileToCreate[]): string[] {
  const commands: string[] = [];
  
  commands.push(generateDirectoryCommand(config));
  
  files.forEach(file => {
    commands.push(generateFileCommand(config, file));
  });
  
  return commands;
}
