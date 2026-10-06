"use client";

import type { ReactNode } from "react";
import { eur, eurPence, fxQuote, money, moneyFromEur, moneyPence, percent } from "@/lib/format";
import { spainHelp } from "@/lib/help/spain";
import type { FinanceColumn, SpainVillaResult } from "@/lib/spain/types";
import { NoteBanner, ResultRow, SectionCard } from "./fields";
import { InfoTip } from "./info-tip";
import { SpainResidencySummary } from "./spain-residency";

const lineInfo: Record<string, string> = {
  "ITP transfer tax": spainHelp.itp,
  IVA: spainHelp.iva,
  "AJD stamp duty": spainHelp.ajd,
  Notary: spainHelp.notary,
  "Land registry": spainHelp.landRegistry,
  Lawyer: spainHelp.lawyer,
  "NIE, bank and admin": spainHelp.nie,
  "Licencia / ICIO": spainHelp.icio,
  Contingency: spainHelp.contingency,
  "IVA on works": spainHelp.worksIva,
  IBI: spainHelp.ibi,
  "Community fees": spainHelp.community,
  Basura: spainHelp.basura,
  "Non-resident income tax": spainHelp.irnr,
  "Visa and residency": spainHelp.nomadAnnual,
  "Holiday management": spainHelp.management,
  "VFT registration": spainHelp.vft,
  "Agency fee": spainHelp.agency,
  "Deposit held": spainHelp.rentDeposit,
};

function gbpNote(amount: number, rate: number, extra?: string): string {
  const pounds = moneyFromEur(amount, rate);
  return extra ? `${extra} · ${pounds}` : pounds;
}

function EurRow({
  label,
  amount,
  rate,
  note,
  emphasis,
  negative,
  info,
}: {
  label: string;
  amount: number;
  rate: number;
  note?: string;
  emphasis?: boolean;
  negative?: boolean;
  info?: string;
}) {
  return (
    <ResultRow
      label={label}
      value={eur(amount)}
      note={gbpNote(amount, rate, note)}
      emphasis={emphasis}
      negative={negative}
      info={info ?? lineInfo[label]}
    />
  );
}

function taxNote(label: string, result: SpainVillaResult): string | undefined {
  const inputs = result.inputs;
  if (label === "ITP transfer tax") return `${percent(inputs.itpPercent)} of the price`;
  if (label === "IVA") return `${percent(inputs.ivaPercent)} of the price`;
  if (label === "AJD stamp duty") return `${percent(inputs.ajdPercent)} of the price`;
  return undefined;
}

export function SpainAppraisal({ result }: { result: SpainVillaResult }) {
  const { inputs, purchase, renovation, running, finance } = result;
  const rate = result.gbpPerEur;
  const valueEntered = inputs.postRenovationValueEur > 0;

  return (
    <div className="space-y-4">
      <SectionCard
        title={inputs.label || "Spain villa"}
        subtitle={
          [
            inputs.location,
            inputs.acquisitionType === "newBuild" ? "New build" : "Resale",
            renovation.floorAreaM2 > 0 ? `${renovation.floorAreaM2} m²` : null,
          ]
            .filter(Boolean)
            .join(" · ") || undefined
        }
      >
        <ResultRow
          label="EUR/GBP rate"
          value={rate > 0 ? fxQuote(rate) : "—"}
          note={rate > 0 ? `${fxQuote(result.eurPerGbp)} euros per pound` : "Enter pounds per euro"}
        />
        <EurRow label="Purchase price" amount={inputs.purchasePriceEur} rate={rate} />
        <EurRow
          label="Purchase costs"
          amount={purchase.costsExFxEur}
          rate={rate}
          note="Before currency transfer"
        />
        <EurRow
          label="Total acquisition cost"
          amount={purchase.acquisitionExFxEur}
          rate={rate}
          note="Price plus purchase costs"
          emphasis
        />
        <EurRow label="Total renovation" amount={renovation.totalEur} rate={rate} />
        <EurRow
          label="All-in project cost"
          amount={result.allInExFxEur}
          rate={rate}
          note="Before currency transfer, which depends on the finance option"
          emphasis
        />
        <div className="border-t border-stone-200 dark:border-stone-800" />
        <EurRow label="Cash required, cash purchase" amount={finance.cash.cashRequiredEur} rate={rate} info={spainHelp.cash} />
        <EurRow
          label="Cash required, Spanish mortgage"
          amount={finance.spanish.cashRequiredEur}
          rate={rate}
          info={spainHelp.spanishMortgage}
        />
        <EurRow
          label="Cash required, UK remortgage"
          amount={finance.uk.cashRequiredEur}
          rate={rate}
          info={spainHelp.ukRemortgage}
        />
        <div className="border-t border-stone-200 dark:border-stone-800" />
        {valueEntered ? (
          <>
            <EurRow label="Post-renovation value" amount={inputs.postRenovationValueEur} rate={rate} />
            <EurRow
              label="Equity, cash"
              amount={finance.cash.equityEur ?? 0}
              rate={rate}
              note="No debt on the villa"
              negative={(finance.cash.equityEur ?? 0) < 0}
            />
            <EurRow
              label="Equity, Spanish mortgage"
              amount={finance.spanish.equityEur ?? 0}
              rate={rate}
              note="Value minus the Spanish loan, before repayments"
              negative={(finance.spanish.equityEur ?? 0) < 0}
            />
            <EurRow
              label="Equity, UK remortgage"
              amount={finance.uk.equityEur ?? 0}
              rate={rate}
              note="Value minus the UK loan in euros. The charge is on the UK property"
              negative={(finance.uk.equityEur ?? 0) < 0}
            />
          </>
        ) : (
          <ResultRow
            label="Post-renovation value"
            value="—"
            note="Enter a value to see equity"
          />
        )}
      </SectionCard>

      <SectionCard
        title="Purchase costs"
        subtitle={
          inputs.acquisitionType === "newBuild"
            ? "New build: IVA and AJD, instead of ITP"
            : "Resale: Andalucía ITP, instead of IVA and AJD"
        }
      >
        {purchase.taxLines.map((line) => (
          <EurRow
            key={line.label}
            label={line.label}
            amount={line.amountEur}
            rate={rate}
            note={taxNote(line.label, result)}
          />
        ))}
        {purchase.notaryEur !== 0 ? (
          <EurRow
            label="Notary"
            amount={purchase.notaryEur}
            rate={rate}
            note={`${percent(inputs.notaryPercent)} of the price`}
          />
        ) : null}
        {purchase.landRegistryEur !== 0 ? (
          <EurRow
            label="Land registry"
            amount={purchase.landRegistryEur}
            rate={rate}
            note={`${percent(inputs.landRegistryPercent)} of the price`}
          />
        ) : null}
        {purchase.lawyerEur !== 0 ? (
          <EurRow
            label="Lawyer"
            amount={purchase.lawyerEur}
            rate={rate}
            note={`${eur(purchase.lawyerNetEur)} plus ${eur(purchase.lawyerIvaEur)} IVA`}
          />
        ) : null}
        {purchase.nieAdminEur !== 0 ? (
          <EurRow label="NIE, bank and admin" amount={purchase.nieAdminEur} rate={rate} />
        ) : null}
        {purchase.surveyEur !== 0 ? (
          <EurRow label="Survey" amount={purchase.surveyEur} rate={rate} />
        ) : null}
        {purchase.agentEur !== 0 ? (
          <EurRow
            label="Buyer's agent"
            amount={purchase.agentEur}
            rate={rate}
            note={`${eur(purchase.agentNetEur)} plus ${eur(purchase.agentIvaEur)} IVA`}
          />
        ) : null}
        <div className="border-t border-stone-200 dark:border-stone-800" />
        <EurRow label="Purchase costs" amount={purchase.costsExFxEur} rate={rate} emphasis />
        <EurRow
          label="Total acquisition cost"
          amount={purchase.acquisitionExFxEur}
          rate={rate}
          note="Currency transfer is added in the finance comparison"
          emphasis
        />
      </SectionCard>

      <SectionCard
        title="Renovation"
        subtitle={
          renovation.usesPerM2 && renovation.usesLineItems
            ? "Per m² plus line items. Line items are on top, so do not cost the same work twice."
            : renovation.usesLineItems
              ? "Line items only. The per-m² rates are not included."
              : `${renovation.floorAreaM2} m² at ${eur(renovation.eurPerM2)} per m²`
        }
      >
        {renovation.usesPerM2 ? (
          <EurRow
            label="Works from the area rate"
            amount={renovation.m2CostEur}
            rate={rate}
            note={`${renovation.floorAreaM2} m² at ${eur(renovation.eurPerM2)}`}
            info={spainHelp.renovationTiers}
          />
        ) : null}
        {renovation.lineItems.map((line) => (
          <EurRow key={line.label} label={line.label} amount={line.amountEur} rate={rate} />
        ))}
        <EurRow label="Works budget" amount={renovation.worksEur} rate={rate} emphasis />
        {renovation.professionalFeesEur !== 0 ? (
          <EurRow
            label="Architect and project manager"
            amount={renovation.professionalFeesEur}
            rate={rate}
            note={`${percent(inputs.professionalFeePercent)} of the works`}
          />
        ) : null}
        {renovation.icioEur !== 0 ? (
          <EurRow
            label="Licencia / ICIO"
            amount={renovation.icioEur}
            rate={rate}
            note={`${percent(inputs.icioPercent)} of the works`}
          />
        ) : null}
        {renovation.contingencyEur !== 0 ? (
          <EurRow
            label="Contingency"
            amount={renovation.contingencyEur}
            rate={rate}
            note={`${percent(inputs.contingencyPercent)} of works plus professional fees`}
          />
        ) : null}
        <EurRow
          label="IVA on works"
          amount={renovation.ivaEur}
          rate={rate}
          note={`${percent(inputs.worksIvaPercent)} of works, fees and contingency. Not on the licence.`}
        />
        <div className="border-t border-stone-200 dark:border-stone-800" />
        <EurRow label="Total renovation" amount={renovation.totalEur} rate={rate} emphasis />
      </SectionCard>

      <SectionCard title="Annual costs" subtitle="A typical year after completion. Finance interest is year one.">
        {running.lines.map((line) => (
          <EurRow key={line.label} label={line.label} amount={line.amountEur} rate={rate} />
        ))}
        <EurRow
          label="Non-resident income tax"
          amount={running.irnrEur}
          rate={rate}
          info={running.irnrBasis === "resident" ? spainHelp.irnrResident : undefined}
          note={
            running.irnrBasis === "resident"
              ? "Off. A resident's main home has no imputed non-resident tax. Purchase tax is unchanged."
              : running.irnrBasis === "imputed"
              ? `${percent(inputs.imputationPercent)} of the ${eur(inputs.cadastralValueEur)} cadastral value, taxed at ${percent(inputs.irnrPercent)}. UK residents are generally 24%.`
              : running.irnrBasis === "grossRent"
                ? `${percent(inputs.irnrPercent)} of gross rent. Fully let, so imputed income is not also charged.`
                : running.irnrBasis === "netRent"
                  ? `${percent(inputs.irnrPercent)} of rent after the running costs. Interest is deducted per finance option.`
                  : inputs.allowEuRentalDeductions
                    ? "Tax on the peak-season profit, plus imputed income for the months you do not offer. Interest in that finance option is shared across the let months."
                    : "Tax on the gross peak-season income, plus imputed income for the months you do not offer. UK residents are generally taxed on the gross."
          }
        />
        {running.rentEur > 0 ? (
          <EurRow
            label={result.holidayLet.enabled ? "Peak-season let" : "Rent"}
            amount={running.rentEur}
            rate={rate}
            note={
              result.holidayLet.enabled
                ? `${result.holidayLet.months} months offered, before the manager and tax`
                : "Entered gross rent for a full year"
            }
          />
        ) : null}
        {result.holidayLet.enabled && result.holidayLet.managementEur !== 0 ? (
          <EurRow
            label="Holiday management"
            amount={result.holidayLet.managementEur}
            rate={rate}
            note={`${eur(result.holidayLet.managementNetEur)} plus ${eur(result.holidayLet.managementIvaEur)} IVA`}
          />
        ) : null}
        {result.holidayLet.enabled && result.holidayLet.vftAnnualEur !== 0 ? (
          <EurRow label="Tourist tax or compliance" amount={result.holidayLet.vftAnnualEur} rate={rate} />
        ) : null}
        {result.holidayLet.enabled && result.holidayLet.vftSetupEur !== 0 ? (
          <EurRow
            label="VFT registration"
            amount={result.holidayLet.vftSetupEur}
            rate={rate}
            note="Year one only. In the rent-or-buy comparison, not in the yearly cost below."
          />
        ) : null}
        <div className="border-t border-stone-200 dark:border-stone-800" />
        <EurRow
          label="Net annual cost, before finance"
          amount={running.netAnnualCostEur}
          rate={rate}
          note={running.netAnnualCostEur < 0 ? "Income after running costs and tax" : undefined}
          emphasis
        />
        {running.rentEur > 0 ? (
          <>
            <ResultRow label="Gross yield on the price" value={percent(running.grossYieldOnPricePercent)} />
            <ResultRow
              label="Net yield on the all-in cost"
              value={percent(running.netYieldOnAllInPercent)}
              note="Before finance and before currency transfer"
            />
          </>
        ) : (
          <ResultRow
            label="Yield"
            value="—"
            note={
              running.irnrBasis === "resident"
                ? "Enter rent to see a yield. Non-resident tax is off while the digital nomad option is on."
                : "Enter rent to see a yield. With none, tax is on imputed income."
            }
          />
        )}
      </SectionCard>

      <SpainResidencySummary result={result} />

      <SectionCard
        title="Rent instead"
        subtitle={`${result.tenancy.months} months out of season, as a tenant. The deposit is refundable and is not in the cost.`}
      >
        <EurRow
          label="Rent"
          amount={result.tenancy.rentEur}
          rate={rate}
          note={`${result.tenancy.months} months at ${eur(result.tenancy.monthlyRentEur)}`}
        />
        {result.tenancy.agencyEur !== 0 ? (
          <EurRow
            label="Agency fee"
            amount={result.tenancy.agencyEur}
            rate={rate}
            note={`${eur(result.tenancy.agencyNetEur)} plus ${eur(result.tenancy.agencyIvaEur)} IVA`}
          />
        ) : null}
        {result.tenancy.utilitiesEur !== 0 ? (
          <EurRow label="Utilities and internet" amount={result.tenancy.utilitiesEur} rate={rate} />
        ) : null}
        {result.tenancy.cleaningEur !== 0 ? (
          <EurRow label="Cleaning" amount={result.tenancy.cleaningEur} rate={rate} />
        ) : null}
        {result.tenancy.insuranceEur !== 0 ? (
          <EurRow label="Insurance" amount={result.tenancy.insuranceEur} rate={rate} />
        ) : null}
        {result.tenancy.carHireEur !== 0 ? (
          <EurRow label="Car hire" amount={result.tenancy.carHireEur} rate={rate} />
        ) : null}
        {result.tenancy.travelEur !== 0 ? (
          <EurRow label="Travel and flights" amount={result.tenancy.travelEur} rate={rate} />
        ) : null}
        <div className="border-t border-stone-200 dark:border-stone-800" />
        <EurRow label="Season cost" amount={result.tenancy.costEur} rate={rate} emphasis />
        <ResultRow
          label="Effective monthly cost"
          value={eurPence(result.tenancy.effectiveMonthlyEur)}
          note={moneyPence(result.tenancy.effectiveMonthlyGbp)}
          emphasis
        />
        <EurRow
          label="Deposit held"
          amount={result.tenancy.depositEur}
          rate={rate}
          note="Refundable. Not included in the season cost"
        />
      </SectionCard>

      <NoteBanner text="Every rate above is an editable estimate, not advice. Check the purchase taxes, the licence and non-resident tax with a Spanish lawyer or gestor, and the mortgage with the lender. Off-season rents are estimates too." />
    </div>
  );
}

function Amount({
  eurAmount,
  gbpAmount,
  rate,
  pence = false,
  missing = false,
  negative = false,
}: {
  eurAmount: number;
  gbpAmount?: number | null;
  rate: number;
  pence?: boolean;
  missing?: boolean;
  negative?: boolean;
}) {
  if (missing) return <span className="text-stone-400">—</span>;
  const euro = pence ? eurPence(eurAmount) : eur(eurAmount);
  const pounds =
    gbpAmount != null
      ? pence
        ? moneyPence(gbpAmount)
        : money(gbpAmount)
      : rate > 0
        ? pence
          ? moneyPence(eurAmount * rate)
          : money(eurAmount * rate)
        : "—";
  return (
    <div className={negative ? "text-red-600 dark:text-red-400" : undefined}>
      <div className="tabular-nums">{euro}</div>
      <div className="text-xs font-normal text-stone-500 tabular-nums">{pounds}</div>
    </div>
  );
}

export function SpainFinance({ result }: { result: SpainVillaResult }) {
  const { inputs, finance } = result;
  const rate = result.gbpPerEur;
  const columns: Array<{ title: string; detail: string; info: string; column: FinanceColumn }> = [
    { title: "Cash", detail: "No borrowing", info: spainHelp.cash, column: finance.cash },
    {
      title: "Spanish mortgage",
      detail: `${percent(inputs.spanishLtvPercent)} LTV · ${percent(inputs.spanishRatePercent)} ${inputs.spanishRateType} · ${inputs.spanishTermYears} years`,
      info: spainHelp.spanishMortgage,
      column: finance.spanish,
    },
    {
      title: "UK remortgage",
      detail: `${money(inputs.ukLoanGbp)} · ${percent(inputs.ukRatePercent)} · ${inputs.ukTermYears} years`,
      info: spainHelp.ukRemortgage,
      column: finance.uk,
    },
  ];
  const price = inputs.purchasePriceEur;
  const deposit = finance.spanish.priceDepositEur ?? 0;
  const depositPct = price > 0 ? (deposit / price) * 100 : 0;
  const showYield = result.running.rentEur > 0;
  const showEquity = inputs.postRenovationValueEur > 0;

  const rows: Array<{
    label: string;
    note?: string;
    info?: string;
    emphasis?: boolean;
    render: (column: FinanceColumn) => ReactNode;
  }> = [
    {
      label: "Cash required upfront",
      note: "Deposit, costs, renovation, fees and currency transfer",
      emphasis: true,
      render: (column) => <Amount eurAmount={column.cashRequiredEur} rate={rate} />,
    },
    {
      label: "Currency transfer",
      note: "Included in the cash above",
      info: spainHelp.fx,
      render: (column) => <Amount eurAmount={column.currencyTransferEur} rate={rate} />,
    },
    {
      label: "Amount borrowed",
      render: (column) => (
        <Amount eurAmount={column.amountBorrowedEur} gbpAmount={column.amountBorrowedGbp} rate={rate} />
      ),
    },
    {
      label: "Monthly payment",
      info: spainHelp.monthlyPayment,
      render: (column) => (
        <Amount
          eurAmount={column.monthlyPaymentEur}
          gbpAmount={column.monthlyPaymentGbp}
          rate={rate}
          pence
        />
      ),
    },
    {
      label: "Interest in year one",
      render: (column) => (
        <Amount
          eurAmount={column.yearOneInterestEur}
          gbpAmount={column.yearOneInterestGbp}
          rate={rate}
        />
      ),
    },
    {
      label: "Total interest",
      note: "Over the full term, at the rate entered",
      info: spainHelp.totalInterest,
      render: (column) => (
        <Amount eurAmount={column.totalInterestEur} gbpAmount={column.totalInterestGbp} rate={rate} />
      ),
    },
    {
      label: "Total cost of ownership",
      note: inputs.digitalNomad
        ? "Project, transfer, fees, interest and visa costs over this term. Cash uses the Spanish term. The IRNR change is in the annual cost."
        : "Project, transfer, fees and interest. Running costs are extra.",
      info: spainHelp.totalCost,
      emphasis: true,
      render: (column) => <Amount eurAmount={column.totalCostEur} rate={rate} />,
    },
  ];

  if (showEquity) {
    rows.push({
      label: "Equity at completion",
      note: "Value minus the debt used for this option, before repayments",
      render: (column) => (
        <Amount
          eurAmount={column.equityEur ?? 0}
          rate={rate}
          missing={column.equityEur == null}
          negative={(column.equityEur ?? 0) < 0}
        />
      ),
    });
  }

  rows.push({
    label: "Net annual cost",
    note: "Running costs, non-resident tax and year-one interest, less rent",
    render: (column) => <Amount eurAmount={column.netAnnualCostEur} rate={rate} />,
  });

  if (showYield) {
    rows.push({
      label: "Net yield on cash",
      note: "After year-one interest and tax, on the cash this option needs",
      render: (column) => <span className="tabular-nums">{percent(column.netYieldOnCashPercent)}</span>,
    });
  }

  return (
    <SectionCard
      title="Finance options"
      subtitle="Three alternatives, not a stack. Euros on top, pounds underneath, at the rate in the villa section."
    >
      {inputs.spanishLtvPercent > 70 ? (
        <NoteBanner text="This Spanish LTV is above 70%. Many lenders cap non-residents at 60–70% of the valuation, and the valuation can sit below the price." />
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] border-collapse text-sm">
          <caption className="sr-only">
            Cash, a Spanish non-resident mortgage and a UK remortgage compared in euros, with pounds underneath.
          </caption>
          <thead>
            <tr className="border-b border-stone-200 text-left dark:border-stone-800">
              <th scope="col" className="px-3 py-3 font-medium text-stone-500">
                <span className="sr-only">Item</span>
              </th>
              {columns.map((item) => (
                <th key={item.column.id} scope="col" className="px-3 py-3 text-right align-bottom">
                  <div className="inline-flex items-center font-semibold text-stone-900 dark:text-stone-100">
                    <span>{item.title}</span>
                    <InfoTip label={item.title} text={item.info} />
                  </div>
                  <div className="mt-1 text-xs font-normal text-stone-500">{item.detail}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.label}
                className={`border-b border-stone-100 dark:border-stone-800 ${row.emphasis ? "bg-stone-50 dark:bg-stone-800/40" : ""}`}
              >
                <th scope="row" className="px-3 py-3 text-left font-medium">
                  <span className="inline-flex items-center">
                    <span>{row.label}</span>
                    {row.info ? <InfoTip label={row.label} text={row.info} /> : null}
                  </span>
                  {row.note ? <div className="mt-0.5 text-xs font-normal text-stone-500">{row.note}</div> : null}
                </th>
                {columns.map((item) => (
                  <td key={item.column.id} className={`px-3 py-3 text-right ${row.emphasis ? "font-semibold" : ""}`}>
                    {row.render(item.column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 pt-1 text-xs leading-5 text-stone-500 md:grid-cols-3">
        <p>
          Cash buys the whole project. Currency transfer of {eur(finance.cash.currencyTransferEur)} is charged on
          that full amount.
        </p>
        <p>
          The Spanish loan is {eur(finance.spanish.amountBorrowedEur)}, so the deposit is {eur(deposit)} (
          {percent(depositPct)} of the price). Purchase costs, the renovation and mortgage fees of{" "}
          {eur(finance.spanish.feesEur)} are cash on top. Non-residents are usually asked for 30–40% of the price,
          plus those costs. The loan does not fund the renovation.
          {inputs.spanishRateType === "variable"
            ? " A variable rate will move; the payment assumes the rate you entered holds for the whole term."
            : ""}
        </p>
        <p>
          The UK loan is in pounds, secured on UK property, then converted. Currency transfer of{" "}
          {eur(finance.uk.currencyTransferEur)} is charged on the whole Spanish project. UK fees are converted at
          today&apos;s rate with no second spread. The villa itself is not mortgaged in Spain.
          {finance.uk.surplusEur > 0
            ? ` This loan converts to ${eur(finance.uk.surplusEur)} more than the project needs, and that surplus is still borrowed.`
            : ""}
        </p>
      </div>
    </SectionCard>
  );
}

function breakevenLabel(year: number | null): string {
  return year == null ? "Not within 40 years" : `Year ${year}`;
}

export function SpainStay({ result }: { result: SpainVillaResult }) {
  const { comparison, inputs } = result;
  const rate = result.gbpPerEur;
  const rows: Array<{ label: string; costs: readonly number[]; breakeven: number | null | undefined }> = [
    { label: "Rent instead", costs: comparison.rentCostEur, breakeven: undefined },
    ...comparison.options.map((option) => ({
      label:
        option.id === "cash"
          ? "Buy with cash"
          : option.id === "spanishMortgage"
            ? "Buy with a Spanish mortgage"
            : "Buy with a UK remortgage",
      costs: option.costEur,
      breakeven: option.breakevenYear,
    })),
  ];

  return (
    <SectionCard
      title="Rent or buy"
      subtitle={`Cost after 1, 5 and 10 years. Buying is the price, purchase costs, renovation, currency transfer and finance fees, plus interest and running costs for those years, minus what the villa is worth by then. Worth starts at ${eur(comparison.startValueEur)} and grows by ${percent(inputs.appreciationPercent)} a year.`}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] border-collapse text-sm">
          <caption className="sr-only">
            Off-season rent compared with buying for cash, with a Spanish mortgage, and with a UK remortgage, after 1, 5 and 10 years.
          </caption>
          <thead>
            <tr className="border-b border-stone-200 text-left dark:border-stone-800">
              <th scope="col" className="px-3 py-3 text-left font-medium text-stone-500">
                <span className="inline-flex items-center">
                  <span className="sr-only">Option</span>
                  <InfoTip label="1, 5 and 10 year comparison" text={spainHelp.comparison} />
                </span>
              </th>
              {comparison.years.map((year) => (
                <th key={year} scope="col" className="px-3 py-3 text-right font-semibold">
                  {year === 1 ? "1 year" : `${year} years`}
                </th>
              ))}
              <th scope="col" className="px-3 py-3 text-right font-semibold">
                <span className="inline-flex items-center">
                  <span>Buying cheaper from</span>
                  <InfoTip label="Breakeven year" text={spainHelp.breakeven} />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-stone-100 dark:border-stone-800">
                <th scope="row" className="px-3 py-3 text-left font-medium">
                  {row.label}
                </th>
                {row.costs.map((cost, index) => (
                  <td key={comparison.years[index]} className="px-3 py-3 text-right">
                    <Amount eurAmount={cost} rate={rate} />
                  </td>
                ))}
                <td className="px-3 py-3 text-right">
                  {row.breakeven === undefined ? "—" : breakevenLabel(row.breakeven)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs leading-5 text-stone-500">
        A negative buying cost means the villa is worth more than the money spent by then. Interest is only the
        years in the column, not the rest of the mortgage. The tenant&apos;s deposit is not a cost. Selling costs
        are not deducted, and the {percent(inputs.rentIncreasePercent)} yearly rise is applied to each later
        season. The {percent(inputs.appreciationPercent)} appreciation rate is an estimate, not a forecast.
        {result.holidayLet.enabled
          ? " Peak-season income is in the buying cost, and the VFT registration is counted in year one."
          : ""}
        {inputs.digitalNomad
          ? " Visa costs are in the rent row and in each buy row. Non-resident tax is only on the buy side, and it is off while this visa is on."
          : ""}
      </p>
    </SectionCard>
  );
}
