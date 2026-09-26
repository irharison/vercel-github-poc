"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { DataGrid, type Column } from "@/components/fathom/grid";
import { Banner, Loading, PageHeader, useDesk } from "@/components/fathom/shell";
import { api, withBook } from "@/lib/fathom/api";
import { money, signedClass } from "@/lib/fathom/format";

type Row = {
  Id: number;
  TradingSystemReference: string;
  Product: string;
  ProductType: string;
  Book: string;
  Status: string;
  Valuation: {
    Live: boolean;
    PvUsd: number | null;
    Model: string | null;
    Explanation: string | null;
    Measures: Record<string, number | boolean | null>;
    Cashflows: { Date: string; Amount: number; Currency: string; Kind: string; Estimated: boolean }[];
  } | null;
};

function PricingInner() {
  const params = useSearchParams();
  const focus = params.get("trade");
  const { book, refreshKey } = useDesk();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [selected, setSelected] = useState<Row | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ Trades: Row[] }>(withBook("/api/Position/LoadTradesAndPositionsFromFilter?pricingSetupName=Official", book))
      .then((body) => {
        setRows(body.Trades);
        const match = body.Trades.find((row) => String(row.Id) === focus) ?? body.Trades.find((row) => row.Valuation?.Live) ?? null;
        setSelected(match);
      })
      .catch((err: Error) => setError(err.message));
  }, [book, refreshKey, focus]);

  const columns: Column<Row>[] = [
    { key: "ref", label: "Ref", sort: (r) => r.TradingSystemReference, render: (r) => <span className="mono">{r.TradingSystemReference}</span> },
    { key: "name", label: "Instrument", sort: (r) => r.Product, render: (r) => r.Product },
    { key: "product", label: "Product", sort: (r) => r.ProductType, render: (r) => r.ProductType.replaceAll("_", " ") },
    { key: "book", label: "Book", render: (r) => r.Book },
    {
      key: "pv",
      label: "PV USD",
      align: "right",
      sort: (r) => r.Valuation?.PvUsd ?? null,
      render: (r) => <span className={signedClass(r.Valuation?.PvUsd)}>{r.Valuation?.Live ? money(r.Valuation?.PvUsd) : "—"}</span>,
    },
    { key: "model", label: "Model", render: (r) => <span className="muted">{r.Valuation?.Model ?? (r.Valuation?.Live ? "" : "Not in the open book")}</span> },
  ];

  return (
    <>
      <PageHeader kicker="Valuation" title="Pricing" lede="QuantLib marks the open book from the curves and spots on the market screen. Select a row to read the model in plain English." />
      <Banner message={error} />
      {!rows ? <Loading label="Pricing the book…" /> : null}
      {rows && (
        <div className="layout-2">
          <DataGrid
            rows={rows}
            columns={columns}
            selected={selected?.Id}
            onRow={setSelected}
            empty="No trades in this book."
          />
          <section className="panel">
            <div className="panel-hd">{selected?.TradingSystemReference ?? "Detail"}</div>
            {!selected?.Valuation?.Explanation ? (
              <div className="note">This trade is cancelled or already matured, so it has no open present value.</div>
            ) : (
              <div className="pad">
                <div className={`mono ${signedClass(selected.Valuation.PvUsd)}`} style={{ fontSize: 26 }}>
                  {money(selected.Valuation.PvUsd)} USD
                </div>
                <p className="tag">{selected.Valuation.Model}</p>
                <p>{selected.Valuation.Explanation}</p>
                <div className="faint">Measures</div>
                {Object.entries(selected.Valuation.Measures).map(([key, value]) => (
                  <div key={key} className="mono" style={{ fontSize: 12 }}>
                    {key}: {typeof value === "number" ? value.toLocaleString("en-US", { maximumFractionDigits: 6 }) : String(value)}
                  </div>
                ))}
                <div className="faint mt">Upcoming cash</div>
                {selected.Valuation.Cashflows.slice(0, 8).map((cf, index) => (
                  <div key={`${cf.Date}-${index}`} className="split mono" style={{ fontSize: 12 }}>
                    <span>
                      {cf.Date} {cf.Kind}
                      {cf.Estimated ? " · est." : ""}
                    </span>
                    <span className={signedClass(cf.Amount)}>
                      {money(cf.Amount, 0)} {cf.Currency}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PricingInner />
    </Suspense>
  );
}
