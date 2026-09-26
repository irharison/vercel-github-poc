"use client";

import { useEffect, useState } from "react";
import { Banner, Loading, PageHeader, useDesk } from "@/components/fathom/shell";
import { api } from "@/lib/fathom/api";

const EQUITY_NAMES: Record<string, string> = {
  AETHER: "Aether Robotics",
  BRIGHTLINE: "Brightline Media",
  CINDERCO: "Cinder & Co",
};

async function loadDeskMarket(): Promise<Market> {
  const pack = await api<{ Quotes: { QuoteName: string; Value: number }[] }>("/api/Quote/GetQuotesForClosings?closingName=EOD-2026-09-25");
  const fx: Record<string, number> = {};
  const fxVols: Record<string, number> = {};
  const equities: Market["equities"] = {};
  for (const quote of pack.Quotes) {
    const [kind, symbol, field] = quote.QuoteName.split(".");
    if (kind === "FX" && field === "SPOT") fx[symbol] = quote.Value;
    if (kind === "FX" && field === "VOL") fxVols[symbol] = quote.Value;
    if (kind === "EQ") {
      equities[symbol] = equities[symbol] ?? { name: EQUITY_NAMES[symbol] ?? symbol, currency: "USD", spot: 0, vol: 0, dividend_yield: 0 };
      if (field === "SPOT") equities[symbol].spot = quote.Value;
      if (field === "VOL") equities[symbol].vol = quote.Value;
      if (field === "DIV") equities[symbol].dividend_yield = quote.Value;
    }
  }
  const curves: Market["curves"] = {};
  for (const ccy of ["USD", "EUR", "GBP", "JPY"]) {
    const curve = await api<{ Pillars: { Tenor: string; Instrument: string; Rate: number }[] }>(
      `/api/InterestCurve/GetMostRecentInterestCurve?currency=${ccy}&name=${ccy}-DISC&setupName=Official`,
    );
    curves[ccy] = curve.Pillars.map((pillar) => ({ tenor: pillar.Tenor, pillar_type: pillar.Instrument, rate: pillar.Rate }));
  }
  const commodities: Market["commodities"] = {};
  for (const id of ["BRENT", "TTF", "API2"]) {
    const curve = await api<{ Name: string; Currency: string; Unit: string; Pillars: { Tenor: string; Price: number }[] }>(
      `/api/CommodityCurve/GetMostRecentCommodityCurve?commodityId=${id}&setupName=Official`,
    );
    commodities[id] = {
      name: curve.Name,
      currency: curve.Currency,
      unit: curve.Unit,
      pillars: curve.Pillars.map((pillar) => ({ tenor: pillar.Tenor, price: pillar.Price })),
    };
  }
  return { as_of: "2026-09-25", curves, fx, fx_vols: fxVols, equities, commodities };
}

type Market = {
  as_of: string;
  curves: Record<string, { tenor: string; pillar_type: string; rate: number }[]>;
  fx: Record<string, number>;
  fx_vols: Record<string, number>;
  equities: Record<string, { name: string; currency: string; spot: number; vol: number; dividend_yield: number }>;
  commodities: Record<string, { name: string; currency: string; unit: string; pillars: { tenor: string; price: number }[] }>;
};

export default function MarketPage() {
  const { bump, refreshKey } = useDesk();
  const [tab, setTab] = useState<"curves" | "fx" | "equities" | "commodities">("curves");
  const [ccy, setCcy] = useState("USD");
  const [market, setMarket] = useState<Market | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadDeskMarket()
      .then(setMarket)
      .catch((err: Error) => setError(err.message));
  }, [refreshKey]);

  async function save(next: Market) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const quotes = [
        ...Object.entries(next.fx).flatMap(([pair, spot]) => [
          { QuoteName: `FX.${pair}.SPOT`, Value: spot },
          { QuoteName: `FX.${pair}.VOL`, Value: next.fx_vols[pair] },
        ]),
        ...Object.entries(next.equities).flatMap(([ticker, row]) => [
          { QuoteName: `EQ.${ticker}.SPOT`, Value: row.spot },
          { QuoteName: `EQ.${ticker}.VOL`, Value: row.vol },
          { QuoteName: `EQ.${ticker}.DIV`, Value: row.dividend_yield },
        ]),
      ];
      await api("/api/Quote/SaveQuotes", {
        method: "POST",
        body: JSON.stringify({ ClosingName: "EOD-2026-09-25", Quotes: quotes }),
      });
      for (const [ccy, pillars] of Object.entries(next.curves)) {
        await api("/api/InterestCurve/SaveInterestCurve", {
          method: "POST",
          body: JSON.stringify({
            Currency: ccy,
            Name: `${ccy}-DISC`,
            SetupName: "Official",
            Pillars: pillars.map((pillar) => ({ Tenor: pillar.tenor, Instrument: pillar.pillar_type, Rate: pillar.rate })),
          }),
        });
      }
      for (const [name, row] of Object.entries(next.commodities)) {
        await api("/api/CommodityCurve/SaveCommodityCurve", {
          method: "POST",
          body: JSON.stringify({
            CommodityId: name,
            SetupName: "Official",
            Pillars: row.pillars.map((pillar) => ({ Tenor: pillar.tenor, Price: pillar.price })),
          }),
        });
      }
      setMarket(await loadDeskMarket());
      setNotice("Today's closing is saved. Pricing and P&L use it immediately. Yesterday's closing is unchanged.");
      bump();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  function patch(mutator: (draft: Market) => void) {
    if (!market) return;
    const draft = structuredClone(market);
    mutator(draft);
    setMarket(draft);
  }

  return (
    <>
      <PageHeader
        kicker="Market data"
        title="Curves, FX, vols"
        lede="These levels are fictional. Edit them and save. The P&L explain compares the result with yesterday's frozen close."
      />
      <Banner message={error} />
      {notice && <div className="panel note" style={{ marginBottom: 10 }}>{notice}</div>}
      {!market ? <Loading /> : null}
      {market && (
        <>
          <div className="tabs">
            {(["curves", "fx", "equities", "commodities"] as const).map((item) => (
              <button key={item} className={tab === item ? "on" : ""} onClick={() => setTab(item)}>
                {item}
              </button>
            ))}
            <button className="btn" disabled={busy} onClick={() => save(market)}>
              {busy ? "Saving…" : "Save market"}
            </button>
            <button
              className="btn"
              disabled={busy}
              onClick={() => {
                const draft = structuredClone(market);
                draft.curves.USD = draft.curves.USD.map((pillar) => ({ ...pillar, rate: Number((pillar.rate + 0.0001).toFixed(6)) }));
                setMarket(draft);
                void save(draft);
              }}
            >
              USD +1bp and save
            </button>
            <span className="faint">As of {market.as_of}</span>
          </div>
          {tab === "curves" && (
            <div className="panel">
              <div className="panel-hd">
                Yield pillars
                <select className="select" value={ccy} onChange={(e) => setCcy(e.target.value)}>
                  {Object.keys(market.curves).map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div className="note">Deposit pillars are short money-market rates. Swap pillars are par fixed rates. Rates are decimals: 0.0400 is 4.00%.</div>
              <table className="grid">
                <thead>
                  <tr>
                    <th>Tenor</th>
                    <th>Type</th>
                    <th className="num">Rate</th>
                    <th className="num">Percent</th>
                  </tr>
                </thead>
                <tbody>
                  {market.curves[ccy].map((pillar, index) => (
                    <tr key={pillar.tenor}>
                      <td className="mono">{pillar.tenor}</td>
                      <td>{pillar.pillar_type}</td>
                      <td className="num">
                        <input
                          className="field"
                          style={{ width: 120, textAlign: "right" }}
                          value={pillar.rate}
                          onChange={(e) =>
                            patch((draft) => {
                              draft.curves[ccy][index].rate = Number(e.target.value);
                            })
                          }
                        />
                      </td>
                      <td className="num">{(pillar.rate * 100).toFixed(3)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {tab === "fx" && (
            <div className="panel">
              <table className="grid">
                <thead>
                  <tr>
                    <th>Pair</th>
                    <th className="num">Spot</th>
                    <th className="num">ATM vol</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(market.fx).map((pair) => (
                    <tr key={pair}>
                      <td className="mono">{pair}</td>
                      <td className="num">
                        <input className="field" style={{ width: 120, textAlign: "right" }} value={market.fx[pair]} onChange={(e) => patch((draft) => { draft.fx[pair] = Number(e.target.value); })} />
                      </td>
                      <td className="num">
                        <input className="field" style={{ width: 120, textAlign: "right" }} value={market.fx_vols[pair]} onChange={(e) => patch((draft) => { draft.fx_vols[pair] = Number(e.target.value); })} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="note">Volatility is absolute. 0.082 means 8.2%. The demo uses one flat ATM vol per pair, not a strike-tenor surface.</div>
            </div>
          )}
          {tab === "equities" && (
            <div className="panel">
              <table className="grid">
                <thead>
                  <tr>
                    <th>Ticker</th>
                    <th>Name</th>
                    <th className="num">Spot</th>
                    <th className="num">Vol</th>
                    <th className="num">Dividend</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(market.equities).map(([ticker, row]) => (
                    <tr key={ticker}>
                      <td className="mono">{ticker}</td>
                      <td>{row.name}</td>
                      <td className="num">
                        <input className="field" style={{ width: 100, textAlign: "right" }} value={row.spot} onChange={(e) => patch((draft) => { draft.equities[ticker].spot = Number(e.target.value); })} />
                      </td>
                      <td className="num">
                        <input className="field" style={{ width: 100, textAlign: "right" }} value={row.vol} onChange={(e) => patch((draft) => { draft.equities[ticker].vol = Number(e.target.value); })} />
                      </td>
                      <td className="num">
                        <input className="field" style={{ width: 100, textAlign: "right" }} value={row.dividend_yield} onChange={(e) => patch((draft) => { draft.equities[ticker].dividend_yield = Number(e.target.value); })} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {tab === "commodities" && (
            <div className="layout-main">
              {Object.entries(market.commodities).map(([name, row]) => (
                <div className="panel" key={name}>
                  <div className="panel-hd">
                    {row.name}
                    <span>
                      {row.currency}/{row.unit}
                    </span>
                  </div>
                  <table className="grid">
                    <tbody>
                      {row.pillars.map((pillar, index) => (
                        <tr key={pillar.tenor}>
                          <td className="mono">{pillar.tenor}</td>
                          <td className="num">
                            <input
                              className="field"
                              style={{ width: 120, textAlign: "right" }}
                              value={pillar.price}
                              onChange={(e) =>
                                patch((draft) => {
                                  draft.commodities[name].pillars[index].price = Number(e.target.value);
                                })
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
