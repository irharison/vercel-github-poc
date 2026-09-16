"use client";

import { money, percent, ratio } from "@/lib/format";
import type { DealResult } from "@/lib/calc/types";
import { NoteBanner, ResultRow, SectionCard } from "./fields";

export function Appraisal({ result }: { result: DealResult }) {
  const r = result;
  const isCompany = r.settings.tax.ownership === "limitedCompany";
  const profitable = r.totalProfit >= 0;

  return (
    <div className="space-y-4 pb-10">
      <SectionCard
        title={r.inputs.label}
        subtitle={
          r.inputs.postcode
            ? `${r.inputs.postcode} · ${money(r.inputs.purchasePrice)} purchase`
            : `${money(r.inputs.purchasePrice)} purchase`
        }
      >
        <ResultRow
          label="Total profit"
          value={money(r.totalProfit)}
          note="Rental profit plus sale proceeds, less cash in"
          emphasis
          negative={!profitable}
        />
        <ResultRow
          label="Return on cash"
          value={percent(r.returnOnCashPercent)}
          note={`${percent(r.annualisedReturnPercent)} a year over ${r.inputs.holdMonths} months`}
          negative={!profitable}
        />
        <div className="border-t border-stone-200 dark:border-stone-800" />
        <ResultRow label="Cash in" value={money(r.totalCashIn)} />
        <ResultRow
          label="Rental profit after tax"
          value={money(r.rental.profitAfterTax)}
          negative={r.rental.profitAfterTax < 0}
        />
        <ResultRow
          label="Net cash on sale"
          value={money(r.exit.netCashOnSale)}
          negative={r.exit.netCashOnSale < 0}
        />
        {r.exit.gain < 0 ? (
          <NoteBanner text="The sale is at a chargeable loss: the growth assumed does not cover the stamp duty and fees in the base cost. The rental years are carrying this deal, not the exit." />
        ) : null}
      </SectionCard>

      <SectionCard title="Cash required on day one" subtitle="What you actually have to fund">
        {r.purchase.lineItems.map(([label, value]) => (
          <ResultRow key={label} label={label} value={money(value)} />
        ))}
        <div className="border-t border-stone-200 dark:border-stone-800" />
        <ResultRow label="Total cash in" value={money(r.totalCashIn)} emphasis />
        <ResultRow
          label="Total acquisition cost"
          value={money(r.purchase.totalAcquisitionCost)}
          note="Price plus all costs, however funded"
        />
      </SectionCard>

      <SectionCard
        title="Stamp duty working"
        subtitle={
          r.sdlt.flatRateApplied
            ? "Company flat rate applied to the whole price"
            : "Rate per band, including any surcharge"
        }
      >
        {r.sdlt.bands.map((band) => (
          <ResultRow
            key={`${band.from}-${band.to}`}
            label={band.to == null ? `Above ${money(band.from)}` : `${money(band.from)} – ${money(band.to)}`}
            value={money(band.tax)}
            note={`${money(band.sliceAmount)} at ${percent(band.rate)}`}
          />
        ))}
        <div className="border-t border-stone-200 dark:border-stone-800" />
        <ResultRow
          label="Stamp duty"
          value={money(r.sdlt.total)}
          note={`Effective ${percent(r.sdlt.effectiveRate)}`}
          emphasis
        />
      </SectionCard>

      <SectionCard title="Rental period" subtitle={`${r.inputs.holdMonths} months`}>
        {r.rental.years.map((year) => (
          <div key={year.yearNumber} className="rounded-md bg-stone-50 p-3 dark:bg-stone-800/50">
            <div className="mb-1 font-medium">
              {year.monthsInYear === 12 ? `Year ${year.yearNumber}` : `Year ${year.yearNumber} (${year.monthsInYear} months)`}
            </div>
            <ResultRow label="Gross rent" value={money(year.grossRent)} />
            <ResultRow label="Interest" value={`−${money(year.interest)}`} />
            <ResultRow label="Tax" value={`−${money(year.tax)}`} />
            <ResultRow
              label="Profit after tax"
              value={money(year.profitAfterTax)}
              negative={year.profitAfterTax < 0}
            />
          </div>
        ))}
        <ResultRow label="Gross rent" value={money(r.rental.grossRent)} />
        <ResultRow label="Voids" value={`−${money(r.rental.voidLoss)}`} />
        <ResultRow
          label="Operating costs"
          value={`−${money(r.rental.operatingCosts)}`}
          note="Management, maintenance, insurance and the rest"
        />
        <ResultRow label="Mortgage interest" value={`−${money(r.rental.interest)}`} />
        <ResultRow
          label="Profit before tax"
          value={money(r.rental.profitBeforeTax)}
          negative={r.rental.profitBeforeTax < 0}
        />
        <ResultRow
          label={isCompany ? "Corporation Tax" : "Income Tax"}
          value={`−${money(r.rental.tax)}`}
          note={
            isCompany
              ? undefined
              : `Charged on ${money(r.rental.profitBeforeTax + r.rental.interest)} — interest is added back, then relieved at ${percent(r.settings.tax.financeCostReliefRate)}`
          }
        />
        <ResultRow
          label="Rental profit after tax"
          value={money(r.rental.profitAfterTax)}
          emphasis
          negative={r.rental.profitAfterTax < 0}
        />
        {!isCompany && r.rental.interest > 0 ? (
          <NoteBanner text="Held personally, mortgage interest is not deductible from residential rent. The tax above is charged on the profit before interest, with a basic-rate credit — so a personally-held deal can owe tax even in a year it loses cash." />
        ) : null}
      </SectionCard>

      <SectionCard title="Sale" subtitle={r.exit.taxRegime}>
        <ResultRow label="Sale price" value={money(r.exit.salePrice)} />
        <ResultRow
          label="Agent fee"
          value={`−${money(r.exit.agentFee)}`}
          note={percent(r.inputs.saleAgentFeePercent)}
        />
        <ResultRow label="Legal fees" value={`−${money(r.exit.legalFees)}`} />
        {r.exit.earlyRepaymentCharge > 0 ? (
          <ResultRow label="Early repayment charge" value={`−${money(r.exit.earlyRepaymentCharge)}`} />
        ) : null}
        <ResultRow label="Loan redeemed" value={`−${money(r.exit.loanRedeemed)}`} />
        <div className="border-t border-stone-200 dark:border-stone-800" />
        <ResultRow
          label="Base cost"
          value={money(r.exit.baseCost)}
          note={`Price, stamp duty, acquisition legals${r.inputs.capitaliseRefurb ? " and refurb" : ""}`}
        />
        <ResultRow
          label={r.exit.gain >= 0 ? "Chargeable gain" : "Loss on disposal"}
          value={money(r.exit.gain)}
          negative={r.exit.gain < 0}
        />
        <ResultRow
          label={isCompany ? "Corporation Tax on gain" : "Capital Gains Tax"}
          value={`−${money(r.exit.tax)}`}
          note={
            r.exit.gain <= 0
              ? "No tax — the disposal is at a loss"
              : isCompany
                ? "A company has no CGT annual exemption"
                : `After the ${money(r.settings.tax.cgtAnnualExemption)} annual exempt amount`
          }
        />
        <ResultRow
          label="Net cash on sale"
          value={money(r.exit.netCashOnSale)}
          emphasis
          negative={r.exit.netCashOnSale < 0}
        />
      </SectionCard>

      <SectionCard title="Borrowing result">
        <ResultRow label="Deposit" value={money(r.lending.deposit)} emphasis />
        <ResultRow label="Loan" value={money(r.lending.loan)} emphasis />
        <ResultRow label="Resulting LTV" value={percent(r.lending.actualLtv)} />
        <ResultRow
          label="Interest cover achieved"
          value={Number.isFinite(r.lending.actualIcr) ? `${ratio(r.lending.actualIcr)}×` : "—"}
        />
        <ResultRow label="Monthly interest" value={money(r.lending.monthlyInterest)} />
      </SectionCard>

      <NoteBanner text="Every tax rate, threshold and lending rule used here is an editable default, not advice. Check them against HMRC and your lender before committing to a deal." />
    </div>
  );
}
