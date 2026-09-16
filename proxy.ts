import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAllowedEmail, isPublicPath, safeCallbackUrl } from "@/lib/auth-domain";

export const proxy = auth((req) => {
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

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const signInUrl = new URL("/signin", req.nextUrl);
  const callbackUrl = safeCallbackUrl(pathname + req.nextUrl.search);
  if (callbackUrl !== "/") {
    signInUrl.searchParams.set("callbackUrl", callbackUrl);
  }
  return NextResponse.redirect(signInUrl);
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
