/** Google Workspace / Google account domain allowed to use this app. */
export const ALLOWED_EMAIL_DOMAIN = "nataliedennis.co.uk";
export const ALLOWED_EMAIL_SUFFIX = `@${ALLOWED_EMAIL_DOMAIN}`;

/** JWT + cookie lifetime. Activity via proxy/auth() rolls this forward. */
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
/** Throttle how often a rolling JWT cookie is re-issued (Auth.js updateAge). */
export const SESSION_UPDATE_AGE_SECONDS = 24 * 60 * 60;

export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalised = email.trim().toLowerCase();
  const at = normalised.lastIndexOf("@");
  if (at <= 0) return false;
  return normalised.slice(at) === ALLOWED_EMAIL_SUFFIX;
}

/** Paths that may be reached without a nataliedennis.co.uk session. */
export function isPublicPath(pathname: string): boolean {
  if (pathname.startsWith("/api/auth")) return true;
  if (pathname === "/signin" || pathname.startsWith("/signin/")) return true;
  if (pathname === "/auth/error" || pathname.startsWith("/auth/error/")) return true;
  return false;
}

/** Only same-origin relative paths; never protocol-relative or auth/API loops. */
export function safeCallbackUrl(url: string | null | undefined): string {
  if (!url) return "/";
  if (!url.startsWith("/") || url.startsWith("//") || url.startsWith("/\\")) return "/";
  if (url.includes("://") || url.includes("\\")) return "/";
  if (
    url.startsWith("/signin") ||
    url.startsWith("/auth/error") ||
    url.startsWith("/api/")
  ) {
    return "/";
  }
  return url;
}

export function canCreateSession(params: {
  email?: string | null;
  emailVerified?: boolean | null;
}): boolean {
  if (params.emailVerified === false) return false;
  return isAllowedEmail(params.email);
}
