/**
 * Off-season tenancy, and the multi-year cost of buying versus renting.
 *
 * A season's cost is the rent, the agency fee (including IVA), utilities,
 * cleaning, insurance, car hire and travel. The deposit is refundable and
 * is not included. Each later season grows by the annual increase.
 *
 * The cost of owning for Y years is:
 *   price + purchase costs + renovation + currency transfer + finance fees
 *   + mortgage interest during those Y years
 *   + running costs during those Y years (including the one-off VFT fee in year 1)
 *   − the villa's value after Y years.
 *
 * Value starts at the post-renovation value, or at the purchase price when
 * that was left blank, and grows by the appreciation rate. Capital repaid on
 * a mortgage is not added again: it is already reflected because the full
 * value is subtracted and only interest is added. Selling costs are not deducted.
 * The rate entered is held constant. Sterling interest is converted at today's
 * pounds-per-euro rate.
 */

import type { SeasonQuote, SpainVillaInputs } from "./types";

export const COMPARISON_YEARS = [1, 5, 10] as const;
export const BREAKEVEN_MAX_YEARS = 40;
export const SEASON_MONTHS_MIN = 6;
export const SEASON_MONTHS_MAX = 9;

export function clampSeasonMonths(months: number): number {
  if (!Number.isFinite(months)) return 7;
  return Math.min(SEASON_MONTHS_MAX, Math.max(SEASON_MONTHS_MIN, Math.round(months)));
}

export function clampHolidayMonths(months: number): number {
  if (!Number.isFinite(months)) return 0;
  return Math.min(12, Math.max(0, Math.round(months)));
}

function growth(percent: number, yearsElapsed: number): number {
  return (1 + percent / 100) ** yearsElapsed;
}

/** One season as a tenant. `yearIndex` 0 is the first season. */
export function seasonQuote(
  inputs: SpainVillaInputs,
  yearIndex: number,
  gbpPerEur: number,
): SeasonQuote {
  const months = clampSeasonMonths(inputs.rentSeasonMonths);
  const factor = growth(inputs.rentIncreasePercent, Math.max(0, yearIndex));
  const monthlyRentEur = inputs.offSeasonMonthlyRentEur * factor;
  const rentEur = monthlyRentEur * months;
  const agencyNetEur = monthlyRentEur * inputs.agencyFeeMonths;
  const agencyIvaEur = agencyNetEur * inputs.agencyIvaPercent / 100;
  const agencyEur = agencyNetEur + agencyIvaEur;
  const utilitiesEur = inputs.tenantUtilitiesPerMonthEur * months * factor;
  const cleaningEur = inputs.tenantCleaningEur * factor;
  const insuranceEur = inputs.tenantInsuranceEur * factor;
  const carHireEur = inputs.carHirePerMonthEur * months * factor;
  const travelEur = inputs.travelFlightsEur * factor;
  const costEur = rentEur + agencyEur + utilitiesEur + cleaningEur + insuranceEur + carHireEur + travelEur;
  const effectiveMonthlyEur = months > 0 ? costEur / months : 0;
  const depositEur = monthlyRentEur * inputs.depositMonths;
  const toGbp = (eur: number) => (gbpPerEur > 0 ? eur * gbpPerEur : 0);

  return {
    months,
    monthlyRentEur,
    rentEur,
    agencyNetEur,
    agencyIvaEur,
    agencyEur,
    utilitiesEur,
    cleaningEur,
    insuranceEur,
    carHireEur,
    travelEur,
    costEur,
    costGbp: toGbp(costEur),
    effectiveMonthlyEur,
    effectiveMonthlyGbp: toGbp(effectiveMonthlyEur),
    depositEur,
    depositGbp: toGbp(depositEur),
  };
}

/** Sum of season costs for `years` seasons. The deposit is not included. */
export function rentCostOverYears(inputs: SpainVillaInputs, years: number, gbpPerEur = 0): number {
  const count = Math.max(0, Math.round(years));
  let total = 0;
  for (let year = 0; year < count; year += 1) {
    total += seasonQuote(inputs, year, gbpPerEur).costEur;
  }
  return total;
}

/**
 * Interest in each of the first `years` years of a repayment loan.
 * Years after the term are zero. The sum through the full term matches
 * `annuity(...).totalInterest`, within floating point.
 */
export function loanYearInterests(
  principal: number,
  annualPercent: number,
  termYears: number,
  years: number,
): number[] {
  const count = Math.max(0, Math.round(years));
  const interests = Array.from({ length: count }, () => 0);
  const termMonths = Math.max(0, Math.round(termYears * 12));
  if (!(principal > 0) || termMonths === 0 || count === 0) return interests;

  const monthlyRate = annualPercent / 100 / 12;
  if (monthlyRate <= -1) return interests;

  const monthlyPayment =
    monthlyRate === 0
      ? principal / termMonths
      : (principal * monthlyRate * (1 + monthlyRate) ** termMonths) /
        ((1 + monthlyRate) ** termMonths - 1);

  let balance = principal;
  const last = Math.min(count * 12, termMonths);
  for (let month = 0; month < last; month += 1) {
    const interest = balance * monthlyRate;
    interests[Math.floor(month / 12)] += interest;
    balance -= monthlyPayment - interest;
  }
  return interests;
}

export function holdingCost(args: {
  years: number;
  priceEur: number;
  purchaseCostsExFxEur: number;
  renovationEur: number;
  currencyTransferEur: number;
  financeFeesEur: number;
  /** Interest by year, already in euros. */
  interestByYearEur: number[];
  /** Running cost for that year, given that year's interest (for any tax deduction). */
  carryingEur: (interestEur: number, yearIndex: number) => number;
  startValueEur: number;
  appreciationPercent: number;
}): number {
  const years = Math.max(0, Math.round(args.years));
  let interest = 0;
  let carrying = 0;
  for (let year = 0; year < years; year += 1) {
    const yearInterest = args.interestByYearEur[year] ?? 0;
    interest += yearInterest;
    carrying += args.carryingEur(yearInterest, year);
  }
  const value = args.startValueEur * growth(args.appreciationPercent, years);
  return (
    args.priceEur +
    args.purchaseCostsExFxEur +
    args.renovationEur +
    args.currencyTransferEur +
    args.financeFeesEur +
    interest +
    carrying -
    value
  );
}

/** First year in 1..max where `buy(year) < rent(year)`, or null. */
export function breakevenYear(
  buy: (years: number) => number,
  rent: (years: number) => number,
  maxYears = BREAKEVEN_MAX_YEARS,
): number | null {
  for (let year = 1; year <= maxYears; year += 1) {
    if (buy(year) < rent(year)) return year;
  }
  return null;
}
