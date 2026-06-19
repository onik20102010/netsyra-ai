interface ToolCall {
  tool: string;
  params: any;
}

export function extractToolCalls(content: string): ToolCall[] {
  const calls: ToolCall[] = [];
  const toolRegex = /```tool\n([\s\S]*?)```/g;
  let match;
  while ((match = toolRegex.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      calls.push(parsed);
    } catch {}
  }
  return calls;
}

export async function executeToolCall(call: ToolCall, writeFileFn?: (path: string, content: string) => void) {
  switch (call.tool) {
    case "create_file":
      if (writeFileFn && call.params.path && call.params.content) {
        writeFileFn(call.params.path, call.params.content);
      }
      break;
    case "terminal":
      // We cannot run terminal from web, so we'll just log it and let user copy
      console.log("Terminal command:", call.params.command);
      break;
    // future tools...
  }
}