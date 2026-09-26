/**
 * Local-only escape hatch so the umbrella can be opened without Google.
 *
 * Active only when all of these are true:
 * - AUTH_DEV_BYPASS=1
 * - NODE_ENV is development (next dev). next build / next start set production.
 * - VERCEL is unset. Vercel always sets VERCEL=1, including preview deployments.
 *
 * Next.js inlines these values at build time. A production build on Vercel
 * compiles this function to a constant false, so setting the variable in the
 * Vercel dashboard cannot turn the bypass on.
 */
export function isAuthDevBypass(): boolean {
  if (process.env.VERCEL) return false;
  if (process.env.NODE_ENV !== "development") return false;
  return process.env.AUTH_DEV_BYPASS === "1";
}
