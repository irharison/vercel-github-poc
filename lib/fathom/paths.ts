/** Public prefix for the desk. Vendor paths stay under it: /fathom/api/Trades. */
export const FATHOM_PREFIX = "/fathom";

/** Turn a desk-relative API path into the public same-origin path. */
export function fathomApiPath(path: string): string {
  if (path.startsWith(`${FATHOM_PREFIX}/`)) return path;
  return `${FATHOM_PREFIX}${path.startsWith("/") ? path : `/${path}`}`;
}
