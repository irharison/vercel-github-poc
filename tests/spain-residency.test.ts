import { describe, expect, it } from "vitest";
import { rentCostOverYears } from "../lib/spain/compare";
import { defaultSpainVilla } from "../lib/spain/defaults";
import { calculateSpainVilla } from "../lib/spain/engine";
import { villaFromJson } from "../lib/spain/json";
import {
  beckhamTaxEur,
  progressiveTax,
  visaAnnualEur,
  visaCostOverYears,
  visaOneOffEur,
} from "../lib/spain/residency";
import type { SpainVillaInputs } from "../lib/spain/types";

function closeTo(actual: number, expected: number, delta = 0.01) {
  expect(actual).toBeCloseTo(expected, Math.max(0, Math.round(-Math.log10(delta))));
}

function villa(overrides: Partial<SpainVillaInputs> = {}): SpainVillaInputs {
  return { ...defaultSpainVilla(), ...overrides };
}

describe("digital nomad residency", () => {
  it("does not change purchase tax, and leaves the option off by default", () => {
    const nonResident = calculateSpainVilla(defaultSpainVilla());
    const resident = calculateSpainVilla(villa({ digitalNomad: true }));
    expect(nonResident.residency.enabled).toBe(false);
    expect(resident.purchase.taxEur).toBe(nonResident.purchase.taxEur);
    expect(resident.purchase.taxLines.map((line) => line.label)).toEqual(["ITP transfer tax"]);
    closeTo(resident.purchase.taxEur, 52500);
  });

  it("uses the planning allowances for one-off and annual visa costs", () => {
    const inputs = villa({ digitalNomad: true });
    closeTo(visaOneOffEur(inputs), 160 + 16 + 400 + 120 + 1500);
    closeTo(visaAnnualEur(inputs), 1500 + 800 / 3);
    closeTo(visaCostOverYears(inputs, 1), visaOneOffEur(inputs) + visaAnnualEur(inputs));
    closeTo(visaCostOverYears(inputs, 5), visaOneOffEur(inputs) + visaAnnualEur(inputs) * 5);
    expect(visaCostOverYears(villa(), 5)).toBe(0);
  });

  it("spreads a renewal across the interval, and treats a zero interval as one year", () => {
    const inputs = villa({
      digitalNomad: true,
      nomadHealthAnnualEur: 1200,
      nomadRenewalEur: 900,
      nomadRenewalEveryYears: 0,
    });
    closeTo(visaAnnualEur(inputs), 2100);
  });

  it("turns off non-resident tax and adds the annual visa cost", () => {
    const before = calculateSpainVilla(defaultSpainVilla());
    const after = calculateSpainVilla(villa({ digitalNomad: true }));
    closeTo(before.running.irnrEur, 792);
    expect(after.running.irnrBasis).toBe("resident");
    expect(after.running.irnrEur).toBe(0);
    expect(after.finance.spanish.irnrEur).toBe(0);
    closeTo(after.running.netAnnualCostEur, before.running.netAnnualCostEur - 792 + visaAnnualEur(after.inputs));
    closeTo(
      after.finance.cash.totalCostEur,
      before.finance.cash.totalCostEur + visaCostOverYears(after.inputs, 20),
    );
    closeTo(
      after.finance.uk.totalCostEur,
      before.finance.uk.totalCostEur + visaCostOverYears(after.inputs, after.inputs.ukTermYears),
    );
  });

  it("adds visa costs to renting and buying, and the IRNR saving only to buying", () => {
    const before = calculateSpainVilla(defaultSpainVilla());
    const after = calculateSpainVilla(villa({ digitalNomad: true }));
    const visa = visaCostOverYears(after.inputs, 1);
    const rentDelta = after.comparison.rentCostEur[0] - before.comparison.rentCostEur[0];
    const buyDelta = after.comparison.options[0].costEur[0] - before.comparison.options[0].costEur[0];
    closeTo(rentDelta, visa);
    closeTo(buyDelta - rentDelta, -792);
    closeTo(rentCostOverYears(after.inputs, 1), rentCostOverYears(before.inputs, 1) + visa);
  });

  it("still counts holiday-let costs, without non-resident tax, when the visa is on", () => {
    const result = calculateSpainVilla(
      villa({
        digitalNomad: true,
        holidayLetEnabled: true,
        holidayLetMonths: 2,
        holidayPeakMonthlyRentEur: 1000,
        holidayOccupancyPercent: 50,
        holidayManagementPercent: 20,
        holidayManagementIvaPercent: 21,
        ibiAnnualEur: 0,
        communityAnnualEur: 0,
        basuraAnnualEur: 0,
        insuranceAnnualEur: 0,
        utilitiesAnnualEur: 0,
        cadastralValueEur: 0,
      }),
    );
    expect(result.running.irnrEur).toBe(0);
    closeTo(result.running.netAnnualCostEur, 242 - 1000 + visaAnnualEur(result.inputs));
  });

  it("passes the income test at the default and fails below the threshold", () => {
    const passing = calculateSpainVilla(villa({ digitalNomad: true }));
    expect(passing.residency.incomeTestPassed).toBe(true);
    closeTo(passing.residency.thresholdEur, 34188);
    closeTo(passing.residency.thresholdMonthlyEur, 34188 / 12);
    const failing = calculateSpainVilla(villa({ digitalNomad: true, remoteIncomeEur: 20000 }));
    expect(failing.residency.incomeTestPassed).toBe(false);
  });

  it("applies the combined Andalucía bands after the personal allowance", () => {
    const inputs = defaultSpainVilla();
    closeTo(progressiveTax(48000, inputs.irpfBands, 5550), 11367.25);
    const result = calculateSpainVilla(villa({ digitalNomad: true }));
    closeTo(result.residency.irpfEur, 11367.25);
  });

  it("charges Beckham at 24% up to €600,000 and 47% above, unless eligibility is off", () => {
    const eligible = villa({ remoteIncomeEur: 48000 });
    closeTo(beckhamTaxEur(eligible) ?? 0, 11520);
    const above = villa({ remoteIncomeEur: 700000 });
    closeTo(beckhamTaxEur(above) ?? 0, 600000 * 0.24 + 100000 * 0.47);
    expect(beckhamTaxEur(villa({ beckhamEligible: false }))).toBeNull();
    const result = calculateSpainVilla(villa({ digitalNomad: true, beckhamEligible: false }));
    expect(result.residency.beckhamEur).toBeNull();
    expect(result.residency.beckhamYears).toBe(6);
  });

  it("leaves UK tax blank until a figure is entered", () => {
    const blank = calculateSpainVilla(villa({ digitalNomad: true }));
    expect(blank.residency.ukTaxGbp).toBeNull();
    expect(blank.residency.ukTaxEur).toBeNull();
    const entered = calculateSpainVilla(villa({ digitalNomad: true, ukResidentTaxGbp: 8600, gbpPerEur: 0.86 }));
    closeTo(entered.residency.ukTaxEur ?? 0, 10000);
  });

  it("keeps a saved villa that predates the visa fields on the non-resident defaults", () => {
    const loaded = villaFromJson({ purchasePriceEur: 400000 });
    expect(loaded.digitalNomad).toBe(false);
    expect(loaded.ukResidentTaxGbp).toBeNull();
    expect(loaded.incomeThresholdEur).toBe(34188);
    expect(loaded.irpfBands).toHaveLength(8);
    expect(loaded.irpfBands[0]).toEqual({ upTo: 12450, rate: 19 });
    expect(loaded.irpfBands.at(-1)?.upTo).toBeNull();
  });
});
