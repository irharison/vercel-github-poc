export interface AreaPreset {
  postcode: string;
  label: string;
  note?: string;
}

export interface AreaGroup {
  name: string;
  districts: AreaPreset[];
  note?: string;
}

export const nw2: AreaGroup = {
  name: "London NW2",
  note: "Cricklewood, Dollis Hill and Neasden. District plus its sectors.",
  districts: [
    { postcode: "NW2", label: "NW2 (whole district)" },
    { postcode: "NW2 1", label: "NW2 1", note: "Dollis Hill" },
    { postcode: "NW2 2", label: "NW2 2", note: "Cricklewood" },
    { postcode: "NW2 3", label: "NW2 3", note: "Cricklewood" },
    { postcode: "NW2 4", label: "NW2 4", note: "Willesden Green" },
    { postcode: "NW2 5", label: "NW2 5", note: "Cricklewood" },
    { postcode: "NW2 6", label: "NW2 6", note: "Dollis Hill" },
    { postcode: "NW2 7", label: "NW2 7", note: "Neasden" },
  ],
};

export const exeter: AreaGroup = {
  name: "Exeter",
  note: "EX1–EX4 are the city proper; EX5 and EX6 are the rural fringe and will skew a city-wide average.",
  districts: [
    { postcode: "EX1", label: "EX1", note: "City centre and east" },
    { postcode: "EX2", label: "EX2", note: "South and Marsh Barton" },
    { postcode: "EX3", label: "EX3", note: "Topsham" },
    { postcode: "EX4", label: "EX4", note: "North and west, university" },
    { postcode: "EX5", label: "EX5", note: "Rural east (Broadclyst)" },
    { postcode: "EX6", label: "EX6", note: "Rural west (Exminster)" },
  ],
};

export const areaGroups: AreaGroup[] = [nw2, exeter];

export interface PdEndpointOption {
  endpoint: string;
  label: string;
  description: string;
  credits: number;
}

export const researchEndpoints: PdEndpointOption[] = [
  { endpoint: "prices", label: "Asking prices", description: "Average asking price and 80% range for the area.", credits: 1 },
  { endpoint: "sold-prices", label: "Sold prices", description: "Land Registry price-paid averages.", credits: 1 },
  { endpoint: "rents", label: "Asking rents", description: "Average asking rent. Drives the ICR borrowing cap.", credits: 1 },
  { endpoint: "yields", label: "Yields", description: "Gross yield for the area.", credits: 1 },
  { endpoint: "growth", label: "Price growth", description: "Historic growth, to inform the exit assumption.", credits: 1 },
  { endpoint: "demand", label: "Sales demand", description: "How quickly stock is being absorbed.", credits: 1 },
  { endpoint: "valuation-sale", label: "Sale valuation", description: "Point valuation for a specific property.", credits: 1 },
  { endpoint: "valuation-rent", label: "Rent valuation", description: "Point rental valuation for a specific property.", credits: 1 },
  { endpoint: "planning-applications", label: "Planning applications", description: "Recent applications nearby.", credits: 1 },
  { endpoint: "council-tax", label: "Council tax", description: "Band costs for the local authority.", credits: 1 },
];

export const ALLOWED_ENDPOINTS: Record<string, { credits: number; noCache?: boolean }> = {
  prices: { credits: 1 },
  "prices-per-sqf": { credits: 1 },
  "sold-prices": { credits: 1 },
  "sold-prices-per-sqf": { credits: 1 },
  "valuation-sale": { credits: 1 },
  "valuation-rent": { credits: 1 },
  "valuation-hmo": { credits: 1 },
  rents: { credits: 1 },
  "rents-hmo": { credits: 1 },
  yields: { credits: 1 },
  growth: { credits: 1 },
  demand: { credits: 1 },
  "demand-rent": { credits: 1 },
  "development-calculator": { credits: 1 },
  "area-type": { credits: 1 },
  "postcode-key-stats": { credits: 1 },
  demographics: { credits: 1 },
  crime: { credits: 1 },
  schools: { credits: 1 },
  "council-tax": { credits: 1 },
  "energy-efficiency": { credits: 1 },
  "planning-applications": { credits: 1 },
  politics: { credits: 1 },
  restaurants: { credits: 1 },
  "account/credits": { credits: 0, noCache: true },
};

export function normalisePostcode(value: string): string {
  return String(value).trim().toUpperCase().replace(/\s+/g, " ");
}

export function extractNumber(body: unknown, candidateKeys: string[]): number | null {
  function findKey(node: unknown, wanted: string): number | null {
    if (node && typeof node === "object" && !Array.isArray(node)) {
      const record = node as Record<string, unknown>;
      for (const [key, value] of Object.entries(record)) {
        if (key.toLowerCase() !== wanted) continue;
        if (typeof value === "number") return value;
        if (typeof value === "string") {
          const parsed = Number(value.replace(/[^0-9.\-]/g, ""));
          if (Number.isFinite(parsed)) return parsed;
        }
      }
      for (const value of Object.values(record)) {
        const found = findKey(value, wanted);
        if (found != null) return found;
      }
    } else if (Array.isArray(node)) {
      for (const item of node) {
        const found = findKey(item, wanted);
        if (found != null) return found;
      }
    }
    return null;
  }

  for (const candidate of candidateKeys) {
    const found = findKey(body, candidate.toLowerCase());
    if (found != null) return found;
  }
  return null;
}

export function readAveragePrice(body: unknown): number | null {
  return extractNumber(body, ["average_price", "average", "long_let_average_price", "price"]);
}

export function readMonthlyRent(body: unknown): number | null {
  const monthly = extractNumber(body, [
    "average_rent_per_month",
    "long_let_average_rent_month",
    "rent_per_month",
  ]);
  if (monthly != null) return monthly;
  const weekly = extractNumber(body, [
    "average_rent_per_week",
    "long_let_average_rent",
    "rent_per_week",
    "average_rent",
  ]);
  if (weekly == null) return null;
  return (weekly * 52) / 12;
}

export function cacheKey(endpoint: string, params: Record<string, string>): string {
  const canonical = Object.entries(params)
    .map(([k, v]) => {
      const key = k.trim().toLowerCase();
      const value = key === "postcode" ? normalisePostcode(v) : v.trim();
      return [key, value] as [string, string];
    })
    .filter(([k, v]) => v !== "" && k !== "key" && k !== "refresh" && k !== "token")
    .sort(([a], [b]) => a.localeCompare(b));
  const qs = new URLSearchParams(canonical).toString();
  return `pd:v1:${endpoint}${qs ? `?${qs}` : ""}`;
}
