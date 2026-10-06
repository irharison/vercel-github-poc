/**
 * Andalucía villa purchase, renovation and finance model.
 *
 * Every rate is an editable estimate. Nothing here is tax, legal or
 * mortgage advice. Confirm figures with a Spanish lawyer or gestor.
 */

export type AcquisitionType = "resale" | "newBuild";
export type RenovationMode = "perM2" | "lineItems" | "both";
export type RenovationTier = "light" | "medium" | "full";
export type MortgageRateType = "fixed" | "variable";
export type FinanceOptionId = "cash" | "spanishMortgage" | "ukRemortgage";
export type IrnrBasis = "imputed" | "grossRent" | "netRent" | "holidayLet" | "resident";

/** One slice of a progressive income-tax scale. `upTo` null is the top band. */
export interface TaxBand {
  upTo: number | null;
  rate: number;
}

export interface SpainVillaInputs {
  label: string;
  location: string;
  purchasePriceEur: number;
  acquisitionType: AcquisitionType;
  /** Transfer tax on a resale, percent of the price. Andalucía general rate 7%. */
  itpPercent: number;
  /** VAT on a new dwelling, percent of the price. Usually 10%. */
  ivaPercent: number;
  /** Stamp duty on a new build, percent of the price. Andalucía often about 1.2%. */
  ajdPercent: number;
  notaryPercent: number;
  landRegistryPercent: number;
  /** Lawyer's fee before IVA, percent of the price. */
  lawyerPercent: number;
  lawyerIvaPercent: number;
  nieAdminEur: number;
  surveyEur: number;
  /** Optional buyer's agent, percent of the price, before IVA. */
  buyersAgentPercent: number;
  buyersAgentIvaPercent: number;
  /** Spread lost when converting pounds into the euros this option buys. */
  fxSpreadPercent: number;
  /** Pounds for one euro. */
  gbpPerEur: number;

  floorAreaM2: number;
  renovationMode: RenovationMode;
  renovationTier: RenovationTier;
  lightEurPerM2: number;
  mediumEurPerM2: number;
  fullEurPerM2: number;
  kitchenEur: number;
  bathroomsEur: number;
  poolEur: number;
  roofEur: number;
  servicesEur: number;
  windowsEur: number;
  landscapingEur: number;
  furnishingEur: number;
  /** Architect and project manager, percent of the works budget. */
  professionalFeePercent: number;
  /** Licencia de obra / ICIO, percent of the works budget. */
  icioPercent: number;
  /** IVA on works, professional fees and contingency. */
  worksIvaPercent: number;
  /** Contingency, percent of works plus professional fees. */
  contingencyPercent: number;

  spanishLtvPercent: number;
  spanishRatePercent: number;
  spanishRateType: MortgageRateType;
  spanishTermYears: number;
  spanishArrangementFeePercent: number;
  spanishValuationEur: number;
  spanishOtherMortgageCostsEur: number;

  ukLoanGbp: number;
  ukRatePercent: number;
  ukTermYears: number;
  ukArrangementFeePercent: number;
  ukOtherFeesGbp: number;

  /** 0 means the user has not entered a value, so equity is omitted. */
  postRenovationValueEur: number;

  ibiAnnualEur: number;
  communityAnnualEur: number;
  basuraAnnualEur: number;
  insuranceAnnualEur: number;
  utilitiesAnnualEur: number;
  cadastralValueEur: number;
  /** 1.1% if the cadastral value was revised in the last 10 years, else 2%. */
  imputationPercent: number;
  /** 24% is the usual UK-resident rate. EU/EEA is often 19%. */
  irnrPercent: number;
  annualRentEur: number;
  /** EU/EEA-style net rent. Off for a typical UK owner, who is taxed on gross rent. */
  allowEuRentalDeductions: boolean;

  /** Peak-season holiday let while the owner is away. Off unless chosen. */
  holidayLetEnabled: boolean;
  /** Months offered to guests. Imputed income still applies to the other months. */
  holidayLetMonths: number;
  holidayPeakMonthlyRentEur: number;
  holidayOccupancyPercent: number;
  /** Manager's fee before IVA, percent of the gross holiday income. */
  holidayManagementPercent: number;
  holidayManagementIvaPercent: number;
  /** One-off VFT (vivienda con fines turísticos) registration allowance. */
  vftSetupEur: number;
  /** Yearly tourist tax or compliance allowance. Often zero. */
  vftAnnualEur: number;

  /**
   * Value used for the rent-or-buy comparison. Applied to the post-renovation
   * value, or to the purchase price when that value is blank.
   */
  appreciationPercent: number;

  /** Months spent in a rented villa, October to May/June. Clamped to 6–9. */
  rentSeasonMonths: number;
  /** Off-season monthly rent as a tenant. An estimate, not a listing. */
  offSeasonMonthlyRentEur: number;
  /** Refundable deposit, in months of rent. Not a cost. */
  depositMonths: number;
  /** Agency fee, in months of rent, before IVA. Usually one. */
  agencyFeeMonths: number;
  agencyIvaPercent: number;
  tenantUtilitiesPerMonthEur: number;
  /** Cleaning for the whole season. */
  tenantCleaningEur: number;
  /** Tenant insurance for the whole season. */
  tenantInsuranceEur: number;
  /** Optional. Leave at 0 to skip. */
  carHirePerMonthEur: number;
  /** Flights and other travel for the whole season. */
  travelFlightsEur: number;
  /** Applied each year to the rent and the other seasonal costs. */
  rentIncreasePercent: number;

  /**
   * Live in Spain on a digital nomad visa and be modelled as tax resident.
   * Off keeps the non-resident treatment. It never changes ITP, IVA or AJD.
   */
  digitalNomad: boolean;
  /** Consular visa and residence-application fees. One-off. */
  nomadVisaFeeEur: number;
  /** TIE card fee. One-off. */
  nomadTieEur: number;
  /** Sworn translations and apostilles. One-off. */
  nomadTranslationsEur: number;
  /** Criminal-record certificate. One-off. */
  nomadCriminalRecordEur: number;
  /** Immigration lawyer or gestor for the first application. One-off. */
  nomadLawyerEur: number;
  /** Private health insurance that the visa requires. Every year. */
  nomadHealthAnnualEur: number;
  /** Fees and professional help at each renewal. */
  nomadRenewalEur: number;
  /** Years between renewals. The annual figure spreads this cost. */
  nomadRenewalEveryYears: number;
  /** Gross yearly income from remote work. An example until replaced. */
  remoteIncomeEur: number;
  /** About 200% of the Spanish minimum wage. The income test uses this. */
  incomeThresholdEur: number;
  /** Personal allowance deducted before the IRPF bands. */
  irpfAllowanceEur: number;
  /** Combined state + Andalucía general-base bands. Estimates. */
  irpfBands: TaxBand[];
  /** No Spanish tax residence in the previous five years. */
  beckhamEligible: boolean;
  /** Flat rate on employment income up to the cap. */
  beckhamRatePercent: number;
  /** Employment income taxed at the flat rate. The rest uses the excess rate. */
  beckhamCapEur: number;
  /** Rate on employment income above the cap. */
  beckhamExcessRatePercent: number;
  /** Year of arrival plus the following five years. */
  beckhamYears: number;
  /** UK income tax on the same earnings, typed in by hand. Null until entered. */
  ukResidentTaxGbp: number | null;
}

export interface CostLine {
  label: string;
  amountEur: number;
}

export interface Annuity {
  months: number;
  monthlyPayment: number;
  totalInterest: number;
  yearOneInterest: number;
}

export interface FinanceColumn {
  id: FinanceOptionId;
  /** Euros the buyer pays at completion. Borrowed principal is not included. */
  cashRequiredEur: number;
  currencyTransferEur: number;
  amountBorrowedEur: number;
  /** Set when the loan itself is in pounds. */
  amountBorrowedGbp: number | null;
  monthlyPaymentEur: number;
  monthlyPaymentGbp: number | null;
  totalInterestEur: number;
  totalInterestGbp: number | null;
  yearOneInterestGbp: number | null;
  /**
   * All-in project cost, plus this option's currency transfer, finance fees
   * and interest over the full term. Running costs are not included.
   */
  totalCostEur: number;
  feesEur: number;
  /** Part of the purchase price paid in cash. Null for the UK loan. */
  priceDepositEur: number | null;
  /** Euro proceeds above the project and its currency transfer. */
  surplusEur: number;
  /** Null until a post-renovation value is entered. Value minus funding debt. */
  equityEur: number | null;
  yearOneInterestEur: number;
  irnrEur: number;
  /** Running costs + this option's IRNR + year-one interest − rent. */
  netAnnualCostEur: number;
  netYieldOnCashPercent: number;
}

export interface SpainVillaResult {
  inputs: SpainVillaInputs;
  gbpPerEur: number;
  /** Euros for one pound. 0 when the rate is not usable. */
  eurPerGbp: number;
  priceGbp: number;
  purchase: {
    taxLines: CostLine[];
    taxEur: number;
    notaryEur: number;
    landRegistryEur: number;
    lawyerNetEur: number;
    lawyerIvaEur: number;
    lawyerEur: number;
    nieAdminEur: number;
    surveyEur: number;
    agentNetEur: number;
    agentIvaEur: number;
    agentEur: number;
    costsExFxEur: number;
    acquisitionExFxEur: number;
  };
  renovation: {
    usesPerM2: boolean;
    usesLineItems: boolean;
    eurPerM2: number;
    floorAreaM2: number;
    m2CostEur: number;
    lineItems: CostLine[];
    worksEur: number;
    professionalFeesEur: number;
    icioEur: number;
    contingencyEur: number;
    ivaEur: number;
    totalEur: number;
  };
  /** Price + purchase costs + renovation, before currency transfer. */
  allInExFxEur: number;
  running: {
    lines: CostLine[];
    operatingEur: number;
    imputedIncomeEur: number;
    irnrEur: number;
    irnrBasis: IrnrBasis;
    rentEur: number;
    /** Operating costs + IRNR (no mortgage interest) − rent. */
    netAnnualCostEur: number;
    grossYieldOnPricePercent: number;
    netYieldOnAllInPercent: number;
  };
  finance: {
    cash: FinanceColumn;
    spanish: FinanceColumn;
    uk: FinanceColumn;
  };
  tenancy: SeasonQuote;
  holidayLet: HolidayLetResult;
  comparison: StayComparison;
  residency: ResidencyQuote;
}

/** Visa costs and the income-tax comparison. Salary tax is not a property cost. */
export interface ResidencyQuote {
  enabled: boolean;
  oneOffEur: number;
  annualEur: number;
  renewalEveryYears: number;
  incomeEur: number;
  thresholdEur: number;
  thresholdMonthlyEur: number;
  incomeTestPassed: boolean;
  irpfEur: number;
  beckhamEligible: boolean;
  /** Null when Beckham eligibility is switched off. */
  beckhamEur: number | null;
  beckhamYears: number;
  ukTaxGbp: number | null;
  ukTaxEur: number | null;
}

/** One off-season as a tenant. The deposit is refundable and is not in `costEur`. */
export interface SeasonQuote {
  months: number;
  monthlyRentEur: number;
  rentEur: number;
  agencyNetEur: number;
  agencyIvaEur: number;
  agencyEur: number;
  utilitiesEur: number;
  cleaningEur: number;
  insuranceEur: number;
  carHireEur: number;
  travelEur: number;
  costEur: number;
  costGbp: number;
  effectiveMonthlyEur: number;
  effectiveMonthlyGbp: number;
  depositEur: number;
  depositGbp: number;
}

export interface HolidayLetResult {
  enabled: boolean;
  months: number;
  grossEur: number;
  managementNetEur: number;
  managementIvaEur: number;
  managementEur: number;
  vftSetupEur: number;
  vftAnnualEur: number;
  /** Gross, minus management (including IVA) and the annual VFT allowance. */
  netBeforeTaxEur: number;
}

export interface HoldingComparison {
  id: FinanceOptionId;
  /** Net cost after 1, 5 and 10 years. Negative means the villa is worth more than the money spent. */
  costEur: [number, number, number];
  /**
   * First year, from 1 to 40, in which buying costs less than renting for that
   * many seasons. Null if renting is still cheaper after 40 years.
   */
  breakevenYear: number | null;
}

export interface StayComparison {
  /** Horizons, in years: 1, 5 and 10. */
  years: readonly [1, 5, 10];
  /** Post-renovation value, or the purchase price when that was left blank. */
  startValueEur: number;
  /** Cumulative tenant cost at each horizon. Deposits are not included. */
  rentCostEur: [number, number, number];
  options: [HoldingComparison, HoldingComparison, HoldingComparison];
}
