import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isRouteAllowed, defaultRouteFor } from "@/lib/roles";

// Routes that are always accessible without a session
const PUBLIC = ["/login", "/api/auth/login"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAuthed = req.cookies.get("erp_auth")?.value === "1";
  const role = req.cookies.get("erp_role")?.value || "Admin";
  const isPublic = PUBLIC.some((p) => pathname.startsWith(p));

  // Not logged in and trying to open a protected page -> go to /login
  if (!isAuthed && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Already logged in but visiting /login -> send to dashboard
  if (isAuthed && pathname === "/login") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Logged in but this role isn't allowed on this page -> send to their home
  if (
    isAuthed &&
    !isPublic &&
    !pathname.startsWith("/api/") &&
    !isRouteAllowed(role, pathname)
  ) {
    const url = req.nextUrl.clone();
    url.pathname = defaultRouteFor(role);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Run on all paths except Next internals and static assets
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
