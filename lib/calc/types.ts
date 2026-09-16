/**
 * Deal, tax and lending types.
 *
 * Faithful TypeScript port of the Flutter models in
 * C:\Users\IanHarrison\OneDrive\svn\NDPropertyDev\app\lib\calc\
 *
 * Every rate and threshold is a seeded default the user can edit.
 * None of this is advice.
 */

export type FinancingMode = "maxBorrowing" | "targetDeposit" | "targetLoan";
export type SalePriceMode = "explicit" | "growth";
export type OwnershipType = "limitedCompany" | "personal";
export type LoanConstraint = "ltv" | "interestCover" | "equal";

export interface DutyBand {
  /** Upper bound of the band in pounds. null = no upper bound. */
  upTo: number | null;
  /** Marginal rate for this slice, as a percentage (e.g. 5 == 5%). */
  rate: number;
}

export interface SdltSettings {
  bands: DutyBand[];
  additionalDwellingSurcharge: number;
  surchargeMinPrice: number;
  nonResidentSurcharge: number;
  companyFlatRate: number;
  companyFlatRateThreshold: number;
  applyCompanyFlatRate: boolean;
}

export interface TaxSettings {
  ownership: OwnershipType;
  ctSmallProfitsRate: number;
  ctMainRate: number;
  ctSmallProfitsThreshold: number;
  ctMainRateThreshold: number;
  cgtResidentialRate: number;
  cgtAnnualExemption: number;
  personalIncomeTaxRate: number;
  financeCostReliefRate: number;
}

export interface LendingSettings {
  maxLtv: number;
  interestCoverRatio: number;
  stressRate: number;
  payRate: number;
  arrangementFeePercent: number;
  arrangementFeeAddedToLoan: boolean;
  brokerFee: number;
  earlyRepaymentChargePercent: number;
  lendOnPurchasePriceNotValuation: boolean;
}

export interface AppSettings {
  sdlt: SdltSettings;
  tax: TaxSettings;
  lending: LendingSettings;
}

export interface DealInputs {
  label: string;
  postcode: string;
  purchasePrice: number;
  marketValuation: number | null;
  nonResidentPurchaser: boolean;
  financingMode: FinancingMode;
  targetDeposit: number;
  targetLoan: number;
  lendingOverride: LendingSettings | null;
  monthlyRent: number;
  holdMonths: number;
  voidPercent: number;
  managementPercent: number;
  maintenancePercentOfRent: number;
  insuranceAnnual: number;
  serviceChargeAnnual: number;
  groundRentAnnual: number;
  otherAnnualCosts: number;
  rentGrowthPercent: number;
  legalFeesPurchase: number;
  surveyFees: number;
  refurbCost: number;
  otherPurchaseCosts: number;
  salePriceMode: SalePriceMode;
  explicitSalePrice: number;
  annualGrowthPercent: number;
  saleAgentFeePercent: number;
  saleLegalFees: number;
  capitaliseRefurb: boolean;
}

export interface SdltBandCharge {
  from: number;
  to: number | null;
  rate: number;
  sliceAmount: number;
  tax: number;
}

export interface SdltResult {
  total: number;
  bands: SdltBandCharge[];
  surchargeApplied: number;
  flatRateApplied: boolean;
  effectiveRate: number;
}

export interface LendingResult {
  ltvCap: number;
  icrCap: number;
  maxLoan: number;
  requestedLoan: number;
  loan: number;
  constraint: LoanConstraint;
  cappedByLender: boolean;
  minimumDeposit: number;
  deposit: number;
  arrangementFee: number;
  arrangementFeeAddedToLoan: boolean;
  annualInterest: number;
  monthlyInterest: number;
  actualLtv: number;
  actualIcr: number;
  isUnderBorrowed: boolean;
}

export interface PurchaseCosts {
  deposit: number;
  sdlt: number;
  legalFees: number;
  surveyFees: number;
  brokerFee: number;
  arrangementFeePaidInCash: number;
  refurb: number;
  other: number;
  totalCashRequired: number;
  totalAcquisitionCost: number;
  lineItems: Array<[string, number]>;
}

export interface RentalYear {
  yearNumber: number;
  monthsInYear: number;
  grossRent: number;
  voidLoss: number;
  management: number;
  maintenance: number;
  otherCosts: number;
  interest: number;
  profitBeforeTax: number;
  tax: number;
  profitAfterTax: number;
}

export interface RentalPeriod {
  years: RentalYear[];
  grossRent: number;
  voidLoss: number;
  operatingCosts: number;
  interest: number;
  profitBeforeTax: number;
  tax: number;
  profitAfterTax: number;
  grossYield: number;
  netYieldOnCash: number;
}

export interface ExitResult {
  salePrice: number;
  agentFee: number;
  legalFees: number;
  earlyRepaymentCharge: number;
  loanRedeemed: number;
  baseCost: number;
  gain: number;
  tax: number;
  taxRegime: string;
  netCashOnSale: number;
}

export interface DealResult {
  inputs: DealInputs;
  settings: AppSettings;
  sdlt: SdltResult;
  lending: LendingResult;
  purchase: PurchaseCosts;
  rental: RentalPeriod;
  exit: ExitResult;
  totalCashIn: number;
  totalProfit: number;
  returnOnCashPercent: number;
  annualisedReturnPercent: number;
}
