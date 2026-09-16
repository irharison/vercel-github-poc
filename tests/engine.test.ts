import { describe, expect, it } from "vitest";
import { defaultDeal, defaultLending, defaultSdlt, defaultSettings, defaultTax, salePrice } from "../lib/calc/defaults";
import {
  calculateDeal,
  calculateLending,
  calculateSdlt,
  corporationTax,
  gainTax,
  rentalProfitTax,
} from "../lib/calc/engine";
import { dealFromJson, settingsFromJson } from "../lib/calc/json";
import type { DealInputs } from "../lib/calc/types";

function closeTo(actual: number, expected: number, delta = 0.01) {
  expect(actual).toBeCloseTo(expected, Math.max(0, Math.round(-Math.log10(delta))));
}

describe("SDLT bands", () => {
  const sdltDefaults = defaultSdlt();

  it("standard rates, no surcharge, £300,000", () => {
    const r = calculateSdlt({
      price: 300000,
      settings: sdltDefaults,
      additionalDwelling: false,
      nonResident: false,
    });
    closeTo(r.total, 5000);
    expect(r.flatRateApplied).toBe(false);
    expect(r.surchargeApplied).toBe(0);
  });

  it("additional dwelling surcharge applies to every band, £250,000", () => {
    const r = calculateSdlt({
      price: 250000,
      settings: sdltDefaults,
      additionalDwelling: true,
      nonResident: false,
    });
    closeTo(r.total, 15000);
    expect(r.surchargeApplied).toBe(5);
    closeTo(r.effectiveRate, 6, 0.001);
  });

  it("surcharge does not apply below the minimum price", () => {
    const r = calculateSdlt({
      price: 39999,
      settings: sdltDefaults,
      additionalDwelling: true,
      nonResident: false,
    });
    expect(r.surchargeApplied).toBe(0);
    closeTo(r.total, 0);
  });

  it("surcharge applies exactly at the minimum price", () => {
    const r = calculateSdlt({
      price: 40000,
      settings: sdltDefaults,
      additionalDwelling: true,
      nonResident: false,
    });
    expect(r.surchargeApplied).toBe(5);
    closeTo(r.total, 2000);
  });

  it("non-resident surcharge stacks on the additional-dwelling one", () => {
    const r = calculateSdlt({
      price: 250000,
      settings: sdltDefaults,
      additionalDwelling: true,
      nonResident: true,
    });
    expect(r.surchargeApplied).toBe(7);
    closeTo(r.total, 20000);
  });

  it("top band is open-ended, £2,000,000 no surcharge", () => {
    const r = calculateSdlt({
      price: 2000000,
      settings: sdltDefaults,
      additionalDwelling: false,
      nonResident: false,
    });
    closeTo(r.total, 153750);
    expect(r.bands.at(-1)?.to).toBeNull();
  });

  it("company flat rate overrides the bands above its threshold", () => {
    const s = { ...sdltDefaults, applyCompanyFlatRate: true };
    const r = calculateSdlt({
      price: 600000,
      settings: s,
      additionalDwelling: true,
      nonResident: false,
    });
    expect(r.flatRateApplied).toBe(true);
    closeTo(r.total, 102000);
  });

  it("company flat rate does not apply at or below its threshold", () => {
    const s = { ...sdltDefaults, applyCompanyFlatRate: true };
    const r = calculateSdlt({
      price: 500000,
      settings: s,
      additionalDwelling: true,
      nonResident: false,
    });
    expect(r.flatRateApplied).toBe(false);
    closeTo(r.total, 40000);
  });

  it("zero price yields zero duty", () => {
    const r = calculateSdlt({
      price: 0,
      settings: sdltDefaults,
      additionalDwelling: true,
      nonResident: true,
    });
    expect(r.total).toBe(0);
    expect(r.bands).toEqual([]);
  });
});

describe("Corporation Tax", () => {
  const t = defaultTax();
  it("small profits rate below the lower threshold", () => closeTo(corporationTax(30000, t), 5700));
  it("continuous at the lower threshold", () => closeTo(corporationTax(50000, t), 9500));
  it("continuous at the upper threshold", () => closeTo(corporationTax(250000, t), 62500));
  it("marginal relief tapers in between", () => closeTo(corporationTax(100000, t), 22750));
  it("main rate above the upper threshold", () => closeTo(corporationTax(400000, t), 100000));
  it("no tax on a loss", () => {
    expect(corporationTax(-5000, t)).toBe(0);
    expect(corporationTax(0, t)).toBe(0);
  });
});

describe("Gain tax and Section 24", () => {
  it("limited company pays Corporation Tax with no annual exemption", () => {
    closeTo(gainTax(40000, defaultTax()), 7600);
  });
  it("personal ownership gets the annual exemption and the CGT rate", () => {
    closeTo(gainTax(40000, { ...defaultTax(), ownership: "personal" }), 8880);
  });
  it("a company deducts interest in full", () => {
    closeTo(rentalProfitTax(10000, 8000, defaultTax()), 1900);
  });
  it("an individual cannot deduct interest, and gets a 20% credit", () => {
    closeTo(rentalProfitTax(10000, 8000, { ...defaultTax(), ownership: "personal" }), 5600);
  });
  it("a cash loss can still produce a tax bill for an individual", () => {
    closeTo(rentalProfitTax(-2000, 9000, { ...defaultTax(), ownership: "personal" }), 1400);
  });
  it("a company pays nothing on the same cash loss", () => {
    expect(rentalProfitTax(-2000, 9000, defaultTax())).toBe(0);
  });
});

describe("Interest-only lending caps", () => {
  const lending = defaultLending();
  it("LTV binds when the rent is strong", () => {
    const deal = { ...defaultDeal(), purchasePrice: 250000, monthlyRent: 1200 };
    const r = calculateLending({ deal, lending });
    closeTo(r.ltvCap, 187500);
    closeTo(r.icrCap, 209454.5454);
    closeTo(r.maxLoan, 187500);
    expect(r.constraint).toBe("ltv");
  });
  it("interest cover binds when the rent is weak", () => {
    const deal = { ...defaultDeal(), purchasePrice: 250000, monthlyRent: 900 };
    const r = calculateLending({ deal, lending });
    closeTo(r.icrCap, 157090.9091);
    closeTo(r.loan, 157090.9091);
    expect(r.constraint).toBe("interestCover");
  });
  it("a deposit below the lender minimum is rejected, not honoured", () => {
    const deal: DealInputs = {
      ...defaultDeal(),
      financingMode: "targetDeposit",
      targetDeposit: 20000,
    };
    const r = calculateLending({ deal, lending });
    expect(r.cappedByLender).toBe(true);
    closeTo(r.loan, 187500);
    closeTo(r.deposit, 62500);
  });
});

describe("Whole deal", () => {
  const deal: DealInputs = {
    ...defaultDeal(),
    label: "Test deal",
    purchasePrice: 250000,
    monthlyRent: 1200,
    holdMonths: 24,
    voidPercent: 4,
    managementPercent: 10,
    maintenancePercentOfRent: 5,
    insuranceAnnual: 350,
    legalFeesPurchase: 1500,
    surveyFees: 700,
    refurbCost: 10000,
    salePriceMode: "growth",
    annualGrowthPercent: 3,
    saleAgentFeePercent: 1.5,
    saleLegalFees: 1200,
  };

  it("cash in reconciles with its line items", () => {
    const r = calculateDeal({ deal, settings: defaultSettings() });
    const summed = r.purchase.lineItems.reduce((a, [, v]) => a + v, 0);
    closeTo(summed, r.totalCashIn);
  });

  it("24 months produces two full rental years", () => {
    const r = calculateDeal({ deal, settings: defaultSettings() });
    expect(r.rental.years).toHaveLength(2);
    expect(r.rental.years.every((y) => y.monthsInYear === 12)).toBe(true);
  });

  it("sale price grows at the stated rate over the hold", () => {
    const r = calculateDeal({ deal, settings: defaultSettings() });
    closeTo(r.exit.salePrice, 250000 * 1.03 * 1.03);
    closeTo(salePrice(deal), 250000 * 1.03 * 1.03);
  });

  it("a company pays the higher SDLT rates automatically", () => {
    const r = calculateDeal({ deal, settings: defaultSettings() });
    expect(r.sdlt.surchargeApplied).toBe(5);
    closeTo(r.sdlt.total, 15000);
  });

  it("2 years at 3% growth does not recover a company purchase's costs", () => {
    const r = calculateDeal({ deal, settings: defaultSettings() });
    expect(r.exit.salePrice).toBeLessThan(r.exit.baseCost);
    expect(r.exit.gain).toBeLessThan(0);
    expect(r.exit.tax).toBe(0);
  });

  it("personal ownership is taxed more than a company on the same rent", () => {
    const settings = defaultSettings();
    const co = calculateDeal({ deal, settings });
    const personal = calculateDeal({
      deal,
      settings: { ...settings, tax: { ...settings.tax, ownership: "personal" } },
    });
    closeTo(personal.rental.profitBeforeTax, co.rental.profitBeforeTax);
    expect(personal.rental.tax).toBeGreaterThan(co.rental.tax);
  });
});

describe("serialisation", () => {
  it("AppSettings survives a JSON round trip", () => {
    const original = {
      ...defaultSettings(),
      sdlt: {
        ...defaultSdlt(),
        additionalDwellingSurcharge: 3,
        bands: [
          { upTo: 150000, rate: 1 },
          { upTo: null, rate: 9 },
        ],
      },
      lending: { ...defaultLending(), maxLtv: 70, interestCoverRatio: 1.45 },
    };
    const restored = settingsFromJson(original);
    expect(restored.sdlt.additionalDwellingSurcharge).toBe(3);
    expect(restored.sdlt.bands).toHaveLength(2);
    expect(restored.sdlt.bands.at(-1)?.upTo).toBeNull();
    expect(restored.lending.maxLtv).toBe(70);
  });

  it("missing keys fall back to defaults rather than throwing", () => {
    const restored = settingsFromJson({});
    expect(restored.sdlt.additionalDwellingSurcharge).toBe(defaultSdlt().additionalDwellingSurcharge);
    expect(restored.tax.ownership).toBe("limitedCompany");
  });

  it("DealInputs survives a JSON round trip", () => {
    const original = {
      ...defaultDeal(),
      label: "NW2 flat",
      postcode: "NW2 3",
      purchasePrice: 475000,
      marketValuation: 460000,
      monthlyRent: 2100,
      holdMonths: 30,
      refurbCost: 25000,
      salePriceMode: "explicit" as const,
      explicitSalePrice: 540000,
    };
    const restored = dealFromJson(original);
    expect(restored.label).toBe("NW2 flat");
    expect(restored.salePriceMode).toBe("explicit");
    expect(salePrice(restored)).toBe(540000);
  });
});
