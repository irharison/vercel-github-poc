import {
  clampHoldMonths,
  defaultDeal,
  defaultLending,
  defaultSdlt,
  defaultSettings,
  defaultTax,
} from "./defaults";
import type {
  AppSettings,
  DealInputs,
  DutyBand,
  FinancingMode,
  LendingSettings,
  OwnershipType,
  SalePriceMode,
  SdltSettings,
  TaxSettings,
} from "./types";

function num(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function str(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function bandFromJson(raw: unknown): DutyBand {
  const j = (raw ?? {}) as Record<string, unknown>;
  const upTo = j.upTo;
  return {
    upTo: typeof upTo === "number" ? upTo : null,
    rate: num(j.rate, 0),
  };
}

export function sdltFromJson(raw: unknown): SdltSettings {
  const d = defaultSdlt();
  const j = (raw ?? {}) as Record<string, unknown>;
  return {
    bands: Array.isArray(j.bands) ? j.bands.map(bandFromJson) : d.bands,
    additionalDwellingSurcharge: num(j.additionalDwellingSurcharge, d.additionalDwellingSurcharge),
    surchargeMinPrice: num(j.surchargeMinPrice, d.surchargeMinPrice),
    nonResidentSurcharge: num(j.nonResidentSurcharge, d.nonResidentSurcharge),
    companyFlatRate: num(j.companyFlatRate, d.companyFlatRate),
    companyFlatRateThreshold: num(j.companyFlatRateThreshold, d.companyFlatRateThreshold),
    applyCompanyFlatRate: bool(j.applyCompanyFlatRate, d.applyCompanyFlatRate),
  };
}

export function taxFromJson(raw: unknown): TaxSettings {
  const d = defaultTax();
  const j = (raw ?? {}) as Record<string, unknown>;
  const ownership: OwnershipType =
    j.ownership === "personal" ? "personal" : "limitedCompany";
  return {
    ownership,
    ctSmallProfitsRate: num(j.ctSmallProfitsRate, d.ctSmallProfitsRate),
    ctMainRate: num(j.ctMainRate, d.ctMainRate),
    ctSmallProfitsThreshold: num(j.ctSmallProfitsThreshold, d.ctSmallProfitsThreshold),
    ctMainRateThreshold: num(j.ctMainRateThreshold, d.ctMainRateThreshold),
    cgtResidentialRate: num(j.cgtResidentialRate, d.cgtResidentialRate),
    cgtAnnualExemption: num(j.cgtAnnualExemption, d.cgtAnnualExemption),
    personalIncomeTaxRate: num(j.personalIncomeTaxRate, d.personalIncomeTaxRate),
    financeCostReliefRate: num(j.financeCostReliefRate, d.financeCostReliefRate),
  };
}

export function lendingFromJson(raw: unknown): LendingSettings {
  const d = defaultLending();
  const j = (raw ?? {}) as Record<string, unknown>;
  return {
    maxLtv: num(j.maxLtv, d.maxLtv),
    interestCoverRatio: num(j.interestCoverRatio, d.interestCoverRatio),
    stressRate: num(j.stressRate, d.stressRate),
    payRate: num(j.payRate, d.payRate),
    arrangementFeePercent: num(j.arrangementFeePercent, d.arrangementFeePercent),
    arrangementFeeAddedToLoan: bool(j.arrangementFeeAddedToLoan, d.arrangementFeeAddedToLoan),
    brokerFee: num(j.brokerFee, d.brokerFee),
    earlyRepaymentChargePercent: num(j.earlyRepaymentChargePercent, d.earlyRepaymentChargePercent),
    lendOnPurchasePriceNotValuation: bool(
      j.lendOnPurchasePriceNotValuation,
      d.lendOnPurchasePriceNotValuation,
    ),
  };
}

export function settingsFromJson(raw: unknown): AppSettings {
  const d = defaultSettings();
  const j = (raw ?? {}) as Record<string, unknown>;
  return {
    sdlt: j.sdlt == null ? d.sdlt : sdltFromJson(j.sdlt),
    tax: j.tax == null ? d.tax : taxFromJson(j.tax),
    lending: j.lending == null ? d.lending : lendingFromJson(j.lending),
  };
}

export function dealFromJson(raw: unknown): DealInputs {
  const d = defaultDeal();
  const j = (raw ?? {}) as Record<string, unknown>;
  const financingMode: FinancingMode =
    j.financingMode === "targetDeposit" || j.financingMode === "targetLoan"
      ? j.financingMode
      : "maxBorrowing";
  const salePriceMode: SalePriceMode =
    j.salePriceMode === "explicit" ? "explicit" : "growth";
  return {
    label: str(j.label, d.label),
    postcode: str(j.postcode, d.postcode),
    purchasePrice: num(j.purchasePrice, d.purchasePrice),
    marketValuation: typeof j.marketValuation === "number" ? j.marketValuation : null,
    nonResidentPurchaser: bool(j.nonResidentPurchaser, d.nonResidentPurchaser),
    financingMode,
    targetDeposit: num(j.targetDeposit, d.targetDeposit),
    targetLoan: num(j.targetLoan, d.targetLoan),
    lendingOverride: j.lendingOverride == null ? null : lendingFromJson(j.lendingOverride),
    monthlyRent: num(j.monthlyRent, d.monthlyRent),
    holdMonths: clampHoldMonths(num(j.holdMonths, d.holdMonths)),
    voidPercent: num(j.voidPercent, d.voidPercent),
    managementPercent: num(j.managementPercent, d.managementPercent),
    maintenancePercentOfRent: num(j.maintenancePercentOfRent, d.maintenancePercentOfRent),
    insuranceAnnual: num(j.insuranceAnnual, d.insuranceAnnual),
    serviceChargeAnnual: num(j.serviceChargeAnnual, d.serviceChargeAnnual),
    groundRentAnnual: num(j.groundRentAnnual, d.groundRentAnnual),
    otherAnnualCosts: num(j.otherAnnualCosts, d.otherAnnualCosts),
    rentGrowthPercent: num(j.rentGrowthPercent, d.rentGrowthPercent),
    legalFeesPurchase: num(j.legalFeesPurchase, d.legalFeesPurchase),
    surveyFees: num(j.surveyFees, d.surveyFees),
    refurbCost: num(j.refurbCost, d.refurbCost),
    otherPurchaseCosts: num(j.otherPurchaseCosts, d.otherPurchaseCosts),
    salePriceMode,
    explicitSalePrice: num(j.explicitSalePrice, d.explicitSalePrice),
    annualGrowthPercent: num(j.annualGrowthPercent, d.annualGrowthPercent),
    saleAgentFeePercent: num(j.saleAgentFeePercent, d.saleAgentFeePercent),
    saleLegalFees: num(j.saleLegalFees, d.saleLegalFees),
    capitaliseRefurb: bool(j.capitaliseRefurb, d.capitaliseRefurb),
  };
}
