"use client";

import { useEffect, useState } from "react";
import { DataGrid, type Column } from "@/components/fathom/grid";
import { Banner, Loading, PageHeader, useDesk } from "@/components/fathom/shell";
import { api, withBook } from "@/lib/fathom/api";
import { money, signedClass } from "@/lib/fathom/format";

type Row = {
  Book: string;
  ProductType: string;
  Instrument: string;
  Currency: string;
  Trades: number;
  SignedNotional: number;
  PvUsd: number;
};
type Report = {
  Rows: Row[];
  PvUsd: number;
  CurrencyPosition: { Currency: string; Amount: number; Usd: number }[];
};

export default function PositionsPage() {
  const { book, refreshKey } = useDesk();
  const [data, setData] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api<Report>(withBook("/api/Position/LoadPositionsFromFilter?pricingSetupName=Official", book)).then(setData).catch((err: Error) => setError(err.message));
  }, [book, refreshKey]);
  const columns: Column<Row>[] = [
    { key: "book", label: "Book", sort: (r) => r.Book, render: (r) => r.Book },
    { key: "product", label: "Product", sort: (r) => r.ProductType, render: (r) => r.ProductType.replaceAll("_", " ") },
    { key: "inst", label: "Instrument", sort: (r) => r.Instrument, render: (r) => r.Instrument },
    { key: "ccy", label: "Ccy", render: (r) => r.Currency },
    { key: "n", label: "Trades", align: "right", sort: (r) => r.Trades, render: (r) => r.Trades },
    { key: "qty", label: "Signed notional", align: "right", sort: (r) => r.SignedNotional, render: (r) => <span className={signedClass(r.SignedNotional)}>{money(r.SignedNotional)}</span> },
    { key: "pv", label: "PV USD", align: "right", sort: (r) => r.PvUsd, render: (r) => <span className={signedClass(r.PvUsd)}>{money(r.PvUsd)}</span> },
  ];
  return (
    <>
      <PageHeader kicker="Front office" title="Positions" lede="Trades rolled up by book and instrument. Signed notional is positive when the book is long or receiving fixed." />
      <Banner message={error} />
      {!data && !error ? <Loading /> : null}
      {data && (
        <div className="layout-2">
          <div>
            <div className="panel kpi" style={{ marginBottom: 8 }}>
              <div className="lbl">Open PV</div>
              <div className={`val ${signedClass(data.PvUsd)}`}>{money(data.PvUsd)}</div>
            </div>
            <DataGrid rows={data.Rows.map((row, index) => ({ ...row, id: index }))} columns={columns} empty="No open positions in this book." />
          </div>
          <section className="panel">
            <div className="panel-hd">FX currency position</div>
            <div className="note">Amounts the FX spots and forwards will exchange. Not a cash balance at the bank.</div>
            <table className="grid">
              <thead><tr><th>Currency</th><th className="num">Amount</th><th className="num">USD</th></tr></thead>
              <tbody>
                {data.CurrencyPosition.length === 0 ? (
                  <tr><td colSpan={3} className="muted">No open FX trades in this filter.</td></tr>
                ) : data.CurrencyPosition.map((row) => (
                  <tr key={row.Currency}>
                    <td>{row.Currency}</td>
                    <td className={`num ${signedClass(row.Amount)}`}>{money(row.Amount)}</td>
                    <td className={`num ${signedClass(row.Usd)}`}>{money(row.Usd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </>
  );
}
