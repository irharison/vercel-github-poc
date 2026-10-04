/**
 * Umbrella app registry.
 *
 * Adding an app: create its routes (for example app/(umbrella)/ledger/...)
 * and append one entry here. The launcher and the header switcher both read
 * this list. Give the app its own URL prefix so it cannot collide with
 * /api/auth, /api/pd, or another app.
 */
export type UmbrellaApp = {
  id: string;
  name: string;
  href: string;
  description: string;
  /** Path prefixes that mean this app is the one on screen. */
  match: string[];
};

export const apps: readonly UmbrellaApp[] = [
  {
    id: "property",
    name: "ND Property",
    href: "/property",
    description:
      "UK deal appraisal for residential development and limited-company buy-to-let, plus a Spain villa purchase and renovation model. Figures are editable defaults, not advice.",
    match: ["/property"],
  },
  {
    id: "fathom",
    name: "Fathom Desk",
    href: "/fathom",
    description:
      "Teaching trading-and-risk desk. Blotter, ticket, pricing, market data, risk, and a vendor-shaped API. Books and prices are fictional.",
    match: ["/fathom"],
  },
];

export function activeApp(pathname: string): UmbrellaApp | undefined {
  return apps.find((app) =>
    app.match.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)),
  );
}
