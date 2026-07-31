// d:\netsyra\src\app\api\ide\run-task\route.ts
// SECURITY: This route no longer spawns processes on the server.
// Build/lint/typecheck tasks run on the user's own machine via the local bridge.
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: "Server-side task execution is disabled. Use the local bridge to run tasks on your own machine." },
    { status: 503 }
  );
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { error: "Server-side task execution is disabled." },
    { status: 503 }
  );
}
