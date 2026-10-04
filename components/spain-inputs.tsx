"use client";

import { eur, eurPence, fxQuote, money, moneyFromEur, moneyPence, percent } from "@/lib/format";
import { RENOVATION_ITEM_KEYS, RENOVATION_ITEM_LABELS, RENOVATION_TIERS } from "@/lib/spain/defaults";
import type { SpainVillaInputs, SpainVillaResult } from "@/lib/spain/types";
import { MoneyField, NoteBanner, PercentField, ResultRow, SectionCard, Segmented, Toggle } from "./fields";

function gbpNote(amount: number, rate: number): string {
  return moneyFromEur(amount, rate);
}

export function SpainInputs({
  inputs,
  result,
  onChange,
  onReset,
}: {
  inputs: SpainVillaInputs;
  result: SpainVillaResult;
  onChange: (next: SpainVillaInputs) => void;
  onReset: () => void;
}) {
  const set =
    <K extends keyof SpainVillaInputs>(key: K) =>
    (value: SpainVillaInputs[K]) =>
      onChange({ ...inputs, [key]: value });

  const price = inputs.purchasePriceEur;
  const deposit = result.finance.spanish.priceDepositEur ?? 0;
  const depositPct = price > 0 ? (deposit / price) * 100 : 0;
  const perM2 = inputs.renovationMode === "perM2" || inputs.renovationMode === "both";
  const lineItems = inputs.renovationMode === "lineItems" || inputs.renovationMode === "both";

  return (
    <div className="space-y-4 pb-10">
      <SectionCard title="Villa" subtitle="Euros, with pounds at the rate below">
        <label className="block text-sm">
          <span className="mb-1 block text-stone-600 dark:text-stone-300">Name</span>
          <input
            className="w-full rounded-md border border-stone-300 px-3 py-2 dark:border-stone-700 dark:bg-stone-950"
            value={inputs.label}
            onChange={(event) => onChange({ ...inputs, label: event.target.value })}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-stone-600 dark:text-stone-300">Area</span>
          <input
            className="w-full rounded-md border border-stone-300 px-3 py-2 dark:border-stone-700 dark:bg-stone-950"
            value={inputs.location}
            onChange={(event) => onChange({ ...inputs, location: event.target.value })}
          />
        </label>
        <MoneyField
          label="Purchase price"
          prefix="€"
          value={inputs.purchasePriceEur}
          min={0}
          onChange={set("purchasePriceEur")}
        />
        <ResultRow
          label="Purchase price in pounds"
          value={money(result.priceGbp)}
          note={result.gbpPerEur > 0 ? `${fxQuote(result.eurPerGbp)} euros per pound` : undefined}
        />
        <Segmented
          value={inputs.acquisitionType}
          onChange={set("acquisitionType")}
          options={[
            { value: "resale", label: "Resale" },
            { value: "newBuild", label: "New build" },
          ]}
        />
        <MoneyField
          label="EUR/GBP rate"
          prefix={null}
          suffix="£ / €"
          decimals
          min={0.0001}
          value={inputs.gbpPerEur}
          helper="Pounds for one euro. Replace the placeholder with a live rate."
          onChange={set("gbpPerEur")}
        />
        <PercentField
          label="Currency transfer spread"
          value={inputs.fxSpreadPercent}
          min={0}
          helper="Lost when you buy euros with pounds. Charged on the euros that finance option converts. A specialist is often under 1%; a high-street bank can be nearer 2–3%."
          onChange={set("fxSpreadPercent")}
        />
      </SectionCard>

      <SectionCard
        title="Purchase costs"
        subtitle="Percentages are of the purchase price. Estimates — confirm the current Andalucía rates."
      >
        {inputs.acquisitionType === "resale" ? (
          <PercentField
            label="ITP transfer tax"
            value={inputs.itpPercent}
            min={0}
            helper="Andalucía's general resale rate is 7%. A non-resident second home usually does not qualify for the reduced rates."
            onChange={set("itpPercent")}
          />
        ) : (
          <>
            <PercentField
              label="IVA"
              value={inputs.ivaPercent}
              min={0}
              helper="VAT on a new home is usually 10%. Some purchases are 21%."
              onChange={set("ivaPercent")}
            />
            <PercentField
              label="AJD stamp duty"
              value={inputs.ajdPercent}
              min={0}
              helper="About 1.2% is a common Andalucía figure for a new build. Confirm the current rate."
              onChange={set("ajdPercent")}
            />
          </>
        )}
        <PercentField
          label="Notary"
          value={inputs.notaryPercent}
          min={0}
          helper="Usual planning range is about 0.5–1% of the price."
          onChange={set("notaryPercent")}
        />
        <PercentField
          label="Land registry"
          value={inputs.landRegistryPercent}
          min={0}
          helper="Usual planning range is about 0.5–1% of the price."
          onChange={set("landRegistryPercent")}
        />
        <PercentField
          label="Lawyer"
          value={inputs.lawyerPercent}
          min={0}
          helper="Fee before IVA. About 1% of the price is a common allowance."
          onChange={set("lawyerPercent")}
        />
        <PercentField
          label="IVA on the lawyer"
          value={inputs.lawyerIvaPercent}
          min={0}
          helper="Charged on the lawyer's fee, not on the price."
          onChange={set("lawyerIvaPercent")}
        />
        <MoneyField
          label="NIE, bank and admin"
          prefix="€"
          value={inputs.nieAdminEur}
          min={0}
          helper="NIE, opening a bank account and small admin costs, as a lump sum."
          onChange={set("nieAdminEur")}
        />
        <MoneyField
          label="Survey"
          prefix="€"
          value={inputs.surveyEur}
          min={0}
          helper="Building survey, as a lump sum. The bank's own valuation sits with the Spanish mortgage."
          onChange={set("surveyEur")}
        />
        <PercentField
          label="Buyer's agent"
          value={inputs.buyersAgentPercent}
          min={0}
          helper="Leave at 0 if you are not using one. About 3% plus IVA is a common fee."
          onChange={set("buyersAgentPercent")}
        />
        <PercentField
          label="IVA on the buyer's agent"
          value={inputs.buyersAgentIvaPercent}
          min={0}
          helper="Charged on the agent fee. It does nothing while the fee is 0."
          onChange={set("buyersAgentIvaPercent")}
        />
        <ResultRow
          label={inputs.acquisitionType === "resale" ? "ITP" : "IVA and AJD"}
          value={eur(result.purchase.taxEur)}
          note={gbpNote(result.purchase.taxEur, result.gbpPerEur)}
          emphasis
        />
        <ResultRow
          label="Purchase costs"
          value={eur(result.purchase.costsExFxEur)}
          note={gbpNote(result.purchase.costsExFxEur, result.gbpPerEur)}
        />
        <ResultRow
          label="Total acquisition cost"
          value={eur(result.purchase.acquisitionExFxEur)}
          note="Price plus these costs, before currency transfer"
          emphasis
        />
      </SectionCard>

      <SectionCard
        title="Renovation"
        subtitle="Use €/m², line items, or both. Both adds the line items on top of the area rate."
      >
        <Segmented
          value={inputs.renovationMode}
          onChange={set("renovationMode")}
          options={[
            { value: "perM2", label: "€/m²" },
            { value: "lineItems", label: "Line items" },
            { value: "both", label: "Both" },
          ]}
        />
        {inputs.renovationMode === "both" ? (
          <NoteBanner text="Line items are added to the €/m² budget. Use Both only for work that is not already in the per-metre rate, or you will count it twice." />
        ) : null}
        {perM2 ? (
          <>
            <MoneyField
              label="Floor area"
              prefix={null}
              suffix="m²"
              integer
              min={0}
              value={inputs.floorAreaM2}
              onChange={set("floorAreaM2")}
            />
            <Segmented
              value={inputs.renovationTier}
              onChange={set("renovationTier")}
              options={RENOVATION_TIERS.map((tier) => ({ value: tier.id, label: tier.label }))}
            />
            {RENOVATION_TIERS.map((tier) => (
              <MoneyField
                key={tier.key}
                label={`${tier.label} €/m²`}
                prefix="€"
                suffix="/m²"
                min={0}
                value={inputs[tier.key]}
                helper={
                  inputs.renovationTier === tier.id
                    ? `${tier.hint} This is the rate being used.`
                    : tier.hint
                }
                onChange={set(tier.key)}
              />
            ))}
          </>
        ) : null}
        {lineItems ? (
          <>
            <p className="text-xs text-stone-500">
              Included in the works budget, so the architect fee, licence, contingency and IVA apply to them.
              Furnishing is in that budget too — remove it if you want furniture kept separate.
            </p>
            {RENOVATION_ITEM_KEYS.map((key) => (
              <MoneyField
                key={key}
                label={RENOVATION_ITEM_LABELS[key]}
                prefix="€"
                min={0}
                value={inputs[key]}
                onChange={set(key)}
              />
            ))}
          </>
        ) : null}
        <PercentField
          label="Architect and project manager"
          value={inputs.professionalFeePercent}
          min={0}
          helper="Percent of the works budget, before contingency and IVA. Often about 8–15% combined."
          onChange={set("professionalFeePercent")}
        />
        <PercentField
          label="Licencia / ICIO"
          value={inputs.icioPercent}
          min={0}
          helper="Licence and the municipal works tax, as a percent of the works budget. Many town halls charge up to about 4%. Contingency does not increase it here."
          onChange={set("icioPercent")}
        />
        <PercentField
          label="IVA on works"
          value={inputs.worksIvaPercent}
          min={0}
          helper="On the works, the professional fees and the contingency. 21% is the standard rate. A reduced 10% can apply to some renovations of a home."
          onChange={set("worksIvaPercent")}
        />
        <PercentField
          label="Contingency"
          value={inputs.contingencyPercent}
          min={0}
          helper="Percent of the works plus professional fees."
          onChange={set("contingencyPercent")}
        />
        <ResultRow
          label="Works budget"
          value={eur(result.renovation.worksEur)}
          note={gbpNote(result.renovation.worksEur, result.gbpPerEur)}
        />
        <ResultRow
          label="Total renovation"
          value={eur(result.renovation.totalEur)}
          note={gbpNote(result.renovation.totalEur, result.gbpPerEur)}
          emphasis
        />
      </SectionCard>

      <SectionCard
        title="Spanish mortgage"
        subtitle="Non-resident lending against the purchase price. Costs and the renovation stay in cash."
      >
        <PercentField
          label="LTV"
          value={inputs.spanishLtvPercent}
          min={0}
          max={100}
          helper="Often capped at 60–70% for a non-resident. The rest of the price is the deposit."
          onChange={set("spanishLtvPercent")}
        />
        {inputs.spanishLtvPercent > 70 ? (
          <NoteBanner text="Above 70% is outside what many Spanish lenders will offer a non-resident. The model still uses the LTV you enter, capped at the price." />
        ) : null}
        <Segmented
          value={inputs.spanishRateType}
          onChange={set("spanishRateType")}
          options={[
            { value: "fixed", label: "Fixed" },
            { value: "variable", label: "Variable" },
          ]}
        />
        <PercentField
          label="Rate"
          value={inputs.spanishRatePercent}
          min={0}
          helper={
            inputs.spanishRateType === "variable"
              ? "Illustrative rate. A variable deal will move with Euribor; the payment assumes this rate holds."
              : "Annual fixed rate, held for the whole term in this model."
          }
          onChange={set("spanishRatePercent")}
        />
        <MoneyField
          label="Term"
          prefix={null}
          suffix="years"
          integer
          min={1}
          max={40}
          value={inputs.spanishTermYears}
          onChange={set("spanishTermYears")}
        />
        <PercentField
          label="Arrangement fee"
          value={inputs.spanishArrangementFeePercent}
          min={0}
          helper="Percent of the loan, paid in cash. It is not added to the balance."
          onChange={set("spanishArrangementFeePercent")}
        />
        <MoneyField
          label="Bank valuation"
          prefix="€"
          value={inputs.spanishValuationEur}
          min={0}
          helper="The lender's tasación, usually paid by the buyer."
          onChange={set("spanishValuationEur")}
        />
        <MoneyField
          label="Other mortgage costs"
          prefix="€"
          value={inputs.spanishOtherMortgageCostsEur}
          min={0}
          helper="Notary, registry and gestoría on the mortgage are often the lender's cost. Leave at 0 until you know you will pay them, and add AJD here if it is yours."
          onChange={set("spanishOtherMortgageCostsEur")}
        />
        <ResultRow
          label="Deposit"
          value={eur(deposit)}
          note={`${percent(depositPct)} of the price · ${gbpNote(deposit, result.gbpPerEur)}`}
          emphasis
        />
        <ResultRow
          label="Loan"
          value={eur(result.finance.spanish.amountBorrowedEur)}
          note="Does not cover purchase costs or the renovation"
          emphasis
        />
        <ResultRow
          label="Monthly payment"
          value={eurPence(result.finance.spanish.monthlyPaymentEur)}
          note={
            result.gbpPerEur > 0
              ? moneyPence(result.finance.spanish.monthlyPaymentEur * result.gbpPerEur)
              : "—"
          }
        />
      </SectionCard>

      <SectionCard
        title="UK remortgage"
        subtitle="Pounds raised against UK property and converted. This is an alternative to the Spanish mortgage, not as well as it."
      >
        <MoneyField
          label="Amount to borrow"
          value={inputs.ukLoanGbp}
          min={0}
          helper="Euros available are this amount divided by the EUR/GBP rate."
          onChange={set("ukLoanGbp")}
        />
        <button
          type="button"
          className="rounded-md border border-stone-300 px-3 py-1.5 text-sm dark:border-stone-700"
          onClick={() =>
            onChange({
              ...inputs,
              ukLoanGbp: Math.round(inputs.purchasePriceEur * inputs.gbpPerEur),
            })
          }
        >
          Set to the purchase price
        </button>
        <ResultRow
          label="Euros from this loan"
          value={eur(result.finance.uk.amountBorrowedEur)}
          note={money(inputs.ukLoanGbp)}
        />
        <PercentField
          label="Rate"
          value={inputs.ukRatePercent}
          min={0}
          helper="Annual rate, held for the whole term in this model."
          onChange={set("ukRatePercent")}
        />
        <MoneyField
          label="Term"
          prefix={null}
          suffix="years"
          integer
          min={1}
          max={40}
          value={inputs.ukTermYears}
          onChange={set("ukTermYears")}
        />
        <PercentField
          label="Arrangement fee"
          value={inputs.ukArrangementFeePercent}
          min={0}
          helper="Percent of the sterling loan, paid in cash. It is not added to the balance."
          onChange={set("ukArrangementFeePercent")}
        />
        <MoneyField
          label="Other fees"
          value={inputs.ukOtherFeesGbp}
          min={0}
          helper="Valuation, legal and any other UK fees, as a lump sum."
          onChange={set("ukOtherFeesGbp")}
        />
        <ResultRow
          label="Monthly payment"
          value={moneyPence(result.finance.uk.monthlyPaymentGbp ?? 0)}
          note={eurPence(result.finance.uk.monthlyPaymentEur)}
        />
        <ResultRow
          label="Cash still required"
          value={eur(result.finance.uk.cashRequiredEur)}
          note={gbpNote(result.finance.uk.cashRequiredEur, result.gbpPerEur)}
          emphasis
        />
      </SectionCard>

      <SectionCard
        title="After the works"
        subtitle="Optional. Equity uses the value. The rent-or-buy comparison uses the value and the appreciation rate."
      >
        <MoneyField
          label="Post-renovation value"
          prefix="€"
          value={inputs.postRenovationValueEur}
          min={0}
          helper="What you think it would sell for once the works are done. Leave at 0 and the comparison grows the purchase price instead."
          onChange={set("postRenovationValueEur")}
        />
        <PercentField
          label="Appreciation per year"
          value={inputs.appreciationPercent}
          helper="Estimate only, not a forecast. Used when this page compares buying with renting."
          onChange={set("appreciationPercent")}
        />
      </SectionCard>

      <SectionCard
        title="Annual costs"
        subtitle="Optional. IBI follows the cadastral value, which is usually well below the price."
      >
        <MoneyField
          label="IBI per year"
          prefix="€"
          value={inputs.ibiAnnualEur}
          min={0}
          helper="Council tax. A placeholder, not a percentage of the purchase price."
          onChange={set("ibiAnnualEur")}
        />
        <MoneyField
          label="Community fees per year"
          prefix="€"
          value={inputs.communityAnnualEur}
          min={0}
          helper="Urbanisation or community. A villa can be far above or below this."
          onChange={set("communityAnnualEur")}
        />
        <MoneyField
          label="Basura per year"
          prefix="€"
          value={inputs.basuraAnnualEur}
          min={0}
          helper="Rubbish collection."
          onChange={set("basuraAnnualEur")}
        />
        <MoneyField
          label="Insurance per year"
          prefix="€"
          value={inputs.insuranceAnnualEur}
          min={0}
          onChange={set("insuranceAnnualEur")}
        />
        <MoneyField
          label="Utilities per year"
          prefix="€"
          value={inputs.utilitiesAnnualEur}
          min={0}
          helper="Power, water and the rest while you use the house."
          onChange={set("utilitiesAnnualEur")}
        />
        <MoneyField
          label="Cadastral value"
          prefix="€"
          value={inputs.cadastralValueEur}
          min={0}
          helper="Valor catastral, for imputed non-resident tax. The default is a placeholder at about 40% of the default price, not a lookup."
          onChange={set("cadastralValueEur")}
        />
        <PercentField
          label="Imputation rate"
          value={inputs.imputationPercent}
          min={0}
          helper="1.1% if the cadastral value was revised in the last 10 years, otherwise 2%."
          onChange={set("imputationPercent")}
        />
        <PercentField
          label="Non-resident tax rate"
          value={inputs.irnrPercent}
          min={0}
          helper="UK residents are generally 24%. EU and EEA residents are often 19%."
          onChange={set("irnrPercent")}
        />
        <Toggle
          label="Let it in the months you are away"
          subtitle="Peak-season holiday income. Andalucía requires a VFT tourist registration before a let is advertised."
          checked={inputs.holidayLetEnabled}
          onChange={set("holidayLetEnabled")}
        />
        {inputs.holidayLetEnabled ? (
          <>
            <MoneyField
              label="Months offered"
              prefix={null}
              suffix="months"
              integer
              min={0}
              max={12}
              value={inputs.holidayLetMonths}
              helper="The rest of the year still attracts imputed non-resident tax."
              onChange={set("holidayLetMonths")}
            />
            <MoneyField
              label="Peak rent per month"
              prefix="€"
              min={0}
              value={inputs.holidayPeakMonthlyRentEur}
              helper="What a peak month would bring if it were full. An estimate, not a booking."
              onChange={set("holidayPeakMonthlyRentEur")}
            />
            <PercentField
              label="Occupancy"
              value={inputs.holidayOccupancyPercent}
              min={0}
              max={100}
              helper="Share of those months you expect to be booked."
              onChange={set("holidayOccupancyPercent")}
            />
            <PercentField
              label="Management fee"
              value={inputs.holidayManagementPercent}
              min={0}
              helper="Percent of the gross, before IVA. Often about 15–25%."
              onChange={set("holidayManagementPercent")}
            />
            <PercentField
              label="IVA on the management fee"
              value={inputs.holidayManagementIvaPercent}
              min={0}
              onChange={set("holidayManagementIvaPercent")}
            />
            <MoneyField
              label="VFT registration"
              prefix="€"
              min={0}
              value={inputs.vftSetupEur}
              helper="One-off allowance for registering a vivienda con fines turísticos. You need the registration before you advertise."
              onChange={set("vftSetupEur")}
            />
            <MoneyField
              label="Tourist tax or compliance per year"
              prefix="€"
              min={0}
              value={inputs.vftAnnualEur}
              helper="Leave at 0 unless the town charges an ongoing tourist tax, or you pay someone to keep the registration."
              onChange={set("vftAnnualEur")}
            />
          </>
        ) : (
          <MoneyField
            label="Rent per year"
            prefix="€"
            value={inputs.annualRentEur}
            min={0}
            helper="Gross rent for a full year. Leave at 0 to model a home you do not let."
            onChange={set("annualRentEur")}
          />
        )}
        <Toggle
          label="Deduct running costs from the rent"
          subtitle="Off for a typical UK owner: tax is on gross rent. On for an EU/EEA-style net calculation. Depreciation is not included."
          checked={inputs.allowEuRentalDeductions}
          onChange={set("allowEuRentalDeductions")}
        />
      </SectionCard>

      <SectionCard
        title="Rent instead"
        subtitle="Take a villa as a tenant for the off season, instead of buying. Roughly October to May or June."
      >
        <label className="block text-sm">
          <span className="mb-1 flex items-center justify-between text-stone-600 dark:text-stone-300">
            <span>Months in the villa</span>
            <span className="tabular-nums">{result.tenancy.months}</span>
          </span>
          <input
            type="range"
            min={6}
            max={9}
            step={1}
            aria-valuemin={6}
            aria-valuemax={9}
            aria-valuenow={result.tenancy.months}
            value={result.tenancy.months}
            onChange={(event) => onChange({ ...inputs, rentSeasonMonths: Number(event.target.value) })}
            className="w-full accent-[var(--brand)]"
          />
          <span className="mt-1 block text-xs text-stone-500">Between 6 and 9 months.</span>
        </label>
        <MoneyField
          label="Off-season rent per month"
          prefix="€"
          min={0}
          value={inputs.offSeasonMonthlyRentEur}
          helper="Costa del Sol villa, out of season. €2,500 a month is a planning estimate, not a listing."
          onChange={set("offSeasonMonthlyRentEur")}
        />
        <MoneyField
          label="Deposit"
          prefix={null}
          suffix="months"
          integer
          min={0}
          max={6}
          value={inputs.depositMonths}
          helper="Usually 1 or 2 months, and it is refundable. It is not counted as a cost."
          onChange={set("depositMonths")}
        />
        <MoneyField
          label="Agency fee"
          prefix={null}
          suffix="months"
          integer
          min={0}
          value={inputs.agencyFeeMonths}
          helper="Often one month's rent, charged again each season. Set this to 0 if you pay the agency only once."
          onChange={set("agencyFeeMonths")}
        />
        <PercentField
          label="IVA on the agency fee"
          value={inputs.agencyIvaPercent}
          min={0}
          onChange={set("agencyIvaPercent")}
        />
        <MoneyField
          label="Utilities and internet per month"
          prefix="€"
          min={0}
          value={inputs.tenantUtilitiesPerMonthEur}
          onChange={set("tenantUtilitiesPerMonthEur")}
        />
        <MoneyField
          label="Cleaning for the season"
          prefix="€"
          min={0}
          value={inputs.tenantCleaningEur}
          onChange={set("tenantCleaningEur")}
        />
        <MoneyField
          label="Insurance for the season"
          prefix="€"
          min={0}
          value={inputs.tenantInsuranceEur}
          onChange={set("tenantInsuranceEur")}
        />
        <MoneyField
          label="Car hire per month"
          prefix="€"
          min={0}
          value={inputs.carHirePerMonthEur}
          helper="Leave at 0 if you will not hire a car."
          onChange={set("carHirePerMonthEur")}
        />
        <MoneyField
          label="Travel and flights for the season"
          prefix="€"
          min={0}
          value={inputs.travelFlightsEur}
          helper="A lump sum for the season. An estimate — replace it with the fares you actually expect."
          onChange={set("travelFlightsEur")}
        />
        <PercentField
          label="Annual rent increase"
          value={inputs.rentIncreasePercent}
          helper="Applied each year to the rent, the agency fee and the other seasonal costs."
          onChange={set("rentIncreasePercent")}
        />
        <ResultRow
          label="Season cost"
          value={eur(result.tenancy.costEur)}
          note={gbpNote(result.tenancy.costEur, result.gbpPerEur)}
          emphasis
        />
        <ResultRow
          label="Effective monthly cost"
          value={eurPence(result.tenancy.effectiveMonthlyEur)}
          note={moneyPence(result.tenancy.effectiveMonthlyGbp)}
        />
      </SectionCard>

      <div>
        <button
          type="button"
          className="rounded-md border border-stone-300 px-4 py-2 text-sm dark:border-stone-700"
          onClick={onReset}
        >
          Reset estimates
        </button>
        <p className="mt-2 text-xs text-stone-500">Restores the Andalucía planning defaults on this page.</p>
      </div>
    </div>
  );
}
