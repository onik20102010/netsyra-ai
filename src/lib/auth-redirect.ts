// src/lib/auth-redirect.ts
//
// Resolves the post-login destination.
//
// The middleware sends unauthenticated users to /login?redirectTo=<path>.
// After signing in — and for users who are already signed in — we send them
// back to that exact page instead of a generic landing page, so clicking
// "Netsyra Chat" while logged in never shows a login screen.

export const DEFAULT_AUTH_REDIRECT = "/chat";

/**
 * Returns a safe internal path to redirect to after authentication.
 *
 * Only same-origin absolute paths are allowed. Anything else (external URLs,
 * protocol-relative URLs, or auth pages themselves) falls back to the default
 * so a crafted `redirectTo` value cannot send users off-site.
 */
export function resolveRedirectTo(
  redirectTo?: string | null,
  fallback: string = DEFAULT_AUTH_REDIRECT
): string {
  if (!redirectTo) return fallback;

  // Must be a root-relative path — rejects "https://evil.com" and "//evil.com".
  if (!redirectTo.startsWith("/") || redirectTo.startsWith("//")) return fallback;

  // Don't bounce users back into the auth pages.
  const path = redirectTo.split("?")[0].replace(/\/+$/, "");
  if (["/login", "/register", "/forgot-password"].includes(path)) return fallback;

  return redirectTo;
}
