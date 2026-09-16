import type {
  AppSettings,
  DealInputs,
  LendingSettings,
  SdltSettings,
  TaxSettings,
} from "./types";

export function defaultSdlt(): SdltSettings {
  return {
    bands: [
      { upTo: 125000, rate: 0 },
      { upTo: 250000, rate: 2 },
      { upTo: 925000, rate: 5 },
      { upTo: 1500000, rate: 10 },
      { upTo: null, rate: 12 },
    ],
    additionalDwellingSurcharge: 5,
    surchargeMinPrice: 40000,
    nonResidentSurcharge: 2,
    companyFlatRate: 17,
    companyFlatRateThreshold: 500000,
    applyCompanyFlatRate: false,
  };
}

export function defaultTax(): TaxSettings {
  return {
    ownership: "limitedCompany",
    ctSmallProfitsRate: 19,
    ctMainRate: 25,
    ctSmallProfitsThreshold: 50000,
    ctMainRateThreshold: 250000,
    cgtResidentialRate: 24,
    cgtAnnualExemption: 3000,
    personalIncomeTaxRate: 40,
    financeCostReliefRate: 20,
  };
}

export function defaultLending(): LendingSettings {
  return {
    maxLtv: 75,
    interestCoverRatio: 1.25,
    stressRate: 5.5,
    payRate: 5.25,
    arrangementFeePercent: 2,
    arrangementFeeAddedToLoan: true,
    brokerFee: 1500,
    earlyRepaymentChargePercent: 0,
    lendOnPurchasePriceNotValuation: true,
  };
}

export function defaultSettings(): AppSettings {
  return {
    sdlt: defaultSdlt(),
    tax: defaultTax(),
    lending: defaultLending(),
  };
}

export const HOLD_MONTHS_MIN = 1;
export const HOLD_MONTHS_MAX = 600;

export function clampHoldMonths(value: number): number {
  if (!Number.isFinite(value)) return HOLD_MONTHS_MIN;
  return Math.min(HOLD_MONTHS_MAX, Math.max(HOLD_MONTHS_MIN, Math.round(value)));
}

export function defaultDeal(): DealInputs {
  return {
    label: "New deal",
    postcode: "",
    purchasePrice: 250000,
    marketValuation: null,
    nonResidentPurchaser: false,
    financingMode: "maxBorrowing",
    targetDeposit: 0,
    targetLoan: 0,
    lendingOverride: null,
    monthlyRent: 1200,
    holdMonths: 24,
    voidPercent: 4,
    managementPercent: 10,
    maintenancePercentOfRent: 5,
    insuranceAnnual: 350,
    serviceChargeAnnual: 0,
    groundRentAnnual: 0,
    otherAnnualCosts: 0,
    rentGrowthPercent: 0,
    legalFeesPurchase: 1500,
    surveyFees: 700,
    refurbCost: 0,
    otherPurchaseCosts: 0,
    salePriceMode: "growth",
    explicitSalePrice: 0,
    annualGrowthPercent: 3,
    saleAgentFeePercent: 1.5,
    saleLegalFees: 1200,
    capitaliseRefurb: true,
  };
}

export function lendingForDeal(
  deal: DealInputs,
  defaults: LendingSettings,
): LendingSettings {
  return deal.lendingOverride ?? defaults;
}

export function salePrice(deal: DealInputs): number {
  if (deal.salePriceMode === "explicit") return deal.explicitSalePrice;
  const years = clampHoldMonths(deal.holdMonths) / 12;
  return deal.purchasePrice * Math.pow(1 + deal.annualGrowthPercent / 100, years);
}
