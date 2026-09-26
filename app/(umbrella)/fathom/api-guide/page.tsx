"use client";

import { useEffect, useState } from "react";
import { Banner, Loading, PageHeader } from "@/components/fathom/shell";

type Spec = {
  paths: Record<string, Record<string, { summary?: string; description?: string; tags?: string[] }>>;
};

const SAMPLES = [
  {
    title: "Book a swap",
    method: "POST",
    path: "/fathom/api/Trades",
    body: `{
  "Product": "USD 2Y pay fixed 4%",
  "ProductType": "IRS",
  "Book": "LN-RATES",
  "Party": "HELIOS",
  "Direction": "PAY",
  "Notional": 5000000,
  "SettleCurrency": "USD",
  "FixedRate": 0.04,
  "TradeTime": "2026-09-25",
  "SettlementDate": "2026-09-29",
  "Maturity": "2028-09-29",
  "PayFrequency": "6M"
}`,
  },
  {
    title: "Verify it",
    method: "PUT",
    path: "/fathom/api/Trades",
    body: `{ "Id": 19, "Action": "verify", "Message": "Checked." }`,
  },
  {
    title: "Read the mark",
    method: "GET",
    path: "/fathom/api/Pricing/GetTradePriceFromTradeId?tradeId=19",
    body: "",
  },
];

export default function ApiGuidePage() {
  const [spec, setSpec] = useState<Spec | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetch("/fathom/openapi.json")
      .then((response) => {
        if (!response.ok) throw new Error("OpenAPI schema is not reachable.");
        return response.json();
      })
      .then(setSpec)
      .catch((err: Error) => setError(err.message));
  }, []);

  const rows = spec
    ? Object.entries(spec.paths).flatMap(([path, methods]) =>
        Object.entries(methods)
          .filter(([method]) => ["get", "post", "put", "patch"].includes(method))
          .map(([method, op]) => ({
            method: method.toUpperCase(),
            path,
            tag: op.tags?.[0] ?? "api",
            text: op.description || op.summary || "",
          })),
      )
    : [];

  return (
    <>
      <PageHeader
        kicker="Integration"
        title="REST API"
        lede="The screens are a client of this API. Paths follow the public Orchestrade Web API shape under /fathom (PascalCase resources, HTTP Basic). Swagger is the live reference. The site sign-in is already done; in Swagger, authorize as desk / fathom."
      />
      <Banner message={error} />
      <div className="toolbar">
        <a className="btn primary" href="/fathom/docs" target="_blank" rel="noreferrer">Open Swagger</a>
        <a className="btn" href="/fathom/openapi.json" target="_blank" rel="noreferrer">openapi.json</a>
      </div>
      <div className="layout-2">
        <section className="panel">
          <div className="panel-hd">Try these first</div>
          {SAMPLES.map((sample) => (
            <div key={sample.title} className="pad" style={{ borderBottom: "1px solid var(--line)" }}>
              <div className="kicker">{sample.title}</div>
              <div className="mono">
                {sample.method} {sample.path}
              </div>
              {sample.body && <pre className="mono muted" style={{ whiteSpace: "pre-wrap" }}>{sample.body}</pre>}
            </div>
          ))}
        </section>
        <section className="panel">
          <div className="panel-hd">Routes</div>
          {!spec && !error ? <Loading label="Reading the schema…" /> : null}
          <table className="grid">
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.method} ${row.path}`}>
                  <td className="mono tag">{row.method}</td>
                  <td>
                    <div className="mono">{row.path}</div>
                    <div className="muted">{row.text.slice(0, 140)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}
