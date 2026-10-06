"use client";

import { eur, eurPence, money, moneyFromEur } from "@/lib/format";
import { spainHelp } from "@/lib/help/spain";
import type { SpainVillaInputs, SpainVillaResult, TaxBand } from "@/lib/spain/types";
import { MoneyField, NoteBanner, OptionalMoneyField, PercentField, ResultRow, SectionCard, Toggle } from "./fields";
import { InfoTip } from "./info-tip";

export function SpainResidencyInputs({
  inputs,
  result,
  onChange,
}: {
  inputs: SpainVillaInputs;
  result: SpainVillaResult;
  onChange: (next: SpainVillaInputs) => void;
}) {
  const set =
    <K extends keyof SpainVillaInputs>(key: K) =>
    (value: SpainVillaInputs[K]) =>
      onChange({ ...inputs, [key]: value });
  const residency = result.residency;

  function setBand(index: number, patch: Partial<TaxBand>) {
    const irpfBands = inputs.irpfBands.map((band, bandIndex) =>
      bandIndex === index ? { ...band, ...patch } : band,
    );
    onChange({ ...inputs, irpfBands });
  }

  return (
    <SectionCard
      title="Digital nomad visa"
      subtitle="Off keeps you a non-resident. On adds the cost of living in Spain on this visa and treats the villa as a resident's main home."
    >
      <NoteBanner text={spainHelp.goldenVisa} />
      <Toggle
        label="Live in Spain on a digital nomad visa"
        subtitle="Estimates for the application and for tax residency. Not a golden visa, and not a tax saving on the purchase."
        info={spainHelp.nomad}
        checked={inputs.digitalNomad}
        onChange={set("digitalNomad")}
      />
      {inputs.digitalNomad ? (
        <>
          <p className="text-xs text-stone-500">
            One-off costs are paid at the start. Health insurance is every year. The renewal is spread across the
            years between renewals.
          </p>
          <MoneyField
            label="Visa and application fees"
            prefix="€"
            min={0}
            value={inputs.nomadVisaFeeEur}
            helper="Consular visa and the residence application. An estimate."
            info={spainHelp.nomadVisaFee}
            onChange={set("nomadVisaFeeEur")}
          />
          <MoneyField
            label="TIE card"
            prefix="€"
            min={0}
            value={inputs.nomadTieEur}
            helper="The card fee. An estimate."
            info={spainHelp.nomadTie}
            onChange={set("nomadTieEur")}
          />
          <MoneyField
            label="Translations and apostilles"
            prefix="€"
            min={0}
            value={inputs.nomadTranslationsEur}
            helper="An estimate for the documents the application asks for."
            info={spainHelp.nomadTranslations}
            onChange={set("nomadTranslationsEur")}
          />
          <MoneyField
            label="Criminal record check"
            prefix="€"
            min={0}
            value={inputs.nomadCriminalRecordEur}
            helper="An estimate, before any apostille you have not already included above."
            info={spainHelp.nomadCriminal}
            onChange={set("nomadCriminalRecordEur")}
          />
          <MoneyField
            label="Gestor or immigration lawyer"
            prefix="€"
            min={0}
            value={inputs.nomadLawyerEur}
            helper="The first application. An estimate."
            info={spainHelp.nomadLawyer}
            onChange={set("nomadLawyerEur")}
          />
          <MoneyField
            label="Private health insurance per year"
            prefix="€"
            min={0}
            value={inputs.nomadHealthAnnualEur}
            helper="Full cover with no copays. An estimate."
            info={spainHelp.nomadHealth}
            onChange={set("nomadHealthAnnualEur")}
          />
          <MoneyField
            label="Renewal cost"
            prefix="€"
            min={0}
            value={inputs.nomadRenewalEur}
            helper="Fees and help at each renewal, not every year. An estimate."
            info={spainHelp.nomadRenewal}
            onChange={set("nomadRenewalEur")}
          />
          <MoneyField
            label="Years between renewals"
            prefix={null}
            suffix="years"
            integer
            min={1}
            max={10}
            value={inputs.nomadRenewalEveryYears}
            info={spainHelp.nomadRenewal}
            onChange={set("nomadRenewalEveryYears")}
          />
          <ResultRow
            label="One-off visa costs"
            value={eur(residency.oneOffEur)}
            note={moneyFromEur(residency.oneOffEur, result.gbpPerEur)}
            info={spainHelp.nomadOneOff}
            emphasis
          />
          <ResultRow
            label="Annual visa costs"
            value={eur(residency.annualEur)}
            note={`Health insurance plus the renewal spread over ${residency.renewalEveryYears} years`}
            info={spainHelp.nomadAnnual}
            emphasis
          />
          <MoneyField
            label="Remote-work income per year"
            prefix="€"
            min={0}
            value={inputs.remoteIncomeEur}
            helper="Gross, before tax. The default is an example."
            info={spainHelp.nomadIncome}
            onChange={set("remoteIncomeEur")}
          />
          <MoneyField
            label="Income threshold per year"
            prefix="€"
            min={0}
            value={inputs.incomeThresholdEur}
            helper={`About ${eur(residency.thresholdMonthlyEur)} a month. Roughly 200% of the minimum wage. An estimate.`}
            info={spainHelp.nomadThreshold}
            onChange={set("incomeThresholdEur")}
          />
          <div
            role="status"
            className={`flex items-start rounded-lg px-3 py-2 text-sm ${
              residency.incomeTestPassed
                ? "bg-emerald-50 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100"
                : "bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100"
            }`}
          >
            <p>
              <span className="font-medium">
                {residency.incomeTestPassed ? "Passes the income test" : "Below the income threshold"}
              </span>
              {` — ${eur(residency.incomeEur)} a year against ${eur(residency.thresholdEur)}.`}
              <InfoTip label="Income test" text={spainHelp.nomadIncomeTest} />
            </p>
          </div>
          <MoneyField
            label="IRPF personal allowance"
            prefix="€"
            min={0}
            value={inputs.irpfAllowanceEur}
            helper="Deducted before the bands. An estimate."
            info={spainHelp.irpfAllowance}
            onChange={set("irpfAllowanceEur")}
          />
          <div className="flex items-center text-sm text-stone-600 dark:text-stone-300">
            <span>Combined state and Andalucía bands</span>
          </div>
          {inputs.irpfBands.map((band, index) => (
            <div key={index} className="grid grid-cols-2 gap-2">
              {band.upTo == null ? (
                <p className="self-end pb-2 text-sm text-stone-500">Above the previous band</p>
              ) : (
                <MoneyField
                  label={index === 0 ? "Band up to" : `Band ${index + 1} up to`}
                  prefix="€"
                  min={0}
                  value={band.upTo}
                  info={spainHelp.irpf}
                  onChange={(upTo) => setBand(index, { upTo })}
                />
              )}
              <PercentField
                label={index === 0 ? "Band rate" : `Band ${index + 1} rate`}
                min={0}
                value={band.rate}
                info={spainHelp.irpf}
                onChange={(rate) => setBand(index, { rate })}
              />
            </div>
          ))}
          <ResultRow
            label="Spanish resident tax (IRPF)"
            value={eur(residency.irpfEur)}
            note="On the remote-work income, after the allowance"
            info={spainHelp.irpf}
            emphasis
          />
          <Toggle
            label="Eligible for the Beckham regime"
            subtitle="On only if you were not Spanish tax resident in the previous five years."
            info={spainHelp.beckhamEligible}
            checked={inputs.beckhamEligible}
            onChange={set("beckhamEligible")}
          />
          <PercentField
            label="Beckham rate"
            min={0}
            value={inputs.beckhamRatePercent}
            helper="Flat rate on employment income up to the cap."
            info={spainHelp.beckham}
            onChange={set("beckhamRatePercent")}
          />
          <MoneyField
            label="Beckham cap"
            prefix="€"
            min={0}
            value={inputs.beckhamCapEur}
            info={spainHelp.beckham}
            onChange={set("beckhamCapEur")}
          />
          <PercentField
            label="Beckham rate above the cap"
            min={0}
            value={inputs.beckhamExcessRatePercent}
            info={spainHelp.beckham}
            onChange={set("beckhamExcessRatePercent")}
          />
          <MoneyField
            label="Beckham years"
            prefix={null}
            suffix="years"
            integer
            min={1}
            max={10}
            value={inputs.beckhamYears}
            helper="The year you arrive, plus the following five years."
            info={spainHelp.beckham}
            onChange={set("beckhamYears")}
          />
          <ResultRow
            label="Beckham tax"
            value={residency.beckhamEur == null ? "—" : eur(residency.beckhamEur)}
            note={
              residency.beckhamEur == null
                ? "Not eligible on the switch above"
                : `For ${residency.beckhamYears} years, then IRPF. Not added to the villa cost.`
            }
            info={spainHelp.beckham}
            emphasis
          />
          <OptionalMoneyField
            label="UK income tax if you stay UK resident"
            value={inputs.ukResidentTaxGbp}
            helper="Leave blank until you have worked it out. This is not calculated."
            info={spainHelp.ukResidentTax}
            onChange={set("ukResidentTaxGbp")}
          />
          <ResultRow
            label="UK resident tax"
            value={residency.ukTaxGbp == null ? "—" : money(residency.ukTaxGbp)}
            note={residency.ukTaxEur == null ? "Not entered" : eur(residency.ukTaxEur)}
            info={spainHelp.ukResidentTax}
          />
          <NoteBanner text={spainHelp.residencyTaxNote} />
        </>
      ) : null}
    </SectionCard>
  );
}

export function SpainResidencySummary({ result }: { result: SpainVillaResult }) {
  const { residency, gbpPerEur } = result;
  if (!residency.enabled) return null;
  return (
    <SectionCard
      title="Digital nomad visa"
      subtitle="Visa costs are in the annual cost and in both sides of the rent-or-buy table. Salary tax is shown here and is not added to the villa."
    >
      <ResultRow
        label="One-off visa costs"
        value={eur(residency.oneOffEur)}
        note={`Year one · ${moneyFromEur(residency.oneOffEur, gbpPerEur)}`}
        info={spainHelp.nomadOneOff}
        emphasis
      />
      <ResultRow
        label="Annual visa costs"
        value={eur(residency.annualEur)}
        note={moneyFromEur(residency.annualEur, gbpPerEur)}
        info={spainHelp.nomadAnnual}
        emphasis
      />
      <ResultRow
        label="Income test"
        value={residency.incomeTestPassed ? "Pass" : "Fail"}
        note={`${eur(residency.incomeEur)} against ${eur(residency.thresholdEur)} (about ${eurPence(residency.thresholdMonthlyEur)} a month)`}
        info={spainHelp.nomadIncomeTest}
        emphasis
      />
      <ResultRow
        label="Spanish resident tax (IRPF)"
        value={eur(residency.irpfEur)}
        note="Remote-work income only"
        info={spainHelp.irpf}
      />
      <ResultRow
        label="Beckham tax"
        value={residency.beckhamEur == null ? "—" : eur(residency.beckhamEur)}
        note={
          residency.beckhamEur == null
            ? "Not eligible"
            : `${residency.beckhamYears} years, then the IRPF figure`
        }
        info={spainHelp.beckham}
      />
      <ResultRow
        label="Stay UK resident"
        value={residency.ukTaxGbp == null ? "—" : money(residency.ukTaxGbp)}
        note={residency.ukTaxEur == null ? "Enter the UK tax to compare" : eur(residency.ukTaxEur)}
        info={spainHelp.ukResidentTax}
      />
      <NoteBanner text={spainHelp.residencyTaxNote} />
    </SectionCard>
  );
}
