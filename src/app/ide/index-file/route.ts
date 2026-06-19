import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateEmbedding } from "@/lib/embeddings";

function chunkCodeByExports(content: string, filePath: string): { text: string; type: string; name: string }[] {
  const chunks: { text: string; type: string; name: string }[] = [];
  
  // Split by export declarations
  const lines = content.split("\n");
  let currentChunk: string[] = [];
  let currentType = "file";
  let currentName = filePath.split("/").pop()?.replace(/\.\w+$/, "") || "unnamed";
  
  for (const line of lines) {
    // Detect export start
    const exportMatch = line.match(/export\s+(default\s+)?(function|class|const|let|var)\s+(\w+)/);
    if (exportMatch) {
      // Save previous chunk
      if (currentChunk.length > 0) {
        chunks.push({ text: currentChunk.join("\n"), type: currentType, name: currentName });
      }
      currentChunk = [line];
      currentType = exportMatch[2] === "class" ? "class" : exportMatch[2] === "function" ? "function" : "variable";
      currentName = exportMatch[3];
    } else {
      currentChunk.push(line);
    }
  }
  
  // Last chunk
  if (currentChunk.length > 0) {
    chunks.push({ text: currentChunk.join("\n"), type: currentType, name: currentName });
  }
  
  // If no exports found, chunk the whole file as one
  if (chunks.length === 0) {
    chunks.push({ text: content, type: "file", name: currentName });
  }
  
  return chunks;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { path, content } = await req.json();
    if (!path || content === undefined)
      return NextResponse.json({ error: "path and content required" }, { status: 400 });

    // Delete old chunks for this file
    await supabase.from("ide_file_chunks").delete().eq("user_id", user.id).eq("path", path);

    const chunks = chunkCodeByExports(content, path);
    if (chunks.length === 0) return NextResponse.json({ success: true, chunks: 0 });

    const rows = [];
    for (let i = 0; i < chunks.length; i++) {
      try {
        const embedding = await generateEmbedding(chunks[i].text);
        if (embedding) {
          rows.push({
            user_id: user.id,
            path,
            content: chunks[i].text,
            embedding,
            chunk_index: i,
            metadata: chunks[i].type && chunks[i].name
              ? { type: chunks[i].type, name: chunks[i].name }
              : {},
          });
        }
      } catch (embedErr) {
        console.error(`Embedding failed for chunk ${i} of ${path}:`, embedErr);
        // Continue with other chunks
      }
    }

    if (rows.length > 0) {
      const { error: insertErr } = await supabase.from("ide_file_chunks").insert(rows);
      if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, chunks: rows.length });
  } catch (err: any) {
    console.error("Index file error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}