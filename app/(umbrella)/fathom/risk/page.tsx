"use client";

import { useEffect, useState } from "react";
import { DataGrid, type Column } from "@/components/fathom/grid";
import { Banner, Loading, PageHeader, useDesk } from "@/components/fathom/shell";
import { api, withBook } from "@/lib/fathom/api";
import { money, signedClass } from "@/lib/fathom/format";

type SensRow = {
  TradeRef: string;
  InstrumentName: string;
  Book: string;
  PvUsd: number;
  Dv01: number;
  Delta: number | null;
  Vega: number | null;
};

type Sens = { Rows: SensRow[]; Totals: { PvUsd: number; Dv01: number; Vega: number }; Buckets: { Label: string; Dv01: number }[]; Notes: Record<string, string> };
type VarReport = {
  Observations: number;
  Method: string;
  Parametric: { Var95: number; Var99: number; Sigma: number };
  Historical: { Var95: number; Var99: number; ExpectedShortfall95: number };
  Factors: { Factor: string; Exposure: number; ComponentVar95: number; Share: number }[];
};
type Stress = {
  Scenarios: {
    Id: string;
    Name: string;
    PnlUsd: number;
    ByBook: { Book: string; PnlUsd: number }[];
    Worst: { TradeRef: string; InstrumentName: string; PnlUsd: number }[];
  }[];
};

export default function RiskPage() {
  const { book, refreshKey } = useDesk();
  const [tab, setTab] = useState<"sens" | "var" | "stress">("sens");
  const [sens, setSens] = useState<Sens | null>(null);
  const [varReport, setVarReport] = useState<VarReport | null>(null);
  const [stress, setStress] = useState<Stress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shock, setShock] = useState({ rate_bp: 50, usd_strength_pct: 0, equity_pct: -10, vol_points: 2, commodity_pct: 0 });
  const [custom, setCustom] = useState<Stress["Scenarios"][number] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = tab === "sens" ? api<Sens>(withBook("/api/Risk/AnalysisReport?analysisName=Sensitivities", book)).then((body) => {
      if (!cancelled) setSens(body);
    })
      : tab === "var" ? api<VarReport>(withBook("/api/Report/VaRReport/Default", book)).then((body) => {
        if (!cancelled) setVarReport(body);
      })
      : api<Stress>(withBook("/api/Report/ScenarioReport/Default", book)).then((body) => {
        if (!cancelled) setStress(body);
      });
    load.then(() => {
      if (!cancelled) setError(null);
    }).catch((err: Error) => {
      if (!cancelled) setError(err.message);
    });
    return () => {
      cancelled = true;
    };
  }, [tab, book, refreshKey]);

  const columns: Column<SensRow>[] = [
    { key: "ref", label: "Ref", sort: (r) => r.TradeRef, render: (r) => <span className="mono">{r.TradeRef}</span> },
    { key: "name", label: "Instrument", sort: (r) => r.InstrumentName, render: (r) => r.InstrumentName },
    { key: "book", label: "Book", render: (r) => r.Book },
    { key: "pv", label: "PV", align: "right", sort: (r) => r.PvUsd, render: (r) => <span className={signedClass(r.PvUsd)}>{money(r.PvUsd)}</span> },
    { key: "dv01", label: "DV01", align: "right", sort: (r) => r.Dv01, render: (r) => money(r.Dv01) },
    { key: "delta", label: "Delta", align: "right", sort: (r) => r.Delta, render: (r) => (r.Delta == null ? "—" : money(r.Delta, 0)) },
    { key: "vega", label: "Vega", align: "right", sort: (r) => r.Vega, render: (r) => (r.Vega == null ? "—" : money(r.Vega)) },
  ];

  const bucketMax = sens ? Math.max(...sens.Buckets.map((b) => Math.abs(b.Dv01)), 1) : 1;

  return (
    <>
      <PageHeader kicker="Risk" title="Sensitivities, VaR, stress" lede="How the book moves when the market moves. DV01 and greeks are bumps. VaR is a distribution. Stress is a story you can say out loud." />
      <Banner message={error} />
      <div className="tabs">
        <button className={tab === "sens" ? "on" : ""} onClick={() => setTab("sens")}>Sensitivities</button>
        <button className={tab === "var" ? "on" : ""} onClick={() => setTab("var")}>VaR</button>
        <button className={tab === "stress" ? "on" : ""} onClick={() => setTab("stress")}>Stress</button>
      </div>
      {tab === "sens" && !sens && !error && <Loading label="Bumping curves…" />}
      {tab === "sens" && sens && (
        <>
          <div className="kpis">
            <div className="panel kpi"><div className="lbl">Parallel DV01</div><div className="val">{money(sens.Totals.Dv01)}</div><div className="sub">USD per +1bp</div></div>
            <div className="panel kpi"><div className="lbl">Option vega</div><div className="val">{money(sens.Totals.Vega)}</div><div className="sub">USD per +1 vol point</div></div>
          </div>
          <DataGrid rows={sens.Rows} columns={columns} />
          <section className="panel mt">
            <div className="panel-hd">Pillar DV01</div>
            <div className="bars">
              {sens.Buckets.map((bucket) => (
                <div className="bar-row" key={bucket.Label}>
                  <span>{bucket.Label}</span>
                  <div className="track"><i style={{ width: `${(Math.abs(bucket.Dv01) / bucketMax) * 100}%`, background: bucket.Dv01 >= 0 ? "var(--brass)" : "var(--info)" }} /></div>
                  <span>{money(bucket.Dv01)}</span>
                </div>
              ))}
            </div>
            <div className="note">{sens.Notes.Dv01} {sens.Notes.Buckets}</div>
          </section>
        </>
      )}
      {tab === "var" && !varReport && !error && <Loading label="Reading scenarios…" />}
      {tab === "var" && varReport && (
        <>
          <div className="kpis">
            <div className="panel kpi"><div className="lbl">Historical 95</div><div className="val">{money(varReport.Historical.Var95)}</div><div className="sub">{varReport.Observations} synthetic days</div></div>
            <div className="panel kpi"><div className="lbl">Historical 99</div><div className="val">{money(varReport.Historical.Var99)}</div><div className="sub">ES 95 {money(varReport.Historical.ExpectedShortfall95)}</div></div>
            <div className="panel kpi"><div className="lbl">Parametric 95</div><div className="val">{money(varReport.Parametric.Var95)}</div><div className="sub">1.64 × σ</div></div>
            <div className="panel kpi"><div className="lbl">Parametric 99</div><div className="val">{money(varReport.Parametric.Var99)}</div><div className="sub">σ {money(varReport.Parametric.Sigma)}</div></div>
          </div>
          <div className="panel">
            <div className="panel-hd">Factor contribution to parametric VaR 95</div>
            <table className="grid">
              <thead><tr><th>Factor</th><th className="num">Exposure</th><th className="num">Component</th><th className="num">Share</th></tr></thead>
              <tbody>
                {varReport.Factors.slice(0, 12).map((factor) => (
                  <tr key={factor.Factor}>
                    <td className="mono">{factor.Factor}</td>
                    <td className="num">{money(factor.Exposure)}</td>
                    <td className="num">{money(factor.ComponentVar95)}</td>
                    <td className="num">{(factor.Share * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="note">{varReport.Method}</div>
          </div>
        </>
      )}
      {tab === "stress" && !stress && !error && <Loading label="Revaluing shocks…" />}
      {tab === "stress" && stress && (
        <>
          <div className="kpis">
            {stress.Scenarios.map((scenario) => (
              <div className="panel kpi" key={scenario.Id}>
                <div className="lbl">{scenario.Name}</div>
                <div className={`val ${signedClass(scenario.PnlUsd)}`}>{money(scenario.PnlUsd)}</div>
                <div className="sub">{scenario.ByBook.map((row) => `${row.Book} ${money(row.PnlUsd)}`).slice(0, 2).join(" · ")}</div>
              </div>
            ))}
          </div>
          <section className="panel">
            <div className="panel-hd">Custom full revaluation</div>
            <div className="form-grid">
              {([
                ["rate_bp", "Rates (bp)"],
                ["usd_strength_pct", "USD strength %"],
                ["equity_pct", "Equities %"],
                ["vol_points", "Vol points"],
                ["commodity_pct", "Commodities %"],
              ] as const).map(([key, label]) => (
                <label className="stack" key={key}>
                  {label}
                  <input className="field" value={shock[key]} onChange={(e) => setShock({ ...shock, [key]: Number(e.target.value) })} />
                </label>
              ))}
            </div>
            <div className="pad">
              <button
                className="btn primary"
                onClick={async () => {
                  setError(null);
                  try {
                    const params = new URLSearchParams({
                      name: "Custom",
                      rateBp: String(shock.rate_bp),
                      usdStrengthPct: String(shock.usd_strength_pct),
                      equityPct: String(shock.equity_pct),
                      volPoints: String(shock.vol_points),
                      commodityPct: String(shock.commodity_pct),
                    });
                    const body = await api<Stress>(withBook(`/api/Report/ScenarioReport/Custom?${params}`, book));
                    setCustom(body.Scenarios[0]);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Stress failed");
                  }
                }}
              >
                Run shock
              </button>
              {custom && (
                <div className="mt">
                  <div className={signedClass(custom.PnlUsd)} style={{ fontSize: 22 }}>{money(custom.PnlUsd)} USD</div>
                  {custom.Worst.map((row) => (
                    <div key={row.TradeRef} className="split">
                      <span>{row.TradeRef} {row.InstrumentName}</span>
                      <span className={signedClass(row.PnlUsd)}>{money(row.PnlUsd)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </>
  );
}
