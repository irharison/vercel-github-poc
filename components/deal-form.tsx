"use client";

import { useDeal } from "./deal-provider";
import { Appraisal } from "./appraisal";
import { MoneyField, NoteBanner, PercentField, ResultRow, SectionCard, Segmented, Toggle } from "./fields";
import { money, percent, ratio } from "@/lib/format";
import type { FinancingMode, SalePriceMode } from "@/lib/calc/types";

export function DealWorkspace() {
  const { deal, result, settings, updateDeal, saveDeal, newDeal, savedDeals, openDeal, deleteDeal } = useDeal();
  const lending = deal.lendingOverride ?? settings.lending;
  const l = result.lending;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4 pb-10">
        {savedDeals.length > 0 ? (
          <SectionCard title="Saved deals">
            {savedDeals.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-2">
                <button type="button" className="text-left text-sm underline" onClick={() => openDeal(item)}>
                  {item.label} · {money(item.purchasePrice)}
                </button>
                <button type="button" className="text-xs text-red-600" onClick={() => deleteDeal(item.label)}>
                  Delete
                </button>
              </div>
            ))}
          </SectionCard>
        ) : null}

        <SectionCard title="Property">
          <label className="block text-sm">
            <span className="mb-1 block text-stone-600">Deal name</span>
            <input
              className="w-full rounded-md border border-stone-300 px-3 py-2 dark:border-stone-700 dark:bg-stone-950"
              value={deal.label}
              onChange={(event) => updateDeal({ ...deal, label: event.target.value })}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-stone-600">Postcode</span>
            <input
              className="w-full rounded-md border border-stone-300 px-3 py-2 dark:border-stone-700 dark:bg-stone-950"
              value={deal.postcode}
              placeholder="District (NW2), sector (NW2 3) or full postcode"
              onChange={(event) => updateDeal({ ...deal, postcode: event.target.value })}
            />
          </label>
          <MoneyField
            label="Purchase price"
            value={deal.purchasePrice}
            onChange={(purchasePrice) => updateDeal({ ...deal, purchasePrice })}
          />
          <MoneyField
            label="Valuation (if different)"
            value={deal.marketValuation ?? 0}
            helper="Leave at 0 to use the purchase price"
            onChange={(value) =>
              updateDeal({ ...deal, marketValuation: value === 0 ? null : value })
            }
          />
          <Toggle
            label="Non-UK-resident purchaser"
            subtitle={`Adds the ${percent(settings.sdlt.nonResidentSurcharge)} non-resident SDLT surcharge`}
            checked={deal.nonResidentPurchaser}
            onChange={(nonResidentPurchaser) => updateDeal({ ...deal, nonResidentPurchaser })}
          />
        </SectionCard>

        <SectionCard title="Purchase costs" subtitle="Stamp duty is calculated from the rates in Settings">
          <ResultRow
            label="Stamp duty"
            value={money(result.sdlt.total)}
            note={
              result.sdlt.flatRateApplied
                ? `Company flat rate ${percent(settings.sdlt.companyFlatRate)}`
                : `Effective ${percent(result.sdlt.effectiveRate)}, including ${percent(result.sdlt.surchargeApplied)} surcharge`
            }
            emphasis
          />
          <MoneyField label="Legal fees" value={deal.legalFeesPurchase} onChange={(legalFeesPurchase) => updateDeal({ ...deal, legalFeesPurchase })} />
          <MoneyField label="Survey" value={deal.surveyFees} onChange={(surveyFees) => updateDeal({ ...deal, surveyFees })} />
          <MoneyField label="Refurbishment" value={deal.refurbCost} onChange={(refurbCost) => updateDeal({ ...deal, refurbCost })} />
          <MoneyField label="Other purchase costs" value={deal.otherPurchaseCosts} onChange={(otherPurchaseCosts) => updateDeal({ ...deal, otherPurchaseCosts })} />
          <Toggle
            label="Treat refurb as capital"
            subtitle="Adds it to the base cost, reducing the taxable gain on sale"
            checked={deal.capitaliseRefurb}
            onChange={(capitaliseRefurb) => updateDeal({ ...deal, capitaliseRefurb })}
          />
        </SectionCard>

        <SectionCard title="Rental" subtitle="The rent also determines how much you can borrow">
          <MoneyField label="Monthly rent" value={deal.monthlyRent} onChange={(monthlyRent) => updateDeal({ ...deal, monthlyRent })} />
          <ResultRow label="Gross yield" value={percent(result.rental.grossYield)} />
          <MoneyField
            label="Hold period"
            value={deal.holdMonths}
            prefix={null}
            suffix="months"
            onChange={(value) => updateDeal({ ...deal, holdMonths: Math.min(600, Math.max(1, Math.round(value))) })}
          />
          <PercentField label="Voids" value={deal.voidPercent} onChange={(voidPercent) => updateDeal({ ...deal, voidPercent })} />
          <PercentField label="Management fee" value={deal.managementPercent} onChange={(managementPercent) => updateDeal({ ...deal, managementPercent })} />
          <PercentField label="Maintenance (of gross rent)" value={deal.maintenancePercentOfRent} onChange={(maintenancePercentOfRent) => updateDeal({ ...deal, maintenancePercentOfRent })} />
          <PercentField label="Annual rent growth" value={deal.rentGrowthPercent} onChange={(rentGrowthPercent) => updateDeal({ ...deal, rentGrowthPercent })} />
          <MoneyField label="Insurance per year" value={deal.insuranceAnnual} onChange={(insuranceAnnual) => updateDeal({ ...deal, insuranceAnnual })} />
          <MoneyField label="Service charge per year" value={deal.serviceChargeAnnual} helper="Leasehold only" onChange={(serviceChargeAnnual) => updateDeal({ ...deal, serviceChargeAnnual })} />
          <MoneyField label="Ground rent per year" value={deal.groundRentAnnual} onChange={(groundRentAnnual) => updateDeal({ ...deal, groundRentAnnual })} />
          <MoneyField label="Other annual costs" value={deal.otherAnnualCosts} onChange={(otherAnnualCosts) => updateDeal({ ...deal, otherAnnualCosts })} />
        </SectionCard>

        <SectionCard title="Exit">
          <Segmented<SalePriceMode>
            value={deal.salePriceMode}
            onChange={(salePriceMode) => updateDeal({ ...deal, salePriceMode })}
            options={[
              { value: "growth", label: "From growth" },
              { value: "explicit", label: "Set price" },
            ]}
          />
          {deal.salePriceMode === "growth" ? (
            <PercentField label="Annual capital growth" value={deal.annualGrowthPercent} onChange={(annualGrowthPercent) => updateDeal({ ...deal, annualGrowthPercent })} />
          ) : (
            <MoneyField label="Expected sale price" value={deal.explicitSalePrice} onChange={(explicitSalePrice) => updateDeal({ ...deal, explicitSalePrice })} />
          )}
          <ResultRow label="Sale price used" value={money(result.exit.salePrice)} emphasis />
          <PercentField label="Selling agent fee" value={deal.saleAgentFeePercent} onChange={(saleAgentFeePercent) => updateDeal({ ...deal, saleAgentFeePercent })} />
          <MoneyField label="Sale legal fees" value={deal.saleLegalFees} onChange={(saleLegalFees) => updateDeal({ ...deal, saleLegalFees })} />
        </SectionCard>

        <SectionCard
          title="Borrowing and deposit"
          subtitle={settings.tax.ownership === "limitedCompany" ? "Limited company, interest only" : "Personal ownership, interest only"}
          trailing={
            deal.lendingOverride ? (
              <button
                type="button"
                className="rounded-full bg-stone-100 px-2 py-1 text-xs dark:bg-stone-800"
                onClick={() => updateDeal({ ...deal, lendingOverride: null })}
              >
                Custom ×
              </button>
            ) : null
          }
        >
          <Segmented<FinancingMode>
            value={deal.financingMode}
            onChange={(mode) => {
              if (mode === "targetDeposit") {
                updateDeal({
                  ...deal,
                  financingMode: mode,
                  targetDeposit: deal.targetDeposit > 0 ? deal.targetDeposit : l.deposit,
                });
              } else if (mode === "targetLoan") {
                updateDeal({
                  ...deal,
                  financingMode: mode,
                  targetLoan: deal.targetLoan > 0 ? deal.targetLoan : l.loan,
                });
              } else {
                updateDeal({ ...deal, financingMode: mode });
              }
            }}
            options={[
              { value: "maxBorrowing", label: "Max" },
              { value: "targetDeposit", label: "Set deposit" },
              { value: "targetLoan", label: "Set loan" },
            ]}
          />
          {deal.financingMode === "targetDeposit" ? (
            <MoneyField
              label="Deposit"
              value={deal.targetDeposit}
              helper={`Minimum the lender allows is ${money(l.minimumDeposit)}`}
              onChange={(targetDeposit) => updateDeal({ ...deal, targetDeposit })}
            />
          ) : null}
          {deal.financingMode === "targetLoan" ? (
            <MoneyField
              label="Loan"
              value={deal.targetLoan}
              helper={`Maximum available is ${money(l.maxLoan)}`}
              onChange={(targetLoan) => updateDeal({ ...deal, targetLoan })}
            />
          ) : null}
          {l.cappedByLender ? (
            <NoteBanner
              text={`You asked to borrow ${money(l.requestedLoan)}, but the lender will only advance ${money(l.maxLoan)}. The deposit has been raised to ${money(l.deposit)}.`}
            />
          ) : null}
          <ResultRow label="Deposit" value={money(l.deposit)} emphasis />
          <ResultRow
            label="Loan"
            value={money(l.loan)}
            note={
              l.isUnderBorrowed
                ? `Borrowing ${money(l.maxLoan - l.loan)} less than the ${money(l.maxLoan)} available`
                : l.constraint === "ltv"
                  ? `Ceiling set by the ${percent(lending.maxLtv)} LTV cap.`
                  : `Ceiling set by the ${ratio(lending.interestCoverRatio)}× interest cover test at ${percent(lending.stressRate)}.`
            }
            emphasis
          />
          <ResultRow label="Resulting LTV" value={percent(l.actualLtv)} note={`Lender allows up to ${percent(lending.maxLtv)}`} />
          <ResultRow
            label="Interest cover achieved"
            value={Number.isFinite(l.actualIcr) ? `${ratio(l.actualIcr)}×` : "—"}
            note={`Lender needs ${ratio(lending.interestCoverRatio)}× at ${percent(lending.stressRate)}`}
          />
          <ResultRow label="Monthly interest" value={money(l.monthlyInterest)} note={`Interest only at ${percent(lending.payRate)}`} />
          <PercentField
            label="Pay rate"
            value={lending.payRate}
            helper="Changing a mortgage term here applies to this deal only"
            onChange={(payRate) => updateDeal({ ...deal, lendingOverride: { ...lending, payRate } })}
          />
          <PercentField label="Maximum LTV" value={lending.maxLtv} onChange={(maxLtv) => updateDeal({ ...deal, lendingOverride: { ...lending, maxLtv } })} />
          <MoneyField
            label="Interest cover ratio"
            value={lending.interestCoverRatio}
            prefix={null}
            suffix="×"
            decimals
            onChange={(interestCoverRatio) => updateDeal({ ...deal, lendingOverride: { ...lending, interestCoverRatio } })}
          />
          <PercentField label="Stress rate" value={lending.stressRate} onChange={(stressRate) => updateDeal({ ...deal, lendingOverride: { ...lending, stressRate } })} />
        </SectionCard>

        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-md bg-[var(--brand)] px-4 py-2 text-white"
            onClick={saveDeal}
          >
            Save deal
          </button>
          <button
            type="button"
            className="rounded-md border border-stone-300 px-4 py-2 dark:border-stone-700"
            onClick={newDeal}
          >
            New
          </button>
        </div>
      </div>
      <Appraisal result={result} />
    </div>
  );
}
