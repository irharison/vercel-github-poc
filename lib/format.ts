const gbp0 = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});
const gbp2 = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const eur0 = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const eur2 = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const pct = new Intl.NumberFormat("en-GB", {
  maximumFractionDigits: 2,
});
const fx = new Intl.NumberFormat("en-GB", {
  maximumFractionDigits: 4,
});

export function money(value: number): string {
  return gbp0.format(value);
}

export function eur(value: number): string {
  return eur0.format(value);
}

/** Pounds for a euro amount at a pounds-per-euro rate. */
export function moneyFromEur(eurAmount: number, gbpPerEur: number): string {
  return gbpPerEur > 0 ? gbp0.format(eurAmount * gbpPerEur) : "—";
}

export function eurPence(value: number): string {
  return eur2.format(value);
}

export function moneyPence(value: number): string {
  return gbp2.format(value);
}

export function percent(value: number): string {
  return `${pct.format(value)}%`;
}

export function ratio(value: number): string {
  return Number.isFinite(value) ? pct.format(value) : "—";
}

export function fxQuote(value: number): string {
  return Number.isFinite(value) ? fx.format(value) : "—";
}
