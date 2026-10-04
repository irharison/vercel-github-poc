/**
 * Pure Andalucía villa model. No I/O and no UI.
 *
 * Purchase costs (all percent-of-price unless noted):
 * - Resale: ITP. New build: IVA + AJD. Never both.
 * - Notary, land registry, lawyer. Lawyer IVA is on the lawyer's fee only.
 * - NIE / bank / admin and the building survey are lump sums.
 * - Buyer's agent IVA is on the agent fee only.
 * Currency transfer is not part of the acquisition total. It is applied
 * inside each finance option to the euros bought with pounds.
 *
 * Renovation:
 * - Works = selected €/m² × area, and/or the line items, depending on mode.
 * - Professional fees = works × fee %.
 * - ICIO / licence = works × ICIO %. Contingency does not increase it.
 * - Contingency = (works + professional fees) × contingency %.
 * - IVA = (works + professional fees + contingency) × IVA %. Not on ICIO.
 *
 * Finance options are alternatives, not a stack.
 * - Cash converts the whole project.
 * - A Spanish mortgage converts only the buyer's cash (deposit, costs,
 *   renovation and mortgage fees). The loan is capped at the purchase price.
 *   Costs and renovation are not borrowed.
 * - A UK remortgage converts the whole project, because the loan is in pounds.
 *   UK fees are paid in pounds and converted at the rate with no second spread.
 *
 * Total cost of ownership = all-in project (before transfer) + that option's
 * transfer + its finance fees + interest over the term. Running costs stay annual.
 *
 * A repayment mortgage uses the standard annuity. The entered rate is held
 * constant for the whole term, including when the Spanish rate is marked variable.
 * Year-one interest is the sum of the interest portions of the first twelve
 * payments (or fewer if the term is shorter).
 */

import {
  breakevenYear,
  clampHolidayMonths,
  COMPARISON_YEARS,
  holdingCost,
  loanYearInterests,
  rentCostOverYears,
  seasonQuote,
  BREAKEVEN_MAX_YEARS,
} from "./compare";
import {
  RENOVATION_ITEM_KEYS,
  RENOVATION_ITEM_LABELS,
  type RenovationItemKey,
} from "./defaults";
import type {
  Annuity,
  CostLine,
  FinanceColumn,
  HolidayLetResult,
  HoldingComparison,
  IrnrBasis,
  SpainVillaInputs,
  SpainVillaResult,
} from "./types";

function percentOf(amount: number, percent: number): number {
  return (amount * percent) / 100;
}

export function toGbp(eur: number, gbpPerEur: number): number {
  return gbpPerEur > 0 ? eur * gbpPerEur : 0;
}

export function toEur(gbp: number, gbpPerEur: number): number {
  return gbpPerEur > 0 ? gbp / gbpPerEur : 0;
}

export function annuity(principal: number, annualPercent: number, years: number): Annuity {
  const months = Math.max(0, Math.round(years * 12));
  if (!(principal > 0) || months === 0) {
    return { months, monthlyPayment: 0, totalInterest: 0, yearOneInterest: 0 };
  }
  const monthlyRate = annualPercent / 100 / 12;
  if (monthlyRate <= -1) {
    return { months, monthlyPayment: 0, totalInterest: 0, yearOneInterest: 0 };
  }

  const monthlyPayment =
    monthlyRate === 0
      ? principal / months
      : (principal * monthlyRate * (1 + monthlyRate) ** months) /
        ((1 + monthlyRate) ** months - 1);

  let balance = principal;
  let yearOneInterest = 0;
  const firstYear = Math.min(12, months);
  for (let month = 0; month < firstYear; month += 1) {
    const interest = balance * monthlyRate;
    yearOneInterest += interest;
    balance -= monthlyPayment - interest;
  }

  return {
    months,
    monthlyPayment,
    totalInterest: monthlyPayment * months - principal,
    yearOneInterest,
  };
}

function eurPerM2(inputs: SpainVillaInputs): number {
  if (inputs.renovationTier === "light") return inputs.lightEurPerM2;
  if (inputs.renovationTier === "full") return inputs.fullEurPerM2;
  return inputs.mediumEurPerM2;
}

function nonZero(label: string, amountEur: number): CostLine | null {
  return amountEur !== 0 ? { label, amountEur } : null;
}

interface RunningTax {
  operatingEur: number;
  imputedIncomeEur: number;
  /** Gross rent, or gross peak-season income when that let is on. */
  rentEur: number;
  /** Management (including IVA) and the annual VFT allowance. Not the one-off registration. */
  carryingExtraEur: number;
  /** VFT registration, added only to the first year of a buy-versus-rent comparison. */
  setupEur: number;
  basis: IrnrBasis;
  holiday: HolidayLetResult;
  tax(interestEur: number): number;
}

function operatingCosts(inputs: SpainVillaInputs): number {
  return (
    inputs.ibiAnnualEur +
    inputs.communityAnnualEur +
    inputs.basuraAnnualEur +
    inputs.insuranceAnnualEur +
    inputs.utilitiesAnnualEur
  );
}

function emptyHoliday(): HolidayLetResult {
  return {
    enabled: false,
    months: 0,
    grossEur: 0,
    managementNetEur: 0,
    managementIvaEur: 0,
    managementEur: 0,
    vftSetupEur: 0,
    vftAnnualEur: 0,
    netBeforeTaxEur: 0,
  };
}

function runningTax(inputs: SpainVillaInputs): RunningTax {
  const operatingEur = operatingCosts(inputs);
  const imputedIncomeEur = percentOf(inputs.cadastralValueEur, inputs.imputationPercent);

  if (inputs.holidayLetEnabled) {
    const months = clampHolidayMonths(inputs.holidayLetMonths);
    const grossEur =
      inputs.holidayPeakMonthlyRentEur * months * inputs.holidayOccupancyPercent / 100;
    const managementNetEur = percentOf(grossEur, inputs.holidayManagementPercent);
    const managementIvaEur = percentOf(managementNetEur, inputs.holidayManagementIvaPercent);
    const managementEur = managementNetEur + managementIvaEur;
    const vftAnnualEur = inputs.vftAnnualEur;
    const holiday: HolidayLetResult = {
      enabled: true,
      months,
      grossEur,
      managementNetEur,
      managementIvaEur,
      managementEur,
      vftSetupEur: inputs.vftSetupEur,
      vftAnnualEur,
      netBeforeTaxEur: grossEur - managementEur - vftAnnualEur,
    };
    const imputedPartial = imputedIncomeEur * (12 - months) / 12;
    return {
      operatingEur,
      imputedIncomeEur,
      rentEur: grossEur,
      carryingExtraEur: managementEur + vftAnnualEur,
      setupEur: inputs.vftSetupEur,
      basis: "holidayLet",
      holiday,
      tax(interestEur: number): number {
        const imputedTax = percentOf(imputedPartial, inputs.irnrPercent);
        if (inputs.allowEuRentalDeductions) {
          const share = months / 12;
          const taxable = Math.max(
            0,
            grossEur - managementEur - vftAnnualEur - operatingEur * share - interestEur * share,
          );
          return percentOf(taxable, inputs.irnrPercent) + imputedTax;
        }
        return percentOf(grossEur, inputs.irnrPercent) + imputedTax;
      },
    };
  }

  const rentEur = inputs.annualRentEur;
  let basis: IrnrBasis = "imputed";
  if (rentEur > 0) basis = inputs.allowEuRentalDeductions ? "netRent" : "grossRent";

  return {
    operatingEur,
    imputedIncomeEur,
    rentEur,
    carryingExtraEur: 0,
    setupEur: 0,
    basis,
    holiday: emptyHoliday(),
    tax(interestEur: number): number {
      if (rentEur > 0 && inputs.allowEuRentalDeductions) {
        return percentOf(Math.max(0, rentEur - operatingEur - interestEur), inputs.irnrPercent);
      }
      if (rentEur > 0) return percentOf(rentEur, inputs.irnrPercent);
      return percentOf(imputedIncomeEur, inputs.irnrPercent);
    },
  };
}

function netOfRunning(tax: RunningTax, interestEur: number): number {
  return tax.operatingEur + tax.carryingExtraEur + tax.tax(interestEur) - tax.rentEur;
}

function column(partial: FinanceColumn): FinanceColumn {
  return partial;
}

export function calculateSpainVilla(inputs: SpainVillaInputs): SpainVillaResult {
  const price = inputs.purchasePriceEur;
  const rate = inputs.gbpPerEur;
  const taxLines: CostLine[] = [];
  if (inputs.acquisitionType === "newBuild") {
    taxLines.push(
      { label: "IVA", amountEur: percentOf(price, inputs.ivaPercent) },
      { label: "AJD stamp duty", amountEur: percentOf(price, inputs.ajdPercent) },
    );
  } else {
    taxLines.push({ label: "ITP transfer tax", amountEur: percentOf(price, inputs.itpPercent) });
  }
  const taxEur = taxLines.reduce((total, line) => total + line.amountEur, 0);

  const notaryEur = percentOf(price, inputs.notaryPercent);
  const landRegistryEur = percentOf(price, inputs.landRegistryPercent);
  const lawyerNetEur = percentOf(price, inputs.lawyerPercent);
  const lawyerIvaEur = percentOf(lawyerNetEur, inputs.lawyerIvaPercent);
  const lawyerEur = lawyerNetEur + lawyerIvaEur;
  const agentNetEur = percentOf(price, inputs.buyersAgentPercent);
  const agentIvaEur = percentOf(agentNetEur, inputs.buyersAgentIvaPercent);
  const agentEur = agentNetEur + agentIvaEur;
  const costsExFxEur =
    taxEur +
    notaryEur +
    landRegistryEur +
    lawyerEur +
    inputs.nieAdminEur +
    inputs.surveyEur +
    agentEur;
  const acquisitionExFxEur = price + costsExFxEur;

  const usesPerM2 = inputs.renovationMode === "perM2" || inputs.renovationMode === "both";
  const usesLineItems = inputs.renovationMode === "lineItems" || inputs.renovationMode === "both";
  const appliedRate = eurPerM2(inputs);
  const m2CostEur = usesPerM2 ? inputs.floorAreaM2 * appliedRate : 0;
  const lineItems: CostLine[] = usesLineItems
    ? RENOVATION_ITEM_KEYS.map((key: RenovationItemKey) => ({
        label: RENOVATION_ITEM_LABELS[key],
        amountEur: inputs[key],
      })).filter((line) => line.amountEur !== 0)
    : [];
  const lineItemsEur = lineItems.reduce((total, line) => total + line.amountEur, 0);
  const worksEur = m2CostEur + lineItemsEur;
  const professionalFeesEur = percentOf(worksEur, inputs.professionalFeePercent);
  const icioEur = percentOf(worksEur, inputs.icioPercent);
  const contingencyEur = percentOf(worksEur + professionalFeesEur, inputs.contingencyPercent);
  const ivaBaseEur = worksEur + professionalFeesEur + contingencyEur;
  const ivaEur = percentOf(ivaBaseEur, inputs.worksIvaPercent);
  const renovationEur = worksEur + professionalFeesEur + icioEur + contingencyEur + ivaEur;
  const allInExFxEur = acquisitionExFxEur + renovationEur;

  const tax = runningTax(inputs);
  const valueEntered = inputs.postRenovationValueEur > 0;
  const value = inputs.postRenovationValueEur;

  const cashTransfer = percentOf(allInExFxEur, inputs.fxSpreadPercent);
  const cashRequired = allInExFxEur + cashTransfer;
  const cashIrnr = tax.tax(0);
  const cashNetAnnual = netOfRunning(tax, 0);

  const loanCap = price > 0 ? price : 0;
  const spanishLoan = Math.min(loanCap, Math.max(0, percentOf(price, inputs.spanishLtvPercent)));
  const spanishDeposit = price - spanishLoan;
  const spanishFees =
    percentOf(spanishLoan, inputs.spanishArrangementFeePercent) +
    inputs.spanishValuationEur +
    inputs.spanishOtherMortgageCostsEur;
  const spanishFunded = spanishDeposit + costsExFxEur + renovationEur + spanishFees;
  const spanishTransfer = percentOf(spanishFunded, inputs.fxSpreadPercent);
  const spanishCash = spanishFunded + spanishTransfer;
  const spanishAnnuity = annuity(spanishLoan, inputs.spanishRatePercent, inputs.spanishTermYears);
  const spanishIrnr = tax.tax(spanishAnnuity.yearOneInterest);
  const spanishNetAnnual = netOfRunning(tax, spanishAnnuity.yearOneInterest) + spanishAnnuity.yearOneInterest;

  const ukBorrowedGbp = inputs.ukLoanGbp > 0 ? inputs.ukLoanGbp : 0;
  const ukProceeds = toEur(ukBorrowedGbp, rate);
  const ukFeesGbp =
    percentOf(ukBorrowedGbp, inputs.ukArrangementFeePercent) + inputs.ukOtherFeesGbp;
  const ukFeesEur = toEur(ukFeesGbp, rate);
  const ukTransfer = percentOf(allInExFxEur, inputs.fxSpreadPercent);
  const ukNeed = allInExFxEur + ukTransfer;
  const ukShortfall = Math.max(0, ukNeed - ukProceeds);
  const ukSurplus = Math.max(0, ukProceeds - ukNeed);
  const ukCash = ukShortfall + ukFeesEur;
  const ukAnnuity = annuity(ukBorrowedGbp, inputs.ukRatePercent, inputs.ukTermYears);
  const ukInterestEur = toEur(ukAnnuity.totalInterest, rate);
  const ukYearOneEur = toEur(ukAnnuity.yearOneInterest, rate);
  const ukMonthlyEur = toEur(ukAnnuity.monthlyPayment, rate);
  const ukIrnr = tax.tax(ukYearOneEur);
  const ukNetAnnual = netOfRunning(tax, ukYearOneEur) + ukYearOneEur;

  const yieldOn = (netIncome: number, base: number) => (base > 0 ? (netIncome / base) * 100 : 0);

  const runningLines = [
    nonZero("IBI", inputs.ibiAnnualEur),
    nonZero("Community fees", inputs.communityAnnualEur),
    nonZero("Basura", inputs.basuraAnnualEur),
    nonZero("Insurance", inputs.insuranceAnnualEur),
    nonZero("Utilities", inputs.utilitiesAnnualEur),
  ].filter((line): line is CostLine => line != null);

  return {
    inputs,
    gbpPerEur: rate > 0 ? rate : 0,
    eurPerGbp: rate > 0 ? 1 / rate : 0,
    priceGbp: toGbp(price, rate),
    purchase: {
      taxLines,
      taxEur,
      notaryEur,
      landRegistryEur,
      lawyerNetEur,
      lawyerIvaEur,
      lawyerEur,
      nieAdminEur: inputs.nieAdminEur,
      surveyEur: inputs.surveyEur,
      agentNetEur,
      agentIvaEur,
      agentEur,
      costsExFxEur,
      acquisitionExFxEur,
    },
    renovation: {
      usesPerM2,
      usesLineItems,
      eurPerM2: appliedRate,
      floorAreaM2: inputs.floorAreaM2,
      m2CostEur,
      lineItems,
      worksEur,
      professionalFeesEur,
      icioEur,
      contingencyEur,
      ivaEur,
      totalEur: renovationEur,
    },
    allInExFxEur,
    running: {
      lines: runningLines,
      operatingEur: tax.operatingEur,
      imputedIncomeEur: tax.imputedIncomeEur,
      irnrEur: tax.tax(0),
      irnrBasis: tax.basis,
      rentEur: tax.rentEur,
      netAnnualCostEur: cashNetAnnual,
      grossYieldOnPricePercent: price > 0 ? (tax.rentEur / price) * 100 : 0,
      netYieldOnAllInPercent: yieldOn(-cashNetAnnual, allInExFxEur),
    },
    finance: {
      cash: column({
        id: "cash",
        cashRequiredEur: cashRequired,
        currencyTransferEur: cashTransfer,
        amountBorrowedEur: 0,
        amountBorrowedGbp: null,
        monthlyPaymentEur: 0,
        monthlyPaymentGbp: null,
        totalInterestEur: 0,
        totalInterestGbp: null,
        yearOneInterestGbp: null,
        totalCostEur: cashRequired,
        feesEur: 0,
        priceDepositEur: price,
        surplusEur: 0,
        equityEur: valueEntered ? value : null,
        yearOneInterestEur: 0,
        irnrEur: cashIrnr,
        netAnnualCostEur: cashNetAnnual,
        netYieldOnCashPercent: yieldOn(-cashNetAnnual, cashRequired),
      }),
      spanish: column({
        id: "spanishMortgage",
        cashRequiredEur: spanishCash,
        currencyTransferEur: spanishTransfer,
        amountBorrowedEur: spanishLoan,
        amountBorrowedGbp: null,
        monthlyPaymentEur: spanishAnnuity.monthlyPayment,
        monthlyPaymentGbp: null,
        totalInterestEur: spanishAnnuity.totalInterest,
        totalInterestGbp: null,
        yearOneInterestGbp: null,
        totalCostEur: allInExFxEur + spanishTransfer + spanishFees + spanishAnnuity.totalInterest,
        feesEur: spanishFees,
        priceDepositEur: spanishDeposit,
        surplusEur: 0,
        equityEur: valueEntered ? value - spanishLoan : null,
        yearOneInterestEur: spanishAnnuity.yearOneInterest,
        irnrEur: spanishIrnr,
        netAnnualCostEur: spanishNetAnnual,
        netYieldOnCashPercent: yieldOn(-spanishNetAnnual, spanishCash),
      }),
      uk: column({
        id: "ukRemortgage",
        cashRequiredEur: ukCash,
        currencyTransferEur: ukTransfer,
        amountBorrowedEur: ukProceeds,
        amountBorrowedGbp: ukBorrowedGbp,
        monthlyPaymentEur: ukMonthlyEur,
        monthlyPaymentGbp: ukAnnuity.monthlyPayment,
        totalInterestEur: ukInterestEur,
        totalInterestGbp: ukAnnuity.totalInterest,
        yearOneInterestGbp: ukAnnuity.yearOneInterest,
        totalCostEur: allInExFxEur + ukTransfer + ukFeesEur + ukInterestEur,
        feesEur: ukFeesEur,
        priceDepositEur: null,
        surplusEur: ukSurplus,
        equityEur: valueEntered ? value - ukProceeds : null,
        yearOneInterestEur: ukYearOneEur,
        irnrEur: ukIrnr,
        netAnnualCostEur: ukNetAnnual,
        netYieldOnCashPercent: yieldOn(-ukNetAnnual, ukCash),
      }),
    },
    tenancy: seasonQuote(inputs, 0, rate),
    holidayLet: tax.holiday,
    comparison: stayComparison({
      inputs,
      price,
      purchaseCostsExFxEur: costsExFxEur,
      renovationEur,
      cashTransfer,
      spanishTransfer,
      ukTransfer,
      spanishFees,
      ukFeesEur,
      spanishLoan,
      ukBorrowedGbp,
      gbpPerEur: rate,
      tax,
    }),
  };
}

function stayComparison(args: {
  inputs: SpainVillaInputs;
  price: number;
  purchaseCostsExFxEur: number;
  renovationEur: number;
  cashTransfer: number;
  spanishTransfer: number;
  ukTransfer: number;
  spanishFees: number;
  ukFeesEur: number;
  spanishLoan: number;
  ukBorrowedGbp: number;
  gbpPerEur: number;
  tax: RunningTax;
}): SpainVillaResult["comparison"] {
  const { inputs, tax } = args;
  const spanishInterest = loanYearInterests(
    args.spanishLoan,
    inputs.spanishRatePercent,
    inputs.spanishTermYears,
    BREAKEVEN_MAX_YEARS,
  );
  const ukInterestGbp = loanYearInterests(
    args.ukBorrowedGbp,
    inputs.ukRatePercent,
    inputs.ukTermYears,
    BREAKEVEN_MAX_YEARS,
  );
  const ukInterestEur = ukInterestGbp.map((interest) => toEur(interest, args.gbpPerEur));
  const noInterest = Array.from({ length: BREAKEVEN_MAX_YEARS }, () => 0);
  const startValueEur = inputs.postRenovationValueEur > 0 ? inputs.postRenovationValueEur : args.price;

  const rentAt = (years: number) => rentCostOverYears(inputs, years);

  const option = (
    id: FinanceColumn["id"],
    currencyTransferEur: number,
    financeFeesEur: number,
    interestByYearEur: number[],
  ): HoldingComparison => {
    const at = (years: number) =>
      holdingCost({
        years,
        priceEur: args.price,
        purchaseCostsExFxEur: args.purchaseCostsExFxEur,
        renovationEur: args.renovationEur,
        currencyTransferEur,
        financeFeesEur,
        interestByYearEur,
        carryingEur: (interestEur, yearIndex) =>
          netOfRunning(tax, interestEur) + (yearIndex === 0 ? tax.setupEur : 0),
        startValueEur,
        appreciationPercent: inputs.appreciationPercent,
      });
    return {
      id,
      costEur: [at(COMPARISON_YEARS[0]), at(COMPARISON_YEARS[1]), at(COMPARISON_YEARS[2])],
      breakevenYear: breakevenYear(at, rentAt),
    };
  };

  return {
    years: COMPARISON_YEARS,
    startValueEur,
    rentCostEur: [
      rentAt(COMPARISON_YEARS[0]),
      rentAt(COMPARISON_YEARS[1]),
      rentAt(COMPARISON_YEARS[2]),
    ],
    options: [
      option("cash", args.cashTransfer, 0, noInterest),
      option("spanishMortgage", args.spanishTransfer, args.spanishFees, spanishInterest),
      option("ukRemortgage", args.ukTransfer, args.ukFeesEur, ukInterestEur),
    ],
  };
}
