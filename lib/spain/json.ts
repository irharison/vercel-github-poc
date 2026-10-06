import { defaultSpainVilla } from "./defaults";
import type {
  AcquisitionType,
  MortgageRateType,
  RenovationMode,
  RenovationTier,
  SpainVillaInputs,
  TaxBand,
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

function optionalNum(value: unknown, fallback: number | null): number | null {
  if (value == null) return fallback;
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function irpfBands(value: unknown, fallback: TaxBand[]): TaxBand[] {
  if (!Array.isArray(value) || value.length === 0) return fallback;
  const bands: TaxBand[] = [];
  for (const item of value) {
    if (item == null || typeof item !== "object") return fallback;
    const row = item as Record<string, unknown>;
    if (typeof row.rate !== "number" || !Number.isFinite(row.rate)) return fallback;
    if (row.upTo == null) bands.push({ upTo: null, rate: row.rate });
    else if (typeof row.upTo === "number" && Number.isFinite(row.upTo)) bands.push({ upTo: row.upTo, rate: row.rate });
    else return fallback;
  }
  return bands;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

export function villaFromJson(raw: unknown): SpainVillaInputs {
  const d = defaultSpainVilla();
  const j = (raw ?? {}) as Record<string, unknown>;
  const acquisition = ["resale", "newBuild"] as const satisfies readonly AcquisitionType[];
  const mode = ["perM2", "lineItems", "both"] as const satisfies readonly RenovationMode[];
  const tier = ["light", "medium", "full"] as const satisfies readonly RenovationTier[];
  const rateType = ["fixed", "variable"] as const satisfies readonly MortgageRateType[];

  return {
    label: str(j.label, d.label),
    location: str(j.location, d.location),
    purchasePriceEur: num(j.purchasePriceEur, d.purchasePriceEur),
    acquisitionType: oneOf(j.acquisitionType, acquisition, d.acquisitionType),
    itpPercent: num(j.itpPercent, d.itpPercent),
    ivaPercent: num(j.ivaPercent, d.ivaPercent),
    ajdPercent: num(j.ajdPercent, d.ajdPercent),
    notaryPercent: num(j.notaryPercent, d.notaryPercent),
    landRegistryPercent: num(j.landRegistryPercent, d.landRegistryPercent),
    lawyerPercent: num(j.lawyerPercent, d.lawyerPercent),
    lawyerIvaPercent: num(j.lawyerIvaPercent, d.lawyerIvaPercent),
    nieAdminEur: num(j.nieAdminEur, d.nieAdminEur),
    surveyEur: num(j.surveyEur, d.surveyEur),
    buyersAgentPercent: num(j.buyersAgentPercent, d.buyersAgentPercent),
    buyersAgentIvaPercent: num(j.buyersAgentIvaPercent, d.buyersAgentIvaPercent),
    fxSpreadPercent: num(j.fxSpreadPercent, d.fxSpreadPercent),
    gbpPerEur: num(j.gbpPerEur, d.gbpPerEur),
    floorAreaM2: num(j.floorAreaM2, d.floorAreaM2),
    renovationMode: oneOf(j.renovationMode, mode, d.renovationMode),
    renovationTier: oneOf(j.renovationTier, tier, d.renovationTier),
    lightEurPerM2: num(j.lightEurPerM2, d.lightEurPerM2),
    mediumEurPerM2: num(j.mediumEurPerM2, d.mediumEurPerM2),
    fullEurPerM2: num(j.fullEurPerM2, d.fullEurPerM2),
    kitchenEur: num(j.kitchenEur, d.kitchenEur),
    bathroomsEur: num(j.bathroomsEur, d.bathroomsEur),
    poolEur: num(j.poolEur, d.poolEur),
    roofEur: num(j.roofEur, d.roofEur),
    servicesEur: num(j.servicesEur, d.servicesEur),
    windowsEur: num(j.windowsEur, d.windowsEur),
    landscapingEur: num(j.landscapingEur, d.landscapingEur),
    furnishingEur: num(j.furnishingEur, d.furnishingEur),
    professionalFeePercent: num(j.professionalFeePercent, d.professionalFeePercent),
    icioPercent: num(j.icioPercent, d.icioPercent),
    worksIvaPercent: num(j.worksIvaPercent, d.worksIvaPercent),
    contingencyPercent: num(j.contingencyPercent, d.contingencyPercent),
    spanishLtvPercent: num(j.spanishLtvPercent, d.spanishLtvPercent),
    spanishRatePercent: num(j.spanishRatePercent, d.spanishRatePercent),
    spanishRateType: oneOf(j.spanishRateType, rateType, d.spanishRateType),
    spanishTermYears: num(j.spanishTermYears, d.spanishTermYears),
    spanishArrangementFeePercent: num(j.spanishArrangementFeePercent, d.spanishArrangementFeePercent),
    spanishValuationEur: num(j.spanishValuationEur, d.spanishValuationEur),
    spanishOtherMortgageCostsEur: num(j.spanishOtherMortgageCostsEur, d.spanishOtherMortgageCostsEur),
    ukLoanGbp: num(j.ukLoanGbp, d.ukLoanGbp),
    ukRatePercent: num(j.ukRatePercent, d.ukRatePercent),
    ukTermYears: num(j.ukTermYears, d.ukTermYears),
    ukArrangementFeePercent: num(j.ukArrangementFeePercent, d.ukArrangementFeePercent),
    ukOtherFeesGbp: num(j.ukOtherFeesGbp, d.ukOtherFeesGbp),
    postRenovationValueEur: num(j.postRenovationValueEur, d.postRenovationValueEur),
    ibiAnnualEur: num(j.ibiAnnualEur, d.ibiAnnualEur),
    communityAnnualEur: num(j.communityAnnualEur, d.communityAnnualEur),
    basuraAnnualEur: num(j.basuraAnnualEur, d.basuraAnnualEur),
    insuranceAnnualEur: num(j.insuranceAnnualEur, d.insuranceAnnualEur),
    utilitiesAnnualEur: num(j.utilitiesAnnualEur, d.utilitiesAnnualEur),
    cadastralValueEur: num(j.cadastralValueEur, d.cadastralValueEur),
    imputationPercent: num(j.imputationPercent, d.imputationPercent),
    irnrPercent: num(j.irnrPercent, d.irnrPercent),
    annualRentEur: num(j.annualRentEur, d.annualRentEur),
    allowEuRentalDeductions: bool(j.allowEuRentalDeductions, d.allowEuRentalDeductions),
    holidayLetEnabled: bool(j.holidayLetEnabled, d.holidayLetEnabled),
    holidayLetMonths: num(j.holidayLetMonths, d.holidayLetMonths),
    holidayPeakMonthlyRentEur: num(j.holidayPeakMonthlyRentEur, d.holidayPeakMonthlyRentEur),
    holidayOccupancyPercent: num(j.holidayOccupancyPercent, d.holidayOccupancyPercent),
    holidayManagementPercent: num(j.holidayManagementPercent, d.holidayManagementPercent),
    holidayManagementIvaPercent: num(j.holidayManagementIvaPercent, d.holidayManagementIvaPercent),
    vftSetupEur: num(j.vftSetupEur, d.vftSetupEur),
    vftAnnualEur: num(j.vftAnnualEur, d.vftAnnualEur),
    appreciationPercent: num(j.appreciationPercent, d.appreciationPercent),
    rentSeasonMonths: num(j.rentSeasonMonths, d.rentSeasonMonths),
    offSeasonMonthlyRentEur: num(j.offSeasonMonthlyRentEur, d.offSeasonMonthlyRentEur),
    depositMonths: num(j.depositMonths, d.depositMonths),
    agencyFeeMonths: num(j.agencyFeeMonths, d.agencyFeeMonths),
    agencyIvaPercent: num(j.agencyIvaPercent, d.agencyIvaPercent),
    tenantUtilitiesPerMonthEur: num(j.tenantUtilitiesPerMonthEur, d.tenantUtilitiesPerMonthEur),
    tenantCleaningEur: num(j.tenantCleaningEur, d.tenantCleaningEur),
    tenantInsuranceEur: num(j.tenantInsuranceEur, d.tenantInsuranceEur),
    carHirePerMonthEur: num(j.carHirePerMonthEur, d.carHirePerMonthEur),
    travelFlightsEur: num(j.travelFlightsEur, d.travelFlightsEur),
    rentIncreasePercent: num(j.rentIncreasePercent, d.rentIncreasePercent),
    digitalNomad: bool(j.digitalNomad, d.digitalNomad),
    nomadVisaFeeEur: num(j.nomadVisaFeeEur, d.nomadVisaFeeEur),
    nomadTieEur: num(j.nomadTieEur, d.nomadTieEur),
    nomadTranslationsEur: num(j.nomadTranslationsEur, d.nomadTranslationsEur),
    nomadCriminalRecordEur: num(j.nomadCriminalRecordEur, d.nomadCriminalRecordEur),
    nomadLawyerEur: num(j.nomadLawyerEur, d.nomadLawyerEur),
    nomadHealthAnnualEur: num(j.nomadHealthAnnualEur, d.nomadHealthAnnualEur),
    nomadRenewalEur: num(j.nomadRenewalEur, d.nomadRenewalEur),
    nomadRenewalEveryYears: num(j.nomadRenewalEveryYears, d.nomadRenewalEveryYears),
    remoteIncomeEur: num(j.remoteIncomeEur, d.remoteIncomeEur),
    incomeThresholdEur: num(j.incomeThresholdEur, d.incomeThresholdEur),
    irpfAllowanceEur: num(j.irpfAllowanceEur, d.irpfAllowanceEur),
    irpfBands: irpfBands(j.irpfBands, d.irpfBands),
    beckhamEligible: bool(j.beckhamEligible, d.beckhamEligible),
    beckhamRatePercent: num(j.beckhamRatePercent, d.beckhamRatePercent),
    beckhamCapEur: num(j.beckhamCapEur, d.beckhamCapEur),
    beckhamExcessRatePercent: num(j.beckhamExcessRatePercent, d.beckhamExcessRatePercent),
    beckhamYears: num(j.beckhamYears, d.beckhamYears),
    ukResidentTaxGbp: optionalNum(j.ukResidentTaxGbp, d.ukResidentTaxGbp),
  };
}
