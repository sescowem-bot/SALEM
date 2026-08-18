import { NextResponse, type NextRequest } from "next/server";
import { getMiddlewareClient } from "@/lib/supabase/middleware-client";

/**
 * Server-side gate for the entire /admin area. Runs before any page or
 * layout renders — unauthenticated requests never reach protected admin
 * code, regardless of client-side JS. This is the primary enforcement
 * point required by Phase 3 §3 ("Do not rely only on client-side
 * protection"); admin/layout.tsx adds a second, redundant check for
 * defence in depth.
 *
 * Only checks that a session exists. Role-based authorization (which
 * roles may see which pages/actions) happens after this, once we know who
 * the user is — see lib/auth/permissions.ts and lib/auth/session.ts.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isLoginRoute = pathname === "/admin/login";

  if (!isAdminRoute || isLoginRoute) {
    return NextResponse.next();
  }

  const { supabase, getResponse } = getMiddlewareClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return getResponse();
}

export const config = {
  matcher: ["/admin/:path*"],
};
