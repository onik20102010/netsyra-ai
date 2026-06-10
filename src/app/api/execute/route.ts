import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, unlink } from "fs/promises";
import { randomUUID } from "crypto";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  const { code, language } = await req.json();
  if (!code) return NextResponse.json({ error: "No code provided" }, { status: 400 });

  const fileName = `/tmp/${randomUUID()}.${language === "python" ? "py" : "js"}`;
  try {
    await writeFile(fileName, code);
    const cmd = language === "python" ? `python3 ${fileName}` : `node ${fileName}`;
    const { stdout, stderr } = await execAsync(cmd, { timeout: 10000 });
    await unlink(fileName);
    return NextResponse.json({ output: stdout || stderr || "No output" });
  } catch (err: any) {
    await unlink(fileName).catch(() => {});
    return NextResponse.json({ output: err.stderr || err.message || "Execution failed" });
  }
}