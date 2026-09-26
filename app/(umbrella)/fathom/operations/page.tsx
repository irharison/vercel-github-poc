"use client";

import { useEffect, useState } from "react";
import { Banner, Loading, PageHeader, useDesk } from "@/components/fathom/shell";
import { api, withBook } from "@/lib/fathom/api";
import { money, signedClass } from "@/lib/fathom/format";

type Ladder = {
  Currencies: string[];
  Ladder: { Date: string; Amounts: Record<string, number> }[];
  Flows: { Date: string; Currency: string; Amount: number; Kind: string; Estimated: boolean; TradeRef: string; InstrumentName: string; Book: string }[];
};

export default function OperationsPage() {
  const { book, refreshKey } = useDesk();
  const [data, setData] = useState<Ladder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [day, setDay] = useState<string | null>(null);
  useEffect(() => {
    api<Ladder>(withBook("/api/Report/CashFlowReport/Default", book)).then((body) => {
      setData(body);
      setDay(body.Ladder[0]?.Date ?? null);
    }).catch((err: Error) => setError(err.message));
  }, [book, refreshKey]);
  const flows = data?.Flows.filter((row) => row.Date === day) ?? [];
  return (
    <>
      <PageHeader kicker="Operations" title="Settlement ladder" lede="Future cash by value date and currency. Estimated rows are floating coupons or forwards, not invoices." />
      <Banner message={error} />
      {!data && !error ? <Loading /> : null}
      {data && (
        <div className="layout-2">
          <div className="panel grid-wrap">
            <table className="grid">
              <thead>
                <tr>
                  <th>Date</th>
                  {data.Currencies.map((ccy) => (
                    <th key={ccy} className="num">{ccy}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.Ladder.length === 0 ? (
                  <tr><td className="muted">No future cash in this filter.</td></tr>
                ) : data.Ladder.map((row) => (
                  <tr key={row.Date} className={day === row.Date ? "selected" : ""} onClick={() => setDay(row.Date)} style={{ cursor: "pointer" }}>
                    <td className="mono">{row.Date}</td>
                    {data.Currencies.map((ccy) => (
                      <td key={ccy} className={`num ${signedClass(row.Amounts[ccy])}`}>{row.Amounts[ccy] ? money(row.Amounts[ccy]) : ""}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <section className="panel">
            <div className="panel-hd">Flows on {day ?? "—"}</div>
            <table className="grid">
              <tbody>
                {flows.map((row, index) => (
                  <tr key={`${row.TradeRef}-${index}`}>
                    <td>
                      <div className="mono">{row.TradeRef}</div>
                      <div className="muted">{row.InstrumentName}</div>
                    </td>
                    <td>{row.Kind}{row.Estimated ? " · est." : ""}</td>
                    <td className={`num ${signedClass(row.Amount)}`}>{money(row.Amount)} {row.Currency}</td>
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
