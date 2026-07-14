"use server";

/**
 * Fetch wrapper that prevents SSRF by:
 * - only allowing http/https
 * - blocking private/local IPs and localhost
 * - following redirects manually so the final URL is always checked
 */

const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]", "[::]"]);

function isPrivateIP(host: string): boolean {
  // IPv4 ranges
  const parts = host.split(".");
  if (parts.length === 4 && parts.every((p) => /^\d+$/.test(p) && Number(p) >= 0 && Number(p) <= 255)) {
    const [a, b, c, d] = parts.map(Number);
    if (a === 0) return true;
    if (a === 10) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 198 && b === 18) return true;
    if (a === 198 && b === 51 && c === 100) return true;
    if (a === 203 && b === 0 && c === 113) return true;
    if (a === 255 && b === 255 && c === 255 && d === 255) return true;
    return false;
  }
  // IPv6 link-local / loopback / unspecified
  if (host === "::1" || host === "::" || host.toLowerCase().startsWith("fe80:")) return true;
  return false;
}

function isSafeUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  const host = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host)) return false;
  if (isPrivateIP(host)) return false;
  return true;
}

export async function safeFetch(url: string, maxRedirects = 5, signal?: AbortSignal): Promise<Response> {
  if (!isSafeUrl(url)) {
    throw new Error(`Unsafe or disallowed URL: ${url}`);
  }

  let current = url;
  for (let i = 0; i < maxRedirects; i++) {
    const res = await fetch(current, {
      redirect: "manual",
      signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new Error(`Redirect missing Location header`);
      const next = new URL(location, current).toString();
      if (!isSafeUrl(next)) throw new Error(`Redirect to unsafe URL blocked: ${next}`);
      current = next;
      continue;
    }

    return res;
  }

  throw new Error(`Too many redirects`);
}
