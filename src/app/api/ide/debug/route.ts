// d:\netsyra\src\app\api\ide\debug\route.ts
// SECURITY: This route no longer spawns debug processes on the server.
// Debugging happens on the user's own machine via the local bridge.
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: "Server-side debugging is disabled. Use the local bridge to debug on your own machine." },
    { status: 503 }
  );
}

export async function GET() {
  return NextResponse.json(
    { error: "Server-side debugging is disabled.", configs: [] },
    { status: 503 }
  );
}
