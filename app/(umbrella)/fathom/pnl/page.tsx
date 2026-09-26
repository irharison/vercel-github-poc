"use client";

import { useEffect, useState } from "react";
import { DataGrid, type Column } from "@/components/fathom/grid";
import { Banner, Loading, PageHeader, useDesk } from "@/components/fathom/shell";
import { api, withBook } from "@/lib/fathom/api";
import { money, signedClass } from "@/lib/fathom/format";

type Row = {
  TradeRef: string;
  InstrumentName: string;
  Book: string;
  NewTrades: number;
  Time: number;
  Rates: number;
  Fx: number;
  Spot: number;
  Vol: number;
  Residual: number;
  Total: number;
};
type Report = { PreviousDate: string; ValuationDate: string; Rows: Row[]; Totals: Record<string, number>; Notes: string };

const KEYS = ["NewTrades", "Time", "Rates", "Fx", "Spot", "Vol", "Residual", "Total"] as const;

export default function PnlPage() {
  const { book, refreshKey } = useDesk();
  const [data, setData] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api<Report>(withBook("/api/Report/PLReport/Default", book)).then(setData).catch((err: Error) => setError(err.message));
  }, [book, refreshKey]);
  const cell = (value: number) => <span className={signedClass(value)}>{money(value)}</span>;
  const columns: Column<Row>[] = [
    { key: "ref", label: "Ref", sort: (r) => r.TradeRef, render: (r) => <span className="mono">{r.TradeRef}</span> },
    { key: "name", label: "Instrument", sort: (r) => r.InstrumentName, render: (r) => r.InstrumentName },
    { key: "book", label: "Book", render: (r) => r.Book },
    ...KEYS.map((key) => ({
      key,
      label: key === "Spot" ? "Prices" : key.replaceAll("_", " "),
      align: "right" as const,
      sort: (r: Row) => r[key],
      render: (r: Row) => cell(r[key]),
    })),
  ];
  return (
    <>
      <PageHeader kicker="P&L" title="Daily explain" lede={data ? `From ${data.PreviousDate} to ${data.ValuationDate}, in USD.` : "Why today's value differs from yesterday."} />
      <Banner message={error} />
      {!data && !error ? <Loading label="Explaining P&L…" /> : null}
      {data && (
        <>
          <div className="kpis">
            {KEYS.filter((key) => key !== "Total").slice(0, 4).map((key) => (
              <div className="panel kpi" key={key}>
                <div className="lbl">{key === "Spot" ? "Prices" : key.replaceAll(/([A-Z])/g, " $1").trim()}</div>
                <div className={`val ${signedClass(data.Totals[key])}`}>{money(data.Totals[key])}</div>
              </div>
            ))}
          </div>
          <div className="panel kpi" style={{ marginBottom: 10 }}>
            <div className="lbl">Total day P&L</div>
            <div className={`val ${signedClass(data.Totals.Total)}`}>{money(data.Totals.Total)} USD</div>
          </div>
          <DataGrid rows={data.Rows} columns={columns} empty="No P&L in this book." />
          <div className="panel note mt">{data.Notes}</div>
        </>
      )}
    </>
  );
}
