// src/lib/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { resolveRedirectTo } from "@/lib/auth-redirect";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes that require authentication
  const protectedRoutes = ["/dashboard", "/chat", "/history", "/ide", "/profile", "/usage", "/cv-builder"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(`${route}/`)
  );

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set(
      "redirectTo",
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    );
    return NextResponse.redirect(url);
  }

  // Already signed in → skip the auth pages entirely and go into the app.
  // Exception: password-recovery links land on /login?password-reset=true with a
  // temporary session, so leave that flow alone.
  const authRoutes = ["/login", "/register"];
  const isPasswordRecovery = request.nextUrl.searchParams.has("password-reset");
  if (user && !isPasswordRecovery && authRoutes.includes(request.nextUrl.pathname)) {
    const target = resolveRedirectTo(
      request.nextUrl.searchParams.get("redirectTo")
    );
    // `target` may carry its own query string (e.g. /chat?model=pro),
    // so resolve it as a full URL against the current origin.
    return NextResponse.redirect(new URL(target, request.url));
  }

  // Admin-only routes
  const adminEmail = process.env.ADMIN_EMAIL || "onik20102010@gmail.com";
  if (request.nextUrl.pathname.startsWith("/admin") && (!user || user.email !== adminEmail)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}