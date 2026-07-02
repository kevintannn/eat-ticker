import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_COOKIE, isValidToken } from "@/lib/auth";

/**
 * Guards the admin routes (Next 16 "proxy" convention, formerly middleware).
 * Locked visitors are sent to /db, which renders the PIN gate. /db itself is
 * intentionally not matched so it can show that gate.
 */
export async function proxy(req: NextRequest) {
  const unlocked = await isValidToken(req.cookies.get(ADMIN_COOKIE)?.value);
  if (unlocked) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/db";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/meal/:path*", "/employees/:path*", "/meals/:path*"],
};
