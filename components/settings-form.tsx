"use client";

import { useDeal } from "./deal-provider";
import { MoneyField, NoteBanner, PercentField, SectionCard, Segmented, Toggle } from "./fields";

export function SettingsForm() {
  const { settings, updateSettings, resetSettings, worker, updateWorker } = useDeal();
  const s = settings;

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-10">
      <NoteBanner text="These figures are seeded defaults, not authority. Verify them against HMRC and your lender — they change with every Budget." />

      <SectionCard title="Ownership" subtitle="Determines which tax applies to profit and to the gain">
        <Segmented
          value={s.tax.ownership}
          onChange={(ownership) => updateSettings({ ...s, tax: { ...s.tax, ownership } })}
          options={[
            { value: "limitedCompany", label: "Limited co" },
            { value: "personal", label: "Personal" },
          ]}
        />
        <p className="text-sm text-stone-600 dark:text-stone-300">
          {s.tax.ownership === "limitedCompany"
            ? "A company pays Corporation Tax on rental profit and on the gain. There is no CGT annual exemption and no residential CGT rate."
            : "Personal ownership pays Income Tax on rental profit and CGT on the gain, after the annual exempt amount."}
        </p>
      </SectionCard>

      <SectionCard title="Stamp duty">
        {s.sdlt.bands.map((band, index) => (
          <div key={index} className="grid grid-cols-2 gap-2">
            <MoneyField
              label={band.upTo == null ? "And above" : "Up to"}
              value={band.upTo ?? 0}
              onChange={(upTo) => {
                const bands = s.sdlt.bands.map((item, i) =>
                  i === index ? { ...item, upTo: band.upTo == null ? null : upTo } : item,
                );
                updateSettings({ ...s, sdlt: { ...s.sdlt, bands } });
              }}
            />
            <PercentField
              label="Rate"
              value={band.rate}
              onChange={(rate) => {
                const bands = s.sdlt.bands.map((item, i) => (i === index ? { ...item, rate } : item));
                updateSettings({ ...s, sdlt: { ...s.sdlt, bands } });
              }}
            />
          </div>
        ))}
        <PercentField
          label="Additional dwelling surcharge"
          value={s.sdlt.additionalDwellingSurcharge}
          onChange={(additionalDwellingSurcharge) =>
            updateSettings({ ...s, sdlt: { ...s.sdlt, additionalDwellingSurcharge } })
          }
        />
        <MoneyField
          label="Surcharge minimum price"
          value={s.sdlt.surchargeMinPrice}
          onChange={(surchargeMinPrice) => updateSettings({ ...s, sdlt: { ...s.sdlt, surchargeMinPrice } })}
        />
        <PercentField
          label="Non-resident surcharge"
          value={s.sdlt.nonResidentSurcharge}
          onChange={(nonResidentSurcharge) => updateSettings({ ...s, sdlt: { ...s.sdlt, nonResidentSurcharge } })}
        />
        <Toggle
          label="Apply company flat rate"
          subtitle="Usually off because a rental business claims relief"
          checked={s.sdlt.applyCompanyFlatRate}
          onChange={(applyCompanyFlatRate) => updateSettings({ ...s, sdlt: { ...s.sdlt, applyCompanyFlatRate } })}
        />
      </SectionCard>

      <SectionCard title="Default mortgage terms">
        <PercentField label="Maximum LTV" value={s.lending.maxLtv} onChange={(maxLtv) => updateSettings({ ...s, lending: { ...s.lending, maxLtv } })} />
        <MoneyField label="Interest cover ratio" value={s.lending.interestCoverRatio} prefix={null} suffix="×" decimals onChange={(interestCoverRatio) => updateSettings({ ...s, lending: { ...s.lending, interestCoverRatio } })} />
        <PercentField label="Stress rate" value={s.lending.stressRate} onChange={(stressRate) => updateSettings({ ...s, lending: { ...s.lending, stressRate } })} />
        <PercentField label="Pay rate" value={s.lending.payRate} onChange={(payRate) => updateSettings({ ...s, lending: { ...s.lending, payRate } })} />
        <PercentField label="Arrangement fee" value={s.lending.arrangementFeePercent} onChange={(arrangementFeePercent) => updateSettings({ ...s, lending: { ...s.lending, arrangementFeePercent } })} />
        <Toggle label="Add arrangement fee to the loan" checked={s.lending.arrangementFeeAddedToLoan} onChange={(arrangementFeeAddedToLoan) => updateSettings({ ...s, lending: { ...s.lending, arrangementFeeAddedToLoan } })} />
        <MoneyField label="Broker fee" value={s.lending.brokerFee} onChange={(brokerFee) => updateSettings({ ...s, lending: { ...s.lending, brokerFee } })} />
        <PercentField label="Early repayment charge" value={s.lending.earlyRepaymentChargePercent} onChange={(earlyRepaymentChargePercent) => updateSettings({ ...s, lending: { ...s.lending, earlyRepaymentChargePercent } })} />
        <Toggle label="Lend against the purchase price" subtitle="Off means lend against the valuation" checked={s.lending.lendOnPurchasePriceNotValuation} onChange={(lendOnPurchasePriceNotValuation) => updateSettings({ ...s, lending: { ...s.lending, lendOnPurchasePriceNotValuation } })} />
      </SectionCard>

      <SectionCard title="Corporation Tax / CGT / Income Tax">
        <PercentField label="Small profits rate" value={s.tax.ctSmallProfitsRate} onChange={(ctSmallProfitsRate) => updateSettings({ ...s, tax: { ...s.tax, ctSmallProfitsRate } })} />
        <PercentField label="Main rate" value={s.tax.ctMainRate} onChange={(ctMainRate) => updateSettings({ ...s, tax: { ...s.tax, ctMainRate } })} />
        <MoneyField label="Small profits threshold" value={s.tax.ctSmallProfitsThreshold} onChange={(ctSmallProfitsThreshold) => updateSettings({ ...s, tax: { ...s.tax, ctSmallProfitsThreshold } })} />
        <MoneyField label="Main rate threshold" value={s.tax.ctMainRateThreshold} onChange={(ctMainRateThreshold) => updateSettings({ ...s, tax: { ...s.tax, ctMainRateThreshold } })} />
        <PercentField label="Residential CGT rate" value={s.tax.cgtResidentialRate} onChange={(cgtResidentialRate) => updateSettings({ ...s, tax: { ...s.tax, cgtResidentialRate } })} />
        <MoneyField label="CGT annual exemption" value={s.tax.cgtAnnualExemption} onChange={(cgtAnnualExemption) => updateSettings({ ...s, tax: { ...s.tax, cgtAnnualExemption } })} />
        <PercentField label="Personal income tax rate" value={s.tax.personalIncomeTaxRate} onChange={(personalIncomeTaxRate) => updateSettings({ ...s, tax: { ...s.tax, personalIncomeTaxRate } })} />
        <PercentField label="Finance cost relief rate" value={s.tax.financeCostReliefRate} onChange={(financeCostReliefRate) => updateSettings({ ...s, tax: { ...s.tax, financeCostReliefRate } })} />
      </SectionCard>

      <SectionCard title="PropertyData access" subtitle="Same-origin /api/pd by default. Leave the token blank unless you point at the Cloudflare worker.">
        <label className="block text-sm">
          <span className="mb-1 block text-stone-600">Base URL</span>
          <input
            className="w-full rounded-md border border-stone-300 px-3 py-2 dark:border-stone-700 dark:bg-stone-950"
            value={worker.baseUrl}
            onChange={(event) => updateWorker({ ...worker, baseUrl: event.target.value })}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-stone-600">App token</span>
          <input
            className="w-full rounded-md border border-stone-300 px-3 py-2 dark:border-stone-700 dark:bg-stone-950"
            value={worker.appToken}
            onChange={(event) => updateWorker({ ...worker, appToken: event.target.value })}
          />
        </label>
      </SectionCard>

      <button
        type="button"
        className="rounded-md border border-stone-300 px-4 py-2 dark:border-stone-700"
        onClick={resetSettings}
      >
        Reset settings to seeded defaults
      </button>
    </div>
  );
}
