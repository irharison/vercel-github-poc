"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Banner, Loading, PageHeader, useDesk } from "@/components/fathom/shell";
import { api, withBook } from "@/lib/fathom/api";
import { money, signedClass } from "@/lib/fathom/format";

type Summary = {
  ValuationDate: string;
  PreviousDate: string;
  PvUsd: number;
  DayPnl: number;
  Dv01: number;
  Var95: number;
  Var99: number;
  Counts: Record<string, number>;
  Attention: { TradeId: number; TradeRef: string; InstrumentName: string; Status: string; Book: string; ProductType: string }[];
  PnlTotals: Record<string, number>;
};

const STEPS = [
  ["NewTrades", "New trades"],
  ["Time", "Time"],
  ["Rates", "Rates"],
  ["Fx", "FX"],
  ["Spot", "Prices"],
  ["Vol", "Volatility"],
  ["Residual", "Residual"],
];

export default function CockpitPage() {
  const { book, refreshKey } = useDesk();
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<Summary>(withBook("/api/Risk/AnalysisReport?analysisName=Desk", book))
      .then((body) => {
        if (cancelled) return;
        setError(null);
        setData(body);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || "The desk API is not responding. Start it with npm run dev:api.");
      });
    return () => {
      cancelled = true;
    };
  }, [book, refreshKey]);

  const max = data ? Math.max(...STEPS.map(([key]) => Math.abs(data.PnlTotals[key] || 0)), 1) : 1;

  return (
    <>
      <PageHeader
        kicker="Portfolio"
        title="Cockpit"
        lede="Open value, overnight P&L, and the trades still waiting on a human check. The book is fictional and the valuation date is fixed so the lesson does not move under you."
      />
      <Banner message={error} />
      {!data && !error ? <Loading /> : null}
      {data && (
        <>
          <div className="kpis">
            <div className="panel kpi">
              <div className="lbl">Open PV</div>
              <div className={`val ${signedClass(data.PvUsd)}`}>{money(data.PvUsd)}</div>
              <div className="sub">USD, live trades</div>
            </div>
            <div className="panel kpi">
              <div className="lbl">Day P&L</div>
              <div className={`val ${signedClass(data.DayPnl)}`}>{money(data.DayPnl)}</div>
              <div className="sub">since {data.PreviousDate}</div>
            </div>
            <div className="panel kpi">
              <div className="lbl">Parallel DV01</div>
              <div className="val">{money(data.Dv01)}</div>
              <div className="sub">USD lost if yields +1bp</div>
            </div>
            <div className="panel kpi">
              <div className="lbl">1-day VaR 95</div>
              <div className="val">{money(data.Var95)}</div>
              <div className="sub">historical, linear · 99 param {money(data.Var99)}</div>
            </div>
          </div>
          <div className="layout-2">
            <section className="panel">
              <div className="panel-hd">
                P&L explain
                <Link href="/fathom/pnl">Open</Link>
              </div>
              <div className="bars">
                {STEPS.map(([key, label]) => {
                  const value = data.PnlTotals[key] || 0;
                  const width = `${(Math.abs(value) / max) * 100}%`;
                  return (
                    <div className="bar-row" key={key}>
                      <span className="muted">{label}</span>
                      <div className="track">
                        <i style={{ width, background: value >= 0 ? "var(--up)" : "var(--down)" }} />
                      </div>
                      <span className={signedClass(value)}>{money(value)}</span>
                    </div>
                  );
                })}
              </div>
            </section>
            <section className="panel">
              <div className="panel-hd">
                Needs a decision
                <Link href="/fathom/lifecycle">Lifecycle</Link>
              </div>
              {data.Attention.length === 0 ? (
                <div className="note">Nothing is sitting in Booked or Verified.</div>
              ) : (
                <div className="grid-wrap" style={{ maxHeight: 280, border: 0 }}>
                  <table className="grid">
                    <tbody>
                      {data.Attention.map((row) => (
                        <tr key={row.TradeId}>
                          <td className="mono">{row.TradeRef}</td>
                          <td>{row.InstrumentName}</td>
                          <td>
                            <span className={`pill ${row.Status}`}>{row.Status}</span>
                          </td>
                          <td>
                            <Link href={`/fathom/lifecycle?trade=${row.TradeId}`}>Open</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="note">
                {Object.entries(data.Counts)
                  .map(([status, count]) => `${status} ${count}`)
                  .join(" · ")}
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}
