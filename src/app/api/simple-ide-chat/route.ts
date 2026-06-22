import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getNextGroqKey } from "@/lib/scale";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const {
    messages,          // last 8 user/assistant messages
    projectName,
    drive,
    directory,
    fileNames,         // last 10 file names only
    folderStructure,   // full tree from explorer
    isProjectEmpty,
  } = body;

  const systemPrompt = buildSimpleSystemPrompt(
    projectName,
    drive,
    directory,
    fileNames,
    folderStructure,
    isProjectEmpty
  );

  const apiKey = getNextGroqKey();
  // Use a fast model for snappy responses
  const model = "llama-3.1-8b-instant";

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.2,
      max_tokens: 1000,
      stream: true,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return new Response(err, { status: response.status });
  }

  // Pipe the stream directly to the client
  return new Response(response.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function buildSimpleSystemPrompt(
  projectName: string,
  drive: string,
  directory: string,
  fileNames: string[],
  folderStructure: string,
  isProjectEmpty: boolean
): string {
  if (isProjectEmpty) {
    return `You are a helpful coding assistant. The user has an empty project folder named "${projectName}" on drive ${drive} in directory "${directory}".
Ask the user for the project directory and drive if not already provided.
When the user wants to create files and folders, generate PowerShell commands inside @" ... "@ blocks.
Example:
@"
mkdir src
cd src
New-Item -Name index.html -ItemType File
"@
Only provide the commands, no extra text.`;
  }

  return `You are a coding assistant inside a web IDE.
Project: ${projectName}
Drive: ${drive || "unknown"}
Directory: ${directory || "unknown"}
Last 10 files: ${fileNames.join(", ")}

Current folder structure:
${folderStructure}

Use this information to help the user. When the user requests code or file changes, output PowerShell commands in @" ... "@ blocks to create/modify files. Keep replies concise.`;
}