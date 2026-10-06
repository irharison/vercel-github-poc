/**
 * Digital nomad visa costs, the income test, and a simple tax comparison.
 *
 * Nothing here reduces ITP, IVA or AJD. Spain's property golden visa ended
 * on 3 April 2025, and visa status does not change those purchase taxes.
 *
 * While the option is on, the owner is treated as Spanish tax resident:
 * non-resident tax on the villa is not charged. Salary tax (IRPF, Beckham
 * or a handwritten UK figure) is reported beside that and is not added to
 * the cost of the villa or the tenancy.
 *
 * These are planning estimates, not a tax return and not immigration advice.
 */

import type { ResidencyQuote, SpainVillaInputs, TaxBand } from "./types";

function money(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function renewalEveryYears(inputs: SpainVillaInputs): number {
  const years = Math.round(inputs.nomadRenewalEveryYears);
  return years >= 1 ? years : 1;
}

/** Visa fee, TIE, translations, criminal-record check and the first lawyer. */
export function visaOneOffEur(inputs: SpainVillaInputs): number {
  if (!inputs.digitalNomad) return 0;
  return (
    money(inputs.nomadVisaFeeEur) +
    money(inputs.nomadTieEur) +
    money(inputs.nomadTranslationsEur) +
    money(inputs.nomadCriminalRecordEur) +
    money(inputs.nomadLawyerEur)
  );
}

/**
 * Health insurance, plus the renewal cost spread over the years between
 * renewals. A three-year renewal is one third of that fee each year.
 */
export function visaAnnualEur(inputs: SpainVillaInputs): number {
  if (!inputs.digitalNomad) return 0;
  return money(inputs.nomadHealthAnnualEur) + money(inputs.nomadRenewalEur) / renewalEveryYears(inputs);
}

/** One-off in the first year, then the annual amount for every year in the span. */
export function visaCostOverYears(inputs: SpainVillaInputs, years: number): number {
  const count = Math.max(0, Math.round(years));
  if (!inputs.digitalNomad || count === 0) return 0;
  return visaOneOffEur(inputs) + visaAnnualEur(inputs) * count;
}

/** Progressive tax on income after the allowance. Bands are applied in order. */
export function progressiveTax(income: number, bands: readonly TaxBand[], allowance: number): number {
  const taxable = Math.max(0, money(income) - money(allowance));
  let lower = 0;
  let total = 0;
  for (const band of bands) {
    if (taxable <= lower) break;
    const ceiling = band.upTo == null || !Number.isFinite(band.upTo) ? Number.POSITIVE_INFINITY : band.upTo;
    const top = Math.min(taxable, ceiling);
    const slice = top - lower;
    if (slice > 0) total += (slice * band.rate) / 100;
    if (ceiling > lower) lower = ceiling;
  }
  return total;
}

/**
 * Beckham special regime: flat rate up to the cap, then the excess rate.
 * The personal allowance is not deducted. Null when eligibility is off.
 */
export function beckhamTaxEur(inputs: SpainVillaInputs): number | null {
  if (!inputs.beckhamEligible) return null;
  const income = money(inputs.remoteIncomeEur);
  const cap = money(inputs.beckhamCapEur);
  const inCap = Math.min(income, cap);
  const excess = Math.max(0, income - cap);
  return (inCap * inputs.beckhamRatePercent) / 100 + (excess * inputs.beckhamExcessRatePercent) / 100;
}

export function residencyQuote(inputs: SpainVillaInputs, gbpPerEur: number): ResidencyQuote {
  const income = money(inputs.remoteIncomeEur);
  const threshold = money(inputs.incomeThresholdEur);
  const ukTaxGbp = inputs.ukResidentTaxGbp;
  const uk =
    ukTaxGbp == null || !Number.isFinite(ukTaxGbp) ? null : Math.max(0, ukTaxGbp);
  const toEur = (gbp: number) => (gbpPerEur > 0 ? gbp / gbpPerEur : 0);
  const years = Math.round(inputs.beckhamYears);

  return {
    enabled: inputs.digitalNomad,
    oneOffEur: visaOneOffEur(inputs),
    annualEur: visaAnnualEur(inputs),
    renewalEveryYears: renewalEveryYears(inputs),
    incomeEur: income,
    thresholdEur: threshold,
    thresholdMonthlyEur: threshold / 12,
    incomeTestPassed: income >= threshold,
    irpfEur: progressiveTax(income, inputs.irpfBands, inputs.irpfAllowanceEur),
    beckhamEligible: inputs.beckhamEligible,
    beckhamEur: beckhamTaxEur(inputs),
    beckhamYears: years >= 1 ? years : 1,
    ukTaxGbp: uk,
    ukTaxEur: uk == null ? null : toEur(uk),
  };
}
