import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAuthDevBypass } from "@/lib/auth-dev";
import { isAllowedEmail, isApiPath, isPublicPath, safeCallbackUrl } from "@/lib/auth-domain";

const authProxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const allowed = isAllowedEmail(req.auth?.user?.email);

  if (allowed && isPublicPath(pathname) && !pathname.startsWith("/api/auth")) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (allowed) {
    return NextResponse.next();
  }

  if (isApiPath(pathname)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const signInUrl = new URL("/signin", req.nextUrl);
  const callbackUrl = safeCallbackUrl(pathname + req.nextUrl.search);
  if (callbackUrl !== "/") {
    signInUrl.searchParams.set("callbackUrl", callbackUrl);
  }
  return NextResponse.redirect(signInUrl);
});

export function proxy(
  ...args: Parameters<typeof authProxy>
): ReturnType<typeof authProxy> {
  if (isAuthDevBypass()) {
    return NextResponse.next();
  }
  return authProxy(...args);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
