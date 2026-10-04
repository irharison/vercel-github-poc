import { describe, expect, it } from "vitest";
import {
  loanYearInterests,
  rentCostOverYears,
  seasonQuote,
} from "../lib/spain/compare";
import { defaultSpainVilla } from "../lib/spain/defaults";
import { annuity, calculateSpainVilla } from "../lib/spain/engine";
import { villaFromJson } from "../lib/spain/json";
import type { SpainVillaInputs } from "../lib/spain/types";

function closeTo(actual: number, expected: number, delta = 0.01) {
  expect(actual).toBeCloseTo(expected, Math.max(0, Math.round(-Math.log10(delta))));
}

function villa(overrides: Partial<SpainVillaInputs> = {}): SpainVillaInputs {
  return { ...defaultSpainVilla(), ...overrides };
}

describe("annuity", () => {
  it("uses the standard repayment formula, £200,000 at 6% for 30 years", () => {
    const result = annuity(200000, 6, 30);
    expect(result.months).toBe(360);
    closeTo(result.monthlyPayment, 1199.1, 0.01);
    closeTo(result.totalInterest, result.monthlyPayment * 360 - 200000);
    expect(result.yearOneInterest).toBeGreaterThan(0);
    expect(result.yearOneInterest).toBeLessThan(result.totalInterest);
  });

  it("charges no interest when the rate is zero", () => {
    const result = annuity(12000, 0, 10);
    expect(result.months).toBe(120);
    closeTo(result.monthlyPayment, 100);
    closeTo(result.totalInterest, 0);
    closeTo(result.yearOneInterest, 0);
  });

  it("returns zeros when there is nothing to borrow or no term", () => {
    expect(annuity(0, 3.5, 20).monthlyPayment).toBe(0);
    expect(annuity(1000, 3.5, 0).totalInterest).toBe(0);
    expect(annuity(-50, 3.5, 20).monthlyPayment).toBe(0);
  });
});

describe("Andalucía purchase costs", () => {
  it("charges flat ITP on a resale and ignores IVA and AJD", () => {
    const result = calculateSpainVilla(
      villa({
        purchasePriceEur: 100000,
        acquisitionType: "resale",
        itpPercent: 7,
        ivaPercent: 10,
        ajdPercent: 1.2,
        notaryPercent: 0,
        landRegistryPercent: 0,
        lawyerPercent: 0,
        nieAdminEur: 0,
        surveyEur: 0,
        buyersAgentPercent: 0,
        floorAreaM2: 0,
        renovationMode: "perM2",
      }),
    );
    closeTo(result.purchase.taxEur, 7000);
    expect(result.purchase.taxLines.map((line) => line.label)).toEqual(["ITP transfer tax"]);
    closeTo(result.purchase.acquisitionExFxEur, 107000);
  });

  it("charges IVA plus AJD on a new build and ignores ITP", () => {
    const result = calculateSpainVilla(
      villa({
        purchasePriceEur: 100000,
        acquisitionType: "newBuild",
        itpPercent: 7,
        ivaPercent: 10,
        ajdPercent: 1.2,
        notaryPercent: 0,
        landRegistryPercent: 0,
        lawyerPercent: 0,
        nieAdminEur: 0,
        surveyEur: 0,
        buyersAgentPercent: 0,
        floorAreaM2: 0,
      }),
    );
    closeTo(result.purchase.taxEur, 11200);
    expect(result.purchase.taxLines.map((line) => line.label)).toEqual(["IVA", "AJD stamp duty"]);
  });

  it("adds notary, registry, lawyer IVA, admin, survey and an optional agent", () => {
    const result = calculateSpainVilla(
      villa({
        purchasePriceEur: 100000,
        notaryPercent: 0.75,
        landRegistryPercent: 0.5,
        lawyerPercent: 1,
        lawyerIvaPercent: 21,
        nieAdminEur: 1000,
        surveyEur: 1500,
        buyersAgentPercent: 3,
        buyersAgentIvaPercent: 21,
        itpPercent: 0,
        floorAreaM2: 0,
      }),
    );
    closeTo(result.purchase.notaryEur, 750);
    closeTo(result.purchase.landRegistryEur, 500);
    closeTo(result.purchase.lawyerNetEur, 1000);
    closeTo(result.purchase.lawyerIvaEur, 210);
    closeTo(result.purchase.lawyerEur, 1210);
    closeTo(result.purchase.agentNetEur, 3000);
    closeTo(result.purchase.agentIvaEur, 630);
    closeTo(result.purchase.agentEur, 3630);
    closeTo(result.purchase.costsExFxEur, 750 + 500 + 1210 + 1000 + 1500 + 3630);
  });
});

describe("renovation", () => {
  const quietPurchase = {
    purchasePriceEur: 0,
    itpPercent: 0,
    notaryPercent: 0,
    landRegistryPercent: 0,
    lawyerPercent: 0,
    nieAdminEur: 0,
    surveyEur: 0,
    buyersAgentPercent: 0,
  } satisfies Partial<SpainVillaInputs>;

  it("prices the selected tier per m² and leaves line items out", () => {
    const result = calculateSpainVilla(
      villa({
        ...quietPurchase,
        renovationMode: "perM2",
        renovationTier: "full",
        floorAreaM2: 10,
        fullEurPerM2: 1800,
        kitchenEur: 15000,
        professionalFeePercent: 10,
        icioPercent: 4,
        contingencyPercent: 10,
        worksIvaPercent: 21,
      }),
    );
    const works = 18000;
    const fees = 1800;
    const icio = 720;
    const contingency = 1980;
    const iva = 0.21 * (works + fees + contingency);
    closeTo(result.renovation.worksEur, works);
    closeTo(result.renovation.professionalFeesEur, fees);
    closeTo(result.renovation.icioEur, icio);
    closeTo(result.renovation.contingencyEur, contingency);
    closeTo(result.renovation.ivaEur, iva);
    closeTo(result.renovation.totalEur, works + fees + icio + contingency + iva);
    expect(result.renovation.lineItems).toEqual([]);
  });

  it("sums line items without the per-m² allowance", () => {
    const result = calculateSpainVilla(
      villa({
        ...quietPurchase,
        renovationMode: "lineItems",
        floorAreaM2: 200,
        mediumEurPerM2: 1000,
        kitchenEur: 15000,
        bathroomsEur: 12000,
        poolEur: 30000,
        roofEur: 10000,
        servicesEur: 18000,
        windowsEur: 14000,
        landscapingEur: 8000,
        furnishingEur: 20000,
        professionalFeePercent: 0,
        icioPercent: 0,
        contingencyPercent: 0,
        worksIvaPercent: 0,
      }),
    );
    closeTo(result.renovation.m2CostEur, 0);
    closeTo(result.renovation.worksEur, 127000);
    closeTo(result.renovation.totalEur, 127000);
  });

  it("adds line items on top of the per-m² budget when both are selected", () => {
    const result = calculateSpainVilla(
      villa({
        ...quietPurchase,
        renovationMode: "both",
        renovationTier: "medium",
        floorAreaM2: 10,
        mediumEurPerM2: 1000,
        kitchenEur: 5000,
        bathroomsEur: 0,
        poolEur: 0,
        roofEur: 0,
        servicesEur: 0,
        windowsEur: 0,
        landscapingEur: 0,
        furnishingEur: 0,
        professionalFeePercent: 0,
        icioPercent: 0,
        contingencyPercent: 0,
        worksIvaPercent: 0,
      }),
    );
    closeTo(result.renovation.worksEur, 15000);
  });

  it("does not charge IVA or contingency on the licence", () => {
    const result = calculateSpainVilla(
      villa({
        ...quietPurchase,
        renovationMode: "perM2",
        floorAreaM2: 10,
        mediumEurPerM2: 1000,
        professionalFeePercent: 0,
        icioPercent: 4,
        contingencyPercent: 0,
        worksIvaPercent: 21,
      }),
    );
    closeTo(result.renovation.worksEur, 10000);
    closeTo(result.renovation.icioEur, 400);
    closeTo(result.renovation.ivaEur, 2100);
    closeTo(result.renovation.totalEur, 12500);
  });
});

describe("finance options", () => {
  it("keeps the three options as alternatives with different currency transfers", () => {
    const result = calculateSpainVilla(
      villa({
        purchasePriceEur: 100000,
        itpPercent: 7,
        notaryPercent: 0,
        landRegistryPercent: 0,
        lawyerPercent: 0,
        nieAdminEur: 0,
        surveyEur: 0,
        buyersAgentPercent: 0,
        floorAreaM2: 0,
        renovationMode: "perM2",
        fxSpreadPercent: 10,
        spanishLtvPercent: 60,
        spanishArrangementFeePercent: 1,
        spanishValuationEur: 100,
        spanishOtherMortgageCostsEur: 50,
        spanishRatePercent: 0,
        spanishTermYears: 10,
        gbpPerEur: 0.8,
        ukLoanGbp: 40000,
        ukArrangementFeePercent: 0,
        ukOtherFeesGbp: 800,
        ukRatePercent: 0,
        ukTermYears: 10,
        ibiAnnualEur: 0,
        communityAnnualEur: 0,
        basuraAnnualEur: 0,
        insuranceAnnualEur: 0,
        utilitiesAnnualEur: 0,
        cadastralValueEur: 0,
        annualRentEur: 0,
      }),
    );

    closeTo(result.purchase.costsExFxEur, 7000);
    closeTo(result.allInExFxEur, 107000);

    closeTo(result.finance.cash.amountBorrowedEur, 0);
    closeTo(result.finance.cash.currencyTransferEur, 10700);
    closeTo(result.finance.cash.cashRequiredEur, 117700);
    closeTo(result.finance.cash.totalInterestEur, 0);
    closeTo(result.finance.cash.totalCostEur, 117700);
    closeTo(result.finance.cash.monthlyPaymentEur, 0);

    closeTo(result.finance.spanish.amountBorrowedEur, 60000);
    closeTo(result.finance.spanish.priceDepositEur ?? 0, 40000);
    closeTo(result.finance.spanish.feesEur, 750);
    const spanishFunded = 40000 + 7000 + 750;
    closeTo(result.finance.spanish.currencyTransferEur, spanishFunded * 0.1);
    closeTo(result.finance.spanish.cashRequiredEur, spanishFunded * 1.1);
    closeTo(result.finance.spanish.monthlyPaymentEur, 500);
    closeTo(result.finance.spanish.totalInterestEur, 0);
    closeTo(result.finance.spanish.totalCostEur, 107000 + spanishFunded * 0.1 + 750);

    closeTo(result.finance.uk.amountBorrowedGbp ?? 0, 40000);
    closeTo(result.finance.uk.amountBorrowedEur, 50000);
    closeTo(result.finance.uk.currencyTransferEur, 10700);
    closeTo(result.finance.uk.feesEur, 1000);
    closeTo(result.finance.uk.cashRequiredEur, 107000 + 10700 - 50000 + 1000);
    closeTo(result.finance.uk.totalInterestGbp ?? 0, 0);
    closeTo(result.finance.uk.monthlyPaymentGbp ?? 0, 40000 / 120);
  });

  it("caps a Spanish non-resident loan at the purchase price", () => {
    const result = calculateSpainVilla(
      villa({
        purchasePriceEur: 200000,
        spanishLtvPercent: 150,
        floorAreaM2: 0,
        itpPercent: 0,
        notaryPercent: 0,
        landRegistryPercent: 0,
        lawyerPercent: 0,
        nieAdminEur: 0,
        surveyEur: 0,
      }),
    );
    closeTo(result.finance.spanish.amountBorrowedEur, 200000);
    closeTo(result.finance.spanish.priceDepositEur ?? 0, 0);
  });

  it("does not convert a Spanish loan, and does convert a UK loan", () => {
    const result = calculateSpainVilla(
      villa({
        purchasePriceEur: 100000,
        fxSpreadPercent: 1,
        spanishLtvPercent: 70,
        spanishArrangementFeePercent: 0,
        spanishValuationEur: 0,
        spanishOtherMortgageCostsEur: 0,
        floorAreaM2: 0,
        itpPercent: 0,
        notaryPercent: 0,
        landRegistryPercent: 0,
        lawyerPercent: 0,
        nieAdminEur: 0,
        surveyEur: 0,
        ukLoanGbp: 0,
        ukOtherFeesGbp: 0,
      }),
    );
    closeTo(result.finance.spanish.currencyTransferEur, 30000 * 0.01);
    closeTo(result.finance.cash.currencyTransferEur, 100000 * 0.01);
    closeTo(result.finance.uk.currencyTransferEur, 100000 * 0.01);
  });

  it("treats a UK loan larger than the project as surplus that is still borrowed", () => {
    const result = calculateSpainVilla(
      villa({
        purchasePriceEur: 10000,
        gbpPerEur: 1,
        ukLoanGbp: 50000,
        ukArrangementFeePercent: 0,
        ukOtherFeesGbp: 250,
        fxSpreadPercent: 0,
        floorAreaM2: 0,
        itpPercent: 0,
        notaryPercent: 0,
        landRegistryPercent: 0,
        lawyerPercent: 0,
        nieAdminEur: 0,
        surveyEur: 0,
      }),
    );
    closeTo(result.finance.uk.surplusEur, 40000);
    closeTo(result.finance.uk.cashRequiredEur, 250);
    closeTo(result.finance.uk.amountBorrowedEur, 50000);
  });

  it("reports equity from a post-renovation value and omits it when the value is blank", () => {
    const blank = calculateSpainVilla(villa({ postRenovationValueEur: 0 }));
    expect(blank.finance.cash.equityEur).toBeNull();
    expect(blank.finance.spanish.equityEur).toBeNull();
    expect(blank.finance.uk.equityEur).toBeNull();

    const result = calculateSpainVilla(
      villa({
        purchasePriceEur: 100000,
        postRenovationValueEur: 200000,
        spanishLtvPercent: 60,
        gbpPerEur: 0.86,
        ukLoanGbp: 86000,
        floorAreaM2: 0,
      }),
    );
    closeTo(result.finance.cash.equityEur ?? 0, 200000);
    closeTo(result.finance.spanish.equityEur ?? 0, 140000);
    closeTo(result.finance.uk.amountBorrowedEur, 100000);
    closeTo(result.finance.uk.equityEur ?? 0, 100000);
  });
});

describe("running costs and IRNR", () => {
  const quiet = {
    purchasePriceEur: 100000,
    itpPercent: 0,
    notaryPercent: 0,
    landRegistryPercent: 0,
    lawyerPercent: 0,
    nieAdminEur: 0,
    surveyEur: 0,
    floorAreaM2: 0,
    fxSpreadPercent: 0,
    spanishLtvPercent: 0,
    spanishValuationEur: 0,
    ukLoanGbp: 0,
    ukOtherFeesGbp: 0,
  } satisfies Partial<SpainVillaInputs>;

  it("taxes imputed income when the villa is not let", () => {
    const result = calculateSpainVilla(
      villa({
        ...quiet,
        cadastralValueEur: 300000,
        imputationPercent: 1.1,
        irnrPercent: 24,
        annualRentEur: 0,
        ibiAnnualEur: 1500,
        communityAnnualEur: 0,
        basuraAnnualEur: 0,
        insuranceAnnualEur: 0,
        utilitiesAnnualEur: 0,
      }),
    );
    closeTo(result.running.imputedIncomeEur, 3300);
    closeTo(result.running.irnrEur, 792);
    expect(result.running.irnrBasis).toBe("imputed");
    closeTo(result.running.netAnnualCostEur, 1500 + 792);
  });

  it("taxes gross rent for a UK owner and does not also charge imputed income", () => {
    const result = calculateSpainVilla(
      villa({
        ...quiet,
        cadastralValueEur: 300000,
        imputationPercent: 2,
        irnrPercent: 24,
        annualRentEur: 10000,
        allowEuRentalDeductions: false,
        ibiAnnualEur: 500,
        communityAnnualEur: 0,
        basuraAnnualEur: 0,
        insuranceAnnualEur: 0,
        utilitiesAnnualEur: 0,
      }),
    );
    expect(result.running.irnrBasis).toBe("grossRent");
    closeTo(result.running.irnrEur, 2400);
    closeTo(result.finance.spanish.irnrEur, 2400);
    closeTo(result.running.grossYieldOnPricePercent, 10);
  });

  it("lets an EU-style net calculation deduct costs and that option's interest", () => {
    const result = calculateSpainVilla(
      villa({
        ...quiet,
        annualRentEur: 1000,
        allowEuRentalDeductions: true,
        irnrPercent: 24,
        ibiAnnualEur: 0,
        communityAnnualEur: 0,
        basuraAnnualEur: 0,
        insuranceAnnualEur: 0,
        utilitiesAnnualEur: 0,
        spanishLtvPercent: 100,
        spanishRatePercent: 12,
        spanishTermYears: 20,
        spanishArrangementFeePercent: 0,
      }),
    );
    expect(result.running.irnrBasis).toBe("netRent");
    closeTo(result.finance.cash.irnrEur, 240);
    expect(result.finance.spanish.yearOneInterestEur).toBeGreaterThan(1000);
    closeTo(result.finance.spanish.irnrEur, 0);
  });
});

describe("documented defaults", () => {
  it("matches the Andalucía planning estimates", () => {
    const inputs = defaultSpainVilla();
    expect(inputs.purchasePriceEur).toBe(750000);
    expect(inputs.acquisitionType).toBe("resale");
    expect(inputs.itpPercent).toBe(7);
    expect(inputs.ivaPercent).toBe(10);
    expect(inputs.ajdPercent).toBe(1.2);
    expect(inputs.notaryPercent).toBe(0.75);
    expect(inputs.landRegistryPercent).toBe(0.75);
    expect(inputs.lawyerPercent).toBe(1);
    expect(inputs.lawyerIvaPercent).toBe(21);
    expect(inputs.fxSpreadPercent).toBe(0.5);
    expect(inputs.gbpPerEur).toBe(0.86);
    expect(inputs.floorAreaM2).toBe(200);
    expect(inputs.mediumEurPerM2).toBe(1000);
    expect(inputs.lightEurPerM2).toBe(500);
    expect(inputs.fullEurPerM2).toBe(1800);
    expect(inputs.icioPercent).toBe(4);
    expect(inputs.worksIvaPercent).toBe(21);
    expect(inputs.contingencyPercent).toBe(10);
    expect(inputs.spanishLtvPercent).toBe(70);
    expect(inputs.spanishArrangementFeePercent).toBe(1);
    expect(inputs.irnrPercent).toBe(24);
    expect(inputs.imputationPercent).toBe(1.1);

    const result = calculateSpainVilla(inputs);
    closeTo(result.purchase.taxEur, 52500);
    closeTo(result.purchase.notaryEur, 5625);
    closeTo(result.purchase.landRegistryEur, 5625);
    closeTo(result.purchase.lawyerEur, 9075);
    closeTo(result.purchase.costsExFxEur, 75325);
    closeTo(result.purchase.acquisitionExFxEur, 825325);
    closeTo(result.renovation.worksEur, 200000);
    closeTo(result.renovation.professionalFeesEur, 20000);
    closeTo(result.renovation.icioEur, 8000);
    closeTo(result.renovation.contingencyEur, 22000);
    closeTo(result.renovation.ivaEur, 50820);
    closeTo(result.renovation.totalEur, 300820);
    closeTo(result.allInExFxEur, 1126145);
    closeTo(result.finance.cash.currencyTransferEur, 5630.725);
    closeTo(result.finance.cash.cashRequiredEur, 1131775.725);
    closeTo(result.finance.spanish.amountBorrowedEur, 525000);
    closeTo(result.finance.spanish.priceDepositEur ?? 0, 225000);
    closeTo(result.finance.spanish.feesEur, 5700);
    closeTo(result.finance.spanish.cashRequiredEur, 609879.225);
    closeTo(result.priceGbp, 645000);
    closeTo(result.running.irnrEur, 792);
    closeTo(result.running.netAnnualCostEur, 7292);
    expect(result.finance.spanish.totalInterestEur).toBeGreaterThan(0);
    expect(result.finance.uk.monthlyPaymentGbp).toBeGreaterThan(0);
  });
});

function bare(overrides: Partial<SpainVillaInputs> = {}): SpainVillaInputs {
  return villa({
    purchasePriceEur: 100000,
    itpPercent: 0,
    notaryPercent: 0,
    landRegistryPercent: 0,
    lawyerPercent: 0,
    nieAdminEur: 0,
    surveyEur: 0,
    buyersAgentPercent: 0,
    floorAreaM2: 0,
    professionalFeePercent: 0,
    icioPercent: 0,
    worksIvaPercent: 0,
    contingencyPercent: 0,
    fxSpreadPercent: 0,
    spanishLtvPercent: 0,
    spanishArrangementFeePercent: 0,
    spanishValuationEur: 0,
    spanishOtherMortgageCostsEur: 0,
    ukLoanGbp: 0,
    ukArrangementFeePercent: 0,
    ukOtherFeesGbp: 0,
    ibiAnnualEur: 0,
    communityAnnualEur: 0,
    basuraAnnualEur: 0,
    insuranceAnnualEur: 0,
    utilitiesAnnualEur: 0,
    cadastralValueEur: 0,
    annualRentEur: 0,
    postRenovationValueEur: 0,
    appreciationPercent: 0,
    holidayLetEnabled: false,
    offSeasonMonthlyRentEur: 0,
    agencyFeeMonths: 0,
    depositMonths: 0,
    tenantUtilitiesPerMonthEur: 0,
    tenantCleaningEur: 0,
    tenantInsuranceEur: 0,
    carHirePerMonthEur: 0,
    travelFlightsEur: 0,
    rentIncreasePercent: 0,
    vftSetupEur: 0,
    vftAnnualEur: 0,
    ...overrides,
  });
}

describe("off-season tenancy", () => {
  it("builds a season from rent, agency IVA and the other costs, and leaves the deposit out", () => {
    const inputs = bare({
      rentSeasonMonths: 7,
      offSeasonMonthlyRentEur: 2000,
      agencyFeeMonths: 1,
      agencyIvaPercent: 21,
      depositMonths: 2,
      tenantUtilitiesPerMonthEur: 100,
      tenantCleaningEur: 50,
      tenantInsuranceEur: 40,
      carHirePerMonthEur: 10,
      travelFlightsEur: 80,
      gbpPerEur: 0.8,
    });
    const season = seasonQuote(inputs, 0, 0.8);
    closeTo(season.rentEur, 14000);
    closeTo(season.agencyNetEur, 2000);
    closeTo(season.agencyIvaEur, 420);
    closeTo(season.agencyEur, 2420);
    closeTo(season.costEur, 17360);
    closeTo(season.depositEur, 4000);
    expect(season.costEur).not.toBeCloseTo(season.costEur + season.depositEur, 0);
    closeTo(season.effectiveMonthlyEur, 2480);
    closeTo(season.costGbp, 13888);
    closeTo(season.effectiveMonthlyGbp, 1984);
    closeTo(rentCostOverYears(inputs, 1), 17360);
  });

  it("keeps the season between 6 and 9 months and compounds later seasons", () => {
    const short = seasonQuote(bare({ rentSeasonMonths: 3, offSeasonMonthlyRentEur: 1000 }), 0, 1);
    const long = seasonQuote(bare({ rentSeasonMonths: 15, offSeasonMonthlyRentEur: 1000 }), 0, 1);
    expect(short.months).toBe(6);
    expect(long.months).toBe(9);
    closeTo(short.rentEur, 6000);
    closeTo(long.rentEur, 9000);

    const rising = bare({
      rentSeasonMonths: 7,
      offSeasonMonthlyRentEur: 1000,
      rentIncreasePercent: 10,
    });
    closeTo(seasonQuote(rising, 1, 1).costEur, 7700);
    const five = 7000 * ((1.1 ** 5 - 1) / 0.1);
    closeTo(rentCostOverYears(rising, 5), five);
  });

  it("uses the Costa del Sol off-season defaults", () => {
    const season = calculateSpainVilla(defaultSpainVilla()).tenancy;
    expect(season.months).toBe(7);
    closeTo(season.monthlyRentEur, 2500);
    closeTo(season.rentEur, 17500);
    closeTo(season.agencyEur, 3025);
    closeTo(season.utilitiesEur, 1750);
    closeTo(season.costEur, 23355);
    closeTo(season.effectiveMonthlyEur, 23355 / 7);
    closeTo(season.depositEur, 5000);
    closeTo(season.costGbp, 23355 * 0.86);
  });
});

describe("buying versus renting", () => {
  it("matches the repayment schedule's total interest", () => {
    const schedule = loanYearInterests(200000, 6, 30, 30);
    const loan = annuity(200000, 6, 30);
    closeTo(schedule.reduce((sum, year) => sum + year, 0), loan.totalInterest);
    expect(loanYearInterests(200000, 6, 30, 40).slice(30).every((year) => year === 0)).toBe(true);
  });

  it("nets the price off the end value and finds when buying costs less than renting", () => {
    const result = calculateSpainVilla(
      bare({
        itpPercent: 20,
        offSeasonMonthlyRentEur: 1000,
        rentSeasonMonths: 7,
      }),
    );
    const cash = result.comparison.options[0];
    closeTo(result.comparison.rentCostEur[0], 7000);
    closeTo(cash.costEur[0], 20000);
    closeTo(result.comparison.rentCostEur[1], 35000);
    closeTo(cash.costEur[1], 20000);
    expect(cash.breakevenYear).toBe(3);
  });

  it("subtracts appreciation, including a post-renovation value", () => {
    const grown = calculateSpainVilla(bare({ appreciationPercent: 10 }));
    closeTo(grown.comparison.options[0].costEur[0], -10000);

    const uplift = calculateSpainVilla(bare({ postRenovationValueEur: 150000 }));
    closeTo(uplift.comparison.startValueEur, 150000);
    closeTo(uplift.comparison.options[0].costEur[0], -50000);
  });

  it("adds only the interest for the years held, converted from pounds for a UK loan", () => {
    const inputs = bare({
      purchasePriceEur: 0,
      ukLoanGbp: 12000,
      ukRatePercent: 12,
      ukTermYears: 1,
      gbpPerEur: 0.5,
    });
    const result = calculateSpainVilla(inputs);
    const interestGbp = loanYearInterests(12000, 12, 1, 1)[0];
    closeTo(result.comparison.options[2].costEur[0], interestGbp / 0.5);
    closeTo(result.comparison.options[0].costEur[0], 0);
  });

  it("does not pretend buying becomes cheaper inside 40 years when rent is tiny", () => {
    const result = calculateSpainVilla(
      bare({
        itpPercent: 20,
        offSeasonMonthlyRentEur: 10,
        rentSeasonMonths: 6,
      }),
    );
    expect(result.comparison.options[0].breakevenYear).toBeNull();
  });
});

describe("peak-season holiday let", () => {
  it("reduces the net annual cost by the let, after management, IVA and non-resident tax", () => {
    const result = calculateSpainVilla(
      bare({
        holidayLetEnabled: true,
        holidayLetMonths: 2,
        holidayPeakMonthlyRentEur: 1000,
        holidayOccupancyPercent: 50,
        holidayManagementPercent: 20,
        holidayManagementIvaPercent: 21,
        irnrPercent: 24,
        annualRentEur: 99999,
      }),
    );
    closeTo(result.holidayLet.grossEur, 1000);
    closeTo(result.holidayLet.managementEur, 242);
    expect(result.running.irnrBasis).toBe("holidayLet");
    closeTo(result.running.irnrEur, 240);
    closeTo(result.running.rentEur, 1000);
    closeTo(result.running.netAnnualCostEur, 242 + 240 - 1000);
    closeTo(result.finance.spanish.netAnnualCostEur, result.running.netAnnualCostEur);
  });

  it("keeps imputed income on the months that are not offered", () => {
    const result = calculateSpainVilla(
      bare({
        holidayLetEnabled: true,
        holidayLetMonths: 6,
        holidayOccupancyPercent: 0,
        cadastralValueEur: 12000,
        imputationPercent: 10,
        irnrPercent: 10,
        annualRentEur: 50000,
      }),
    );
    closeTo(result.running.imputedIncomeEur, 1200);
    closeTo(result.running.irnrEur, 60);
    closeTo(result.running.netAnnualCostEur, 60);
  });

  it("charges the VFT registration once, and deducts only a share of interest when asked", () => {
    const setup = calculateSpainVilla(
      bare({
        holidayLetEnabled: true,
        holidayLetMonths: 0,
        vftSetupEur: 500,
        vftAnnualEur: 25,
      }),
    );
    closeTo(setup.running.netAnnualCostEur, 25);
    closeTo(setup.comparison.options[0].costEur[0], 525);
    closeTo(setup.comparison.options[0].costEur[1], 500 + 25 * 5);

    const letOut = calculateSpainVilla(
      bare({
        holidayLetEnabled: true,
        holidayLetMonths: 12,
        holidayPeakMonthlyRentEur: 10000 / 12,
        holidayOccupancyPercent: 100,
        holidayManagementPercent: 0,
        irnrPercent: 10,
        allowEuRentalDeductions: true,
        spanishLtvPercent: 100,
        spanishRatePercent: 12,
        spanishTermYears: 1,
      }),
    );
    const interest = letOut.finance.spanish.yearOneInterestEur;
    closeTo(letOut.holidayLet.grossEur, 10000);
    closeTo(letOut.finance.cash.irnrEur, 1000);
    closeTo(letOut.finance.spanish.irnrEur, Math.max(0, 10000 - interest) * 0.1);
    expect(letOut.finance.spanish.irnrEur).toBeLessThan(letOut.finance.cash.irnrEur);
  });
});

describe("saved villa JSON", () => {
  it("fills missing fields from the defaults and drops unknown enums", () => {
    const result = villaFromJson({
      purchasePriceEur: 400000,
      acquisitionType: "freehold",
      renovationMode: "both",
      label: "Hill villa",
      gbpPerEur: Number.NaN,
    });
    expect(result.purchasePriceEur).toBe(400000);
    expect(result.acquisitionType).toBe("resale");
    expect(result.renovationMode).toBe("both");
    expect(result.label).toBe("Hill villa");
    expect(result.gbpPerEur).toBe(defaultSpainVilla().gbpPerEur);
    expect(result.itpPercent).toBe(7);
    expect(result.rentSeasonMonths).toBe(7);
    expect(result.holidayLetEnabled).toBe(false);
    expect(result.offSeasonMonthlyRentEur).toBe(2500);
  });

  it("ignores a non-object payload", () => {
    expect(villaFromJson(null).purchasePriceEur).toBe(750000);
    expect(villaFromJson("nope").spanishLtvPercent).toBe(70);
  });
});
