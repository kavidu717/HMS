import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE = "access_token";
const PUBLIC_ROUTES = new Set(["/login", "/activate-account"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAuthCookie = Boolean(request.cookies.get(AUTH_COOKIE)?.value);

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(hasAuthCookie ? "/dashboard" : "/login", request.url),
    );
  }

  // Cookie presence is only an optimistic route check. The backend verifies
  // the token through /auth/me before the client renders protected content.
  if (PUBLIC_ROUTES.has(pathname)) {
    return NextResponse.next();
  }

  if (!hasAuthCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
