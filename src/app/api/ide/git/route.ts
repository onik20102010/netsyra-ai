// d:\netsyra\src\app\api\ide\git\route.ts
// SECURITY: This route no longer runs git commands on the server.
// Git status is provided by the user's own machine via the local bridge.
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      branch: null,
      ahead: 0,
      behind: 0,
      modified: 0,
      staged: 0,
      untracked: 0,
      hasGit: false,
    },
    { status: 200 }
  );
}
