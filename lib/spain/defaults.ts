import type { RenovationTier, SpainVillaInputs, TaxBand } from "./types";

/**
 * Planning defaults for a resale villa in Andalucía (Málaga / Marbella area).
 * Every figure is an estimate for a model, not a quote and not advice.
 * Confirm with a Spanish lawyer (abogado) or gestor before relying on it.
 *
 * - Purchase price €750,000 is illustrative, not a valuation.
 * - Resale ITP is Andalucía's general 7%. A non-resident second home usually
 *   does not get the reduced rates some resident buyers qualify for.
 *   The new-build alternative is 10% IVA + 1.2% AJD, both editable.
 * - Notary 0.75% and land registry 0.75% sit inside the usual 0.5–1% band.
 * - Lawyer 1% of the price, plus 21% IVA on that fee.
 * - NIE, bank and admin €1,000. Building survey €1,500.
 * - Buyer's agent 0%. If one is used, about 3% plus IVA is a common fee.
 * - Currency spread 0.5% of the euros bought for that finance option.
 *   A high-street bank is often nearer 2–3%.
 * - 0.86 pounds per euro is a placeholder. Replace it with a live rate.
 * - Renovation defaults to 200 m² at the medium tier of €1,000/m².
 *   Light is €500/m², full is €1,800/m². Line-item amounts are kept but
 *   are not added unless that mode is selected, so they are not double-counted.
 * - Architect and project manager 10% of the works budget.
 * - Licencia de obra / ICIO 4% of the works budget. Town halls vary, up to about 4%.
 * - IVA 21% on works, professional fees and contingency. A reduced 10% can
 *   apply to some renovations of a home.
 * - Contingency 10% of works plus professional fees. It does not gross-up ICIO.
 * - Spanish non-resident mortgage: 70% of the price (typical cap 60–70%),
 *   3.5% fixed, 20 years, 1% arrangement fee paid in cash, €450 bank valuation.
 *   Other mortgage-deed costs default to €0 because the lender often pays them.
 * - UK remortgage: £500,000 at 4.5% over 20 years, 1% arrangement, £1,500 other fees.
 * - Running costs are placeholders. IRNR defaults to 24% for a UK resident,
 *   on imputed income of 1.1% of a €300,000 cadastral-value placeholder
 *   (about 40% of the default price — the real valor catastral will differ).
 * - Appreciation for the rent-or-buy comparison is 2% a year, from the
 *   post-renovation value or, if that is blank, from the purchase price.
 * - Peak-season letting is off. Turning it on uses 3 months at €5,500 a month,
 *   60% occupancy, a 20% manager plus 21% IVA, and a €350 one-off VFT allowance.
 *   Andalucía requires that registration before a tourist let is advertised.
 * - Renting instead defaults to 7 months (about October to May) at €2,500 a
 *   month, a Costa del Sol off-season planning figure, not a listing. Deposit
 *   is 2 months and is refundable, so it is not a cost. The agency fee is one
 *   month plus 21% IVA, charged each season. Utilities €250 a month, cleaning
 *   €300, insurance €180, no car hire, €600 of travel. Rent and the other
 *   seasonal costs rise 3% a year.
 * - Digital nomad residency is off, so the owner stays a non-resident and
 *   purchase tax is unchanged. Switching it on uses planning allowances:
 *   visa and application €160, TIE €16, translations and apostilles €400,
 *   criminal-record check €120, immigration lawyer €1,500, health insurance
 *   €1,500 a year, and an €800 renewal every 3 years. The income test uses
 *   €48,000 against €34,188 (200% of the 2026 minimum wage, about €2,849 a
 *   month). IRPF bands are a combined state + Andalucía estimate, after a
 *   €5,550 personal allowance. Beckham is 24% up to €600,000 and 47% above,
 *   for 6 years, and only if eligible. UK income tax is left blank.
 */
export const SPAIN_ESTIMATE_NOTE =
  "These rates are planning estimates for Andalucía, not a quote and not tax or mortgage advice. Confirm them with a Spanish lawyer or gestor before you rely on the figures.";

export const RENOVATION_ITEM_KEYS = [
  "kitchenEur",
  "bathroomsEur",
  "poolEur",
  "roofEur",
  "servicesEur",
  "windowsEur",
  "landscapingEur",
  "furnishingEur",
] as const;

export type RenovationItemKey = (typeof RENOVATION_ITEM_KEYS)[number];

export const RENOVATION_ITEM_LABELS: Record<RenovationItemKey, string> = {
  kitchenEur: "Kitchen",
  bathroomsEur: "Bathrooms",
  poolEur: "Pool",
  roofEur: "Roof",
  servicesEur: "Electrics and plumbing",
  windowsEur: "Windows",
  landscapingEur: "Landscaping",
  furnishingEur: "Furnishing",
};

export const RENOVATION_TIERS: ReadonlyArray<{
  id: RenovationTier;
  label: string;
  key: "lightEurPerM2" | "mediumEurPerM2" | "fullEurPerM2";
  hint: string;
}> = [
  {
    id: "light",
    label: "Light",
    key: "lightEurPerM2",
    hint: "Decoration and minor fittings.",
  },
  {
    id: "medium",
    label: "Medium",
    key: "mediumEurPerM2",
    hint: "Kitchens, bathrooms, services and finishes.",
  },
  {
    id: "full",
    label: "Full",
    key: "fullEurPerM2",
    hint: "Layout, structure and a full replacement of services.",
  },
];

/** Combined state and Andalucía general-base rates. An estimate, not the return. */
export function defaultIrpfBands(): TaxBand[] {
  return [
    { upTo: 12450, rate: 19 },
    { upTo: 13000, rate: 21.5 },
    { upTo: 20200, rate: 24 },
    { upTo: 21100, rate: 27 },
    { upTo: 35200, rate: 30 },
    { upTo: 60000, rate: 37 },
    { upTo: 300000, rate: 45 },
    { upTo: null, rate: 47 },
  ];
}

export function defaultSpainVilla(): SpainVillaInputs {
  return {
    label: "Andalucía villa",
    location: "Marbella / Málaga",
    purchasePriceEur: 750000,
    acquisitionType: "resale",
    itpPercent: 7,
    ivaPercent: 10,
    ajdPercent: 1.2,
    notaryPercent: 0.75,
    landRegistryPercent: 0.75,
    lawyerPercent: 1,
    lawyerIvaPercent: 21,
    nieAdminEur: 1000,
    surveyEur: 1500,
    buyersAgentPercent: 0,
    buyersAgentIvaPercent: 21,
    fxSpreadPercent: 0.5,
    gbpPerEur: 0.86,

    floorAreaM2: 200,
    renovationMode: "perM2",
    renovationTier: "medium",
    lightEurPerM2: 500,
    mediumEurPerM2: 1000,
    fullEurPerM2: 1800,
    kitchenEur: 15000,
    bathroomsEur: 12000,
    poolEur: 30000,
    roofEur: 10000,
    servicesEur: 18000,
    windowsEur: 14000,
    landscapingEur: 8000,
    furnishingEur: 20000,
    professionalFeePercent: 10,
    icioPercent: 4,
    worksIvaPercent: 21,
    contingencyPercent: 10,

    spanishLtvPercent: 70,
    spanishRatePercent: 3.5,
    spanishRateType: "fixed",
    spanishTermYears: 20,
    spanishArrangementFeePercent: 1,
    spanishValuationEur: 450,
    spanishOtherMortgageCostsEur: 0,

    ukLoanGbp: 500000,
    ukRatePercent: 4.5,
    ukTermYears: 20,
    ukArrangementFeePercent: 1,
    ukOtherFeesGbp: 1500,

    postRenovationValueEur: 0,

    ibiAnnualEur: 1500,
    communityAnnualEur: 1800,
    basuraAnnualEur: 200,
    insuranceAnnualEur: 600,
    utilitiesAnnualEur: 2400,
    cadastralValueEur: 300000,
    imputationPercent: 1.1,
    irnrPercent: 24,
    annualRentEur: 0,
    allowEuRentalDeductions: false,

    holidayLetEnabled: false,
    holidayLetMonths: 3,
    holidayPeakMonthlyRentEur: 5500,
    holidayOccupancyPercent: 60,
    holidayManagementPercent: 20,
    holidayManagementIvaPercent: 21,
    vftSetupEur: 350,
    vftAnnualEur: 0,

    appreciationPercent: 2,

    rentSeasonMonths: 7,
    offSeasonMonthlyRentEur: 2500,
    depositMonths: 2,
    agencyFeeMonths: 1,
    agencyIvaPercent: 21,
    tenantUtilitiesPerMonthEur: 250,
    tenantCleaningEur: 300,
    tenantInsuranceEur: 180,
    carHirePerMonthEur: 0,
    travelFlightsEur: 600,
    rentIncreasePercent: 3,

    digitalNomad: false,
    nomadVisaFeeEur: 160,
    nomadTieEur: 16,
    nomadTranslationsEur: 400,
    nomadCriminalRecordEur: 120,
    nomadLawyerEur: 1500,
    nomadHealthAnnualEur: 1500,
    nomadRenewalEur: 800,
    nomadRenewalEveryYears: 3,
    remoteIncomeEur: 48000,
    incomeThresholdEur: 34188,
    irpfAllowanceEur: 5550,
    irpfBands: defaultIrpfBands(),
    beckhamEligible: true,
    beckhamRatePercent: 24,
    beckhamCapEur: 600000,
    beckhamExcessRatePercent: 47,
    beckhamYears: 6,
    ukResidentTaxGbp: null,
  };
}
