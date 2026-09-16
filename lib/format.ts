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
const pct = new Intl.NumberFormat("en-GB", {
  maximumFractionDigits: 2,
});

export function money(value: number): string {
  return gbp0.format(value);
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
