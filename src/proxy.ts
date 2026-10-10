import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic gate only: guests without a session cookie are sent to /kirish.
 * The real admin check (signed cookie + DB role) happens in app/admin/layout.tsx and every /api/admin/* route.
 */
export function proxy(request: NextRequest) {
  if (!request.cookies.get("sh_session")?.value) {
    const url = new URL("/kirish", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
