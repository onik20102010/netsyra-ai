export async function buildContext(params: any) {
  return {
    activeFile: params.activeFile,
    fileContent: (params.fileContent || "").substring(0, 2000),
    projectFiles: [],
    recentMessages: params.messages.slice(-4).map((m: any) => `${m.role}: ${m.content}`).join("\n"),
  };
}