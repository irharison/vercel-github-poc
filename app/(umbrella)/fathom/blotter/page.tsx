"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DataGrid, type Column } from "@/components/fathom/grid";
import { Banner, Loading, PageHeader, useDesk } from "@/components/fathom/shell";
import { api, withBook } from "@/lib/fathom/api";
import { compactDate, economics, money, productFamily } from "@/lib/fathom/format";

type Trade = {
  Id: number;
  TradingSystemReference: string;
  ProductType: string;
  Product: string;
  Status: string;
  Book: string;
  Party: string;
  PartyName: string;
  Direction: string;
  Notional: number;
  SettleCurrency: string;
  Maturity: string;
  Trader: string;
  FixedRate: number | null;
  Strike: number | null;
  OptionType: string | null;
  Underlying: string | null;
};

const PRODUCTS = ["", "BOND", "IRS", "FX_SPOT", "FX_FORWARD", "EQUITY_OPTION", "FX_OPTION", "COMMODITY_SWAP", "COMMODITY_FUTURE"];
const STATUSES = ["", "BOOKED", "VERIFIED", "CONFIRMED", "SETTLED", "CANCELLED"];

export default function BlotterPage() {
  const { book, refreshKey } = useDesk();
  const [rows, setRows] = useState<Trade[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Trade | null>(null);

  useEffect(() => {
    api<{ Trades: Trade[] }>(withBook("/api/Trades", book))
      .then((body) => setRows(body.Trades))
      .catch((err: Error) => setError(err.message));
  }, [book, refreshKey]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    return rows.filter((row) => {
      if (product && row.ProductType !== product) return false;
      if (status && row.Status !== status) return false;
      if (q) {
        const hay = `${row.TradingSystemReference} ${row.Product} ${row.Party} ${row.PartyName} ${row.Underlying ?? ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [rows, product, status, q]);

  const columns: Column<Trade>[] = [
    { key: "ref", label: "Ref", sort: (r) => r.TradingSystemReference, render: (r) => <span className="mono">{r.TradingSystemReference}</span> },
    { key: "product", label: "Product", sort: (r) => r.ProductType, render: (r) => r.ProductType.replaceAll("_", " ") },
    { key: "name", label: "Instrument", sort: (r) => r.Product, render: (r) => r.Product },
    { key: "book", label: "Book", sort: (r) => r.Book, render: (r) => r.Book },
    { key: "cpty", label: "Party", sort: (r) => r.PartyName, render: (r) => r.PartyName },
    { key: "dir", label: "Dir", sort: (r) => r.Direction, render: (r) => r.Direction },
    { key: "notional", label: "Notional", align: "right", sort: (r) => r.Notional, render: (r) => money(r.Notional) },
    { key: "ccy", label: "Ccy", render: (r) => r.SettleCurrency },
    { key: "econ", label: "Rate / strike", align: "right", sort: (r) => r.FixedRate ?? r.Strike, render: (r) => economics(r) },
    { key: "mat", label: "Maturity", sort: (r) => r.Maturity, render: (r) => compactDate(r.Maturity) },
    { key: "status", label: "Status", sort: (r) => r.Status, render: (r) => <span className={`pill ${r.Status}`}>{r.Status}</span> },
    { key: "trader", label: "Trader", sort: (r) => r.Trader, render: (r) => r.Trader },
  ];

  return (
    <>
      <PageHeader kicker="Front office" title="Trade blotter" lede="Every asset class on one grid. Filter it, sort a column, and open the row in the ticket or the lifecycle." />
      <Banner message={error} />
      <div className="toolbar">
        <input className="field" placeholder="Search ref, name, counterparty" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search trades" />
        <select className="select" value={product} onChange={(e) => setProduct(e.target.value)} aria-label="Product">
          {PRODUCTS.map((item) => (
            <option key={item} value={item}>
              {item ? item.replaceAll("_", " ") : "All products"}
            </option>
          ))}
        </select>
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          {STATUSES.map((item) => (
            <option key={item} value={item}>
              {item || "All statuses"}
            </option>
          ))}
        </select>
        <span className="faint">{filtered.length} trades</span>
      </div>
      {!rows && !error ? <Loading /> : null}
      {rows && (
        <DataGrid
          rows={filtered}
          columns={columns}
          selected={selected?.Id}
          onRow={setSelected}
          rowClass={(row) => (row.Status === "CANCELLED" ? "cancelled" : "")}
          empty="No trades match these filters."
        />
      )}
      {selected && (
        <div className="panel mt pad split">
          <div>
            <div className="kicker">{productFamily(selected.ProductType)}</div>
            <strong>{selected.Product}</strong>
            <div className="muted">
              {selected.TradingSystemReference} · {selected.PartyName} · {selected.Book}
            </div>
          </div>
          <div className="toolbar" style={{ margin: 0 }}>
            <Link className="btn" href={`/fathom/ticket/${selected.Id}`}>
              Amend
            </Link>
            <Link className="btn" href={`/fathom/lifecycle?trade=${selected.Id}`}>
              Lifecycle
            </Link>
            <Link className="btn" href={`/fathom/pricing?trade=${selected.Id}`}>
              Price
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
