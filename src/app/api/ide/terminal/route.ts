// d:\netsyra\src\app\api\ide\terminal\route.ts
// SECURITY: This route no longer spawns shell processes on the server.
// Terminal execution happens on the user's own machine via a local bridge.
// Netsyra only provides the UI interface.
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: "Server-side terminal is disabled. Use the local bridge to connect your own machine." },
    { status: 503 }
  );
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: "Server-side terminal is disabled. Use the local bridge to connect your own machine." },
    { status: 503 }
  );
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { error: "Server-side terminal is disabled." },
    { status: 503 }
  );
}
