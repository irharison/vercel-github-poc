/**
 * Pure deal calculation engine.
 *
 * Port of NDPropertyDev/app/lib/calc/engine.dart — no I/O, no UI.
 * Keep this file in lockstep with the Dart tests in
 * NDPropertyDev/app/test/engine_test.dart (copied to tests/engine.test.ts).
 */

import { lendingForDeal, salePrice } from "./defaults";
import type {
  AppSettings,
  DealInputs,
  DealResult,
  LendingResult,
  LoanConstraint,
  PurchaseCosts,
  RentalPeriod,
  RentalYear,
  SdltBandCharge,
  SdltResult,
  SdltSettings,
  TaxSettings,
} from "./types";

export function calculateSdlt(args: {
  price: number;
  settings: SdltSettings;
  additionalDwelling: boolean;
  nonResident: boolean;
}): SdltResult {
  const { price, settings, additionalDwelling, nonResident } = args;
  if (price <= 0) {
    return {
      total: 0,
      bands: [],
      surchargeApplied: 0,
      flatRateApplied: false,
      effectiveRate: 0,
    };
  }

  if (settings.applyCompanyFlatRate && price > settings.companyFlatRateThreshold) {
    let rate = settings.companyFlatRate;
    if (nonResident) rate += settings.nonResidentSurcharge;
    const tax = price * rate / 100;
    return {
      total: tax,
      bands: [{ from: 0, to: null, rate, sliceAmount: price, tax }],
      surchargeApplied: 0,
      flatRateApplied: true,
      effectiveRate: price === 0 ? 0 : (tax / price) * 100,
    };
  }

  let surcharge = 0;
  if (additionalDwelling && price >= settings.surchargeMinPrice) {
    surcharge += settings.additionalDwellingSurcharge;
  }
  if (nonResident) surcharge += settings.nonResidentSurcharge;

  const charges: SdltBandCharge[] = [];
  let total = 0;
  let lower = 0;

  for (const band of settings.bands) {
    if (price <= lower) break;
    const upper = band.upTo ?? Number.POSITIVE_INFINITY;
    const sliceTop = price < upper ? price : upper;
    const slice = sliceTop - lower;
    if (slice > 0) {
      const rate = band.rate + surcharge;
      const tax = slice * rate / 100;
      total += tax;
      charges.push({
        from: lower,
        to: band.upTo,
        rate,
        sliceAmount: slice,
        tax,
      });
    }
    lower = upper;
  }

  return {
    total,
    bands: charges,
    surchargeApplied: surcharge,
    flatRateApplied: false,
    effectiveRate: (total / price) * 100,
  };
}

export function corporationTax(profit: number, t: TaxSettings): number {
  if (profit <= 0) return 0;
  const lower = t.ctSmallProfitsThreshold;
  const upper = t.ctMainRateThreshold;
  if (profit <= lower) return profit * t.ctSmallProfitsRate / 100;
  if (upper <= lower || profit >= upper) return profit * t.ctMainRate / 100;
  const relief =
    (upper - profit) *
    (((t.ctMainRate - t.ctSmallProfitsRate) / 100) * lower) /
    (upper - lower);
  return profit * t.ctMainRate / 100 - relief;
}

export function gainTax(gain: number, t: TaxSettings): number {
  if (gain <= 0) return 0;
  if (t.ownership === "limitedCompany") return corporationTax(gain, t);
  const taxable = gain - t.cgtAnnualExemption;
  if (taxable <= 0) return 0;
  return taxable * t.cgtResidentialRate / 100;
}

export function rentalProfitTax(
  cashProfit: number,
  financeCosts: number,
  t: TaxSettings,
): number {
  if (t.ownership === "limitedCompany") {
    return corporationTax(cashProfit, t);
  }
  const taxableProfit = cashProfit + financeCosts;
  if (taxableProfit <= 0) return 0;
  const taxBeforeCredit = taxableProfit * t.personalIncomeTaxRate / 100;
  const creditBasis = financeCosts < taxableProfit ? financeCosts : taxableProfit;
  const credit = creditBasis * t.financeCostReliefRate / 100;
  const tax = taxBeforeCredit - credit;
  return tax > 0 ? tax : 0;
}

export function calculateLending(args: {
  deal: DealInputs;
  lending: import("./types").LendingSettings;
}): LendingResult {
  const { deal, lending } = args;
  const security = lending.lendOnPurchasePriceNotValuation
    ? deal.purchasePrice
    : (deal.marketValuation ?? deal.purchasePrice);

  const ltvCap = security * lending.maxLtv / 100;
  const annualRent = deal.monthlyRent * 12;
  const stress = lending.stressRate / 100;
  const icrDivisor = lending.interestCoverRatio * stress;
  const icrCap = icrDivisor <= 0 ? Number.POSITIVE_INFINITY : annualRent / icrDivisor;

  let maxLoan = ltvCap < icrCap ? ltvCap : icrCap;
  if (maxLoan < 0) maxLoan = 0;

  let constraint: LoanConstraint;
  if (Math.abs(ltvCap - icrCap) < 1) constraint = "equal";
  else if (ltvCap < icrCap) constraint = "ltv";
  else constraint = "interestCover";

  const requestedLoan =
    deal.financingMode === "maxBorrowing"
      ? maxLoan
      : deal.financingMode === "targetDeposit"
        ? deal.purchasePrice - deal.targetDeposit
        : deal.targetLoan;

  let loan = requestedLoan;
  if (loan > maxLoan) loan = maxLoan;
  if (loan < 0) loan = 0;

  const arrangementFee = loan * lending.arrangementFeePercent / 100;
  const annualInterest = loan * lending.payRate / 100;
  const stressedInterest = loan * stress;
  const actualIcr =
    stressedInterest <= 0 ? Number.POSITIVE_INFINITY : annualRent / stressedInterest;

  return {
    ltvCap,
    icrCap,
    maxLoan,
    requestedLoan,
    loan,
    constraint,
    cappedByLender: requestedLoan > maxLoan + 1,
    minimumDeposit: deal.purchasePrice - maxLoan,
    deposit: deal.purchasePrice - loan,
    arrangementFee,
    arrangementFeeAddedToLoan: lending.arrangementFeeAddedToLoan,
    annualInterest,
    monthlyInterest: annualInterest / 12,
    actualLtv: security <= 0 ? 0 : (loan / security) * 100,
    actualIcr,
    isUnderBorrowed: loan < maxLoan - 1,
  };
}

function growth(percent: number, yearsElapsed: number): number {
  let factor = 1;
  for (let i = 0; i < yearsElapsed; i++) {
    factor *= 1 + percent / 100;
  }
  return factor;
}

export function calculateDeal(args: {
  deal: DealInputs;
  settings: AppSettings;
}): DealResult {
  const { deal, settings } = args;
  const isCompany = settings.tax.ownership === "limitedCompany";
  const lendingTerms = lendingForDeal(deal, settings.lending);

  const sdlt = calculateSdlt({
    price: deal.purchasePrice,
    settings: settings.sdlt,
    additionalDwelling: true,
    nonResident: deal.nonResidentPurchaser,
  });

  const lending = calculateLending({ deal, lending: lendingTerms });

  const arrangementInCash = lending.arrangementFeeAddedToLoan ? 0 : lending.arrangementFee;
  const cashIn =
    lending.deposit +
    sdlt.total +
    deal.legalFeesPurchase +
    deal.surveyFees +
    lendingTerms.brokerFee +
    arrangementInCash +
    deal.refurbCost +
    deal.otherPurchaseCosts;

  const lineItems: Array<[string, number]> = (
    [
      ["Deposit", lending.deposit],
      ["Stamp duty", sdlt.total],
      ["Legal fees", deal.legalFeesPurchase],
      ["Survey", deal.surveyFees],
      ["Broker fee", lendingTerms.brokerFee],
      ["Lender arrangement fee", arrangementInCash],
      ["Refurbishment", deal.refurbCost],
      ["Other", deal.otherPurchaseCosts],
    ] as Array<[string, number]>
  ).filter(([, amount]) => amount !== 0);

  const purchase: PurchaseCosts = {
    deposit: lending.deposit,
    sdlt: sdlt.total,
    legalFees: deal.legalFeesPurchase,
    surveyFees: deal.surveyFees,
    brokerFee: lendingTerms.brokerFee,
    arrangementFeePaidInCash: arrangementInCash,
    refurb: deal.refurbCost,
    other: deal.otherPurchaseCosts,
    totalCashRequired: cashIn,
    totalAcquisitionCost:
      deal.purchasePrice +
      sdlt.total +
      deal.legalFeesPurchase +
      deal.surveyFees +
      lendingTerms.brokerFee +
      lending.arrangementFee +
      deal.refurbCost +
      deal.otherPurchaseCosts,
    lineItems,
  };

  const drawnBalance =
    lending.loan + (lending.arrangementFeeAddedToLoan ? lending.arrangementFee : 0);
  const annualInterestOnDrawn = drawnBalance * lendingTerms.payRate / 100;

  const years: RentalYear[] = [];
  let remainingMonths = deal.holdMonths;
  let yearIndex = 0;
  let totalGross = 0;
  let totalVoid = 0;
  let totalOps = 0;
  let totalInterest = 0;
  let totalPbt = 0;
  let totalTax = 0;

  while (remainingMonths > 0) {
    const months = remainingMonths >= 12 ? 12 : remainingMonths;
    const fraction = months / 12;
    const rentThisYear =
      deal.monthlyRent * 12 * growth(deal.rentGrowthPercent, yearIndex) * fraction;
    const voidLoss = rentThisYear * deal.voidPercent / 100;
    const collected = rentThisYear - voidLoss;
    const management = collected * deal.managementPercent / 100;
    const maintenance = rentThisYear * deal.maintenancePercentOfRent / 100;
    const other =
      (deal.insuranceAnnual +
        deal.serviceChargeAnnual +
        deal.groundRentAnnual +
        deal.otherAnnualCosts) *
      fraction;
    const interest = annualInterestOnDrawn * fraction;
    const pbt = collected - management - maintenance - other - interest;
    const tax = rentalProfitTax(pbt, interest, settings.tax);

    years.push({
      yearNumber: yearIndex + 1,
      monthsInYear: months,
      grossRent: rentThisYear,
      voidLoss,
      management,
      maintenance,
      otherCosts: other,
      interest,
      profitBeforeTax: pbt,
      tax,
      profitAfterTax: pbt - tax,
    });

    totalGross += rentThisYear;
    totalVoid += voidLoss;
    totalOps += management + maintenance + other;
    totalInterest += interest;
    totalPbt += pbt;
    totalTax += tax;
    remainingMonths -= months;
    yearIndex += 1;
  }

  const holdYears = deal.holdMonths / 12;
  const rentalProfitAfterTax = totalPbt - totalTax;
  const rental: RentalPeriod = {
    years,
    grossRent: totalGross,
    voidLoss: totalVoid,
    operatingCosts: totalOps,
    interest: totalInterest,
    profitBeforeTax: totalPbt,
    tax: totalTax,
    profitAfterTax: rentalProfitAfterTax,
    grossYield: deal.purchasePrice <= 0 ? 0 : (deal.monthlyRent * 12 / deal.purchasePrice) * 100,
    netYieldOnCash:
      cashIn <= 0 || holdYears <= 0 ? 0 : (rentalProfitAfterTax / holdYears / cashIn) * 100,
  };

  const exitSalePrice = salePrice(deal);
  const agentFee = exitSalePrice * deal.saleAgentFeePercent / 100;
  const erc = drawnBalance * lendingTerms.earlyRepaymentChargePercent / 100;
  const baseCost =
    deal.purchasePrice +
    sdlt.total +
    deal.legalFeesPurchase +
    deal.surveyFees +
    (deal.capitaliseRefurb ? deal.refurbCost : 0);
  const gain = exitSalePrice - agentFee - deal.saleLegalFees - baseCost;
  const exitTax = gainTax(gain, settings.tax);
  const netCashOnSale = exitSalePrice - agentFee - deal.saleLegalFees - erc - drawnBalance - exitTax;

  const totalProfit = rentalProfitAfterTax + netCashOnSale - cashIn;
  const roi = cashIn <= 0 ? 0 : (totalProfit / cashIn) * 100;

  return {
    inputs: deal,
    settings,
    sdlt,
    lending,
    purchase,
    rental,
    exit: {
      salePrice: exitSalePrice,
      agentFee,
      legalFees: deal.saleLegalFees,
      earlyRepaymentCharge: erc,
      loanRedeemed: drawnBalance,
      baseCost,
      gain,
      tax: exitTax,
      taxRegime: isCompany ? "Corporation Tax on gain" : "Capital Gains Tax (residential)",
      netCashOnSale,
    },
    totalCashIn: cashIn,
    totalProfit,
    returnOnCashPercent: roi,
    annualisedReturnPercent: holdYears <= 0 ? 0 : roi / holdYears,
  };
}
