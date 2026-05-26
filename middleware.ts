import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const isAuthenticated = request.cookies.get("site_access")?.value === "granted";
  const { pathname } = request.nextUrl;
  const isPasswordPage = pathname === "/password";
  const isPasswordApi = pathname === "/api/password";
  const isAdminRoute =
    pathname === "/admin" ||
    pathname === "/api/rsvp/admin" ||
    pathname === "/api/guests/seed";

  if (isPasswordPage || isPasswordApi || isAdminRoute) {
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/password", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
