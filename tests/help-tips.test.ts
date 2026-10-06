import { describe, expect, it } from "vitest";
import { dealHelp } from "@/lib/help/deal";
import { spainHelp, type SpainHelpKey } from "@/lib/help/spain";

const spainKeys: SpainHelpKey[] = [
  "itp",
  "iva",
  "ajd",
  "notary",
  "landRegistry",
  "lawyer",
  "nie",
  "fx",
  "renovationTiers",
  "icio",
  "worksIva",
  "contingency",
  "cash",
  "spanishMortgage",
  "ukRemortgage",
  "ltv",
  "mortgageDeposit",
  "arrangement",
  "monthlyPayment",
  "totalInterest",
  "totalCost",
  "ibi",
  "community",
  "basura",
  "irnr",
  "vft",
  "occupancy",
  "management",
  "rentDeposit",
  "agency",
  "comparison",
  "appreciation",
  "breakeven",
  "nomad",
  "goldenVisa",
  "nomadVisaFee",
  "nomadTie",
  "nomadTranslations",
  "nomadCriminal",
  "nomadLawyer",
  "nomadHealth",
  "nomadRenewal",
  "nomadIncome",
  "nomadThreshold",
  "nomadIncomeTest",
  "nomadOneOff",
  "nomadAnnual",
  "irpf",
  "irpfAllowance",
  "beckham",
  "beckhamEligible",
  "ukResidentTax",
  "residencyTaxNote",
  "irnrResident",
];

const advisorKeys: SpainHelpKey[] = [
  "itp",
  "iva",
  "ajd",
  "notary",
  "landRegistry",
  "lawyer",
  "nie",
  "icio",
  "worksIva",
  "irnr",
  "vft",
  "ltv",
  "nomad",
  "irpf",
  "beckham",
  "irnrResident",
];

describe("Spain villa explanations", () => {
  it("covers every figure the screen explains", () => {
    for (const key of spainKeys) {
      expect(spainHelp[key].length).toBeGreaterThan(80);
    }
  });

  it("tells the reader to check tax and lending figures", () => {
    for (const key of advisorKeys) {
      expect(spainHelp[key].toLowerCase()).toMatch(/lawyer|gestor|lender|adviser/);
    }
  });

  it("keeps the tenant deposit out of the cost, and the mortgage deposit separate", () => {
    expect(spainHelp.rentDeposit.toLowerCase()).toMatch(/not part of the season cost/);
    expect(spainHelp.mortgageDeposit.toLowerCase()).toMatch(/not the same as a tenant/);
  });
});

describe("Deal explanations", () => {
  it("covers the main deal fields", () => {
    for (const text of Object.values(dealHelp)) {
      expect(text.length).toBeGreaterThan(40);
    }
  });

  it("points stamp duty and the sale tax back to HMRC", () => {
    expect(dealHelp.sdlt).toMatch(/HMRC/);
    expect(dealHelp.gainTax).toMatch(/HMRC/);
  });
});
