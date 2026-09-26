export function money(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return value < 0 ? `−${formatted}` : formatted;
}

export function signedClass(value: number | null | undefined): string {
  if (value === null || value === undefined || Math.abs(value) < 0.5) return "flat";
  return value > 0 ? "up" : "down";
}

export function pctRate(value: number | null | undefined, digits = 3): string {
  if (value === null || value === undefined) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

export function num(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function compactDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${months[Number(m) - 1]} ${y}`;
}

export function productFamily(product: string): string {
  if (product === "BOND" || product === "IRS") return "Rates";
  if (product.startsWith("FX")) return "FX";
  if (product.startsWith("EQUITY")) return "Equity";
  return "Energy";
}

export function economics(row: {
  ProductType: string;
  FixedRate?: number | null;
  Strike?: number | null;
  OptionType?: string | null;
}): string {
  if (row.ProductType === "BOND" || row.ProductType === "IRS") return pctRate(row.FixedRate);
  if (row.ProductType === "FX_OPTION" || row.ProductType === "EQUITY_OPTION") {
    return `${row.OptionType === "PUT" ? "P" : "C"} ${num(row.Strike, row.ProductType === "FX_OPTION" ? 4 : 2)}`;
  }
  if (row.FixedRate == null) return "—";
  const digits = row.ProductType.startsWith("FX") ? 4 : 2;
  return num(row.FixedRate, digits);
}
