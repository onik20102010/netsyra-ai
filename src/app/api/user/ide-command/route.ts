import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getUser(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user) return null;
  return data.session.user;
}

function escapeSingleQuotes(value: string) {
  return value.replace(/'/g, "''");
}

function buildCommand(
  userId: string,
  nCode: string,
  idePassword: string,
  token: string,
  secure: boolean,
  origin: string
): string {
  const safeToken = escapeSingleQuotes(token);
  const safeUserId = escapeSingleQuotes(userId);
  const safeCode = escapeSingleQuotes(nCode);
  const safePassword = escapeSingleQuotes(idePassword);
  const safeHost = "127.0.0.1";

  const allowedOrigins = [
    origin || "https://www.netsyraai.com",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
  ]
    .filter((o, i, arr) => o && arr.indexOf(o) === i)
    .join(",");
  const safeOrigins = escapeSingleQuotes(allowedOrigins);

  const tls = secure
    ? `if (-not (Test-Path '127.0.0.1.pem')) {\n  if (-not (Get-Command mkcert -ErrorAction SilentlyContinue)) {\n    Write-Host 'mkcert is not installed. Install it from https://github.com/FiloSottile/mkcert then run this command again.' -ForegroundColor Red\n    exit 1\n  }\n  mkcert -install\n  mkcert 127.0.0.1\n}\n$env:AGENT_TLS_CERT='127.0.0.1.pem'\n$env:AGENT_TLS_KEY='127.0.0.1-key.pem'\n`
    : "";

  const killPort = `$agentProcs = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ }\nif ($agentProcs) { $agentProcs | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }\n`;

  const script = `cd 'd:\\netsyra'\n${tls}${killPort}$env:AGENT_HOST='${safeHost}'\n$env:AGENT_PORT='3001'\n$env:AGENT_TOKEN='${safeToken}'\n$env:AGENT_ALLOWED_ORIGINS='${safeOrigins}'\n$env:NETSYRA_USER='${safeUserId}'\n$env:NETSYRA_CODE='${safeCode}'\n$env:NETSYRA_PASS='${safePassword}'\nnpm run agent`;

  const encoded = Buffer.from(script, "utf16le").toString("base64");
  return `powershell -NoProfile -EncodedCommand ${encoded}`;
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const user = await getUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { n_code?: string; ide_password?: string; secure?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const nCode = typeof body.n_code === "string" ? body.n_code.trim() : "";
  const idePassword = typeof body.ide_password === "string" ? body.ide_password.trim() : "";

  if (!nCode || !idePassword) {
    return NextResponse.json({ error: "N code and IDE password are required" }, { status: 400 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("n_code, ide_password, terminal_token")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.n_code !== nCode || profile.ide_password !== idePassword) {
    return NextResponse.json({ error: "check this problem..." }, { status: 401 });
  }

  let token = profile.terminal_token;
  if (!token) {
    const { data, error } = await supabase.rpc("verify_terminal_credentials", {
      p_n_code: nCode,
      p_ide_password: idePassword,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const result = (data as { success: boolean; token?: string; error?: string }) ?? {};
    if (!result.success) {
      return NextResponse.json({ error: result.error || "check this problem..." }, { status: 401 });
    }

    if (!result.token) {
      return NextResponse.json({ error: "No token returned" }, { status: 500 });
    }

    token = result.token;
  }

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const secure =
    body.secure === true ||
    forwardedProto === "https" ||
    request.nextUrl.protocol === "https:";

  const origin =
    request.headers.get("origin") ||
    request.headers.get("referer") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.netsyraai.com";

  const command = buildCommand(user.id, nCode, idePassword, token, secure, origin);

  return NextResponse.json({ command, token });
}
