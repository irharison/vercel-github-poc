"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Banner, PageHeader, useDesk } from "@/components/fathom/shell";
import { ApiError, api, fieldErrors } from "@/lib/fathom/api";
import { money, signedClass } from "@/lib/fathom/format";

type Book = { code: string; name: string; active: boolean };
type Party = { code: string; name: string; active: boolean };
type Price = {
  PvUsd: number;
  Model: string;
  Explanation: string;
  Measures: Record<string, number | boolean | null>;
  Inputs: Record<string, number | string | null>;
};

const PRODUCTS = ["BOND", "IRS", "FX_SPOT", "FX_FORWARD", "EQUITY_OPTION", "FX_OPTION", "COMMODITY_SWAP", "COMMODITY_FUTURE"];

const EMPTY: Record<string, string> = {
  product_type: "IRS",
  instrument_name: "",
  book: "LN-RATES",
  counterparty: "HELIOS",
  direction: "PAY",
  notional: "10000000",
  notional_currency: "USD",
  secondary_currency: "",
  rate_display: "4.000",
  strike: "",
  premium: "",
  quantity: "",
  multiplier: "",
  underlying: "",
  option_type: "CALL",
  trade_date: "2026-09-25",
  start_date: "2026-09-29",
  maturity_date: "2031-09-29",
  pay_frequency: "6M",
  trader: "demo.user",
  notes: "",
};

function defaultsFor(product: string): Record<string, string> {
  const base = { ...EMPTY, product_type: product, instrument_name: "" };
  if (product === "BOND") {
    return { ...base, direction: "BUY", rate_display: "4.000", start_date: "2026-03-15", maturity_date: "2031-03-15", pay_frequency: "6M", notional: "5000000" };
  }
  if (product === "IRS") return { ...base, direction: "PAY", rate_display: "3.900", pay_frequency: "6M" };
  if (product === "FX_SPOT") {
    return { ...base, direction: "BUY", book: "NY-FX", underlying: "EURUSD", notional_currency: "EUR", secondary_currency: "USD", rate_display: "1.0850", notional: "5000000", start_date: "2026-09-29", maturity_date: "2026-09-29" };
  }
  if (product === "FX_FORWARD") {
    return { ...base, direction: "BUY", book: "NY-FX", underlying: "EURUSD", notional_currency: "EUR", secondary_currency: "USD", rate_display: "1.0900", notional: "5000000", start_date: "2026-09-25", maturity_date: "2026-12-29" };
  }
  if (product === "EQUITY_OPTION") {
    return { ...base, direction: "BUY", book: "LN-EQD", underlying: "AETHER", notional_currency: "USD", strike: "90", premium: "3.10", quantity: "100", multiplier: "100", rate_display: "", start_date: "2026-09-25", maturity_date: "2026-12-18", notional: "100" };
  }
  if (product === "FX_OPTION") {
    return { ...base, direction: "BUY", book: "NY-FX", underlying: "EURUSD", notional_currency: "EUR", secondary_currency: "USD", strike: "1.10", premium: "0.012", notional: "10000000", rate_display: "", start_date: "2026-09-25", maturity_date: "2026-12-29" };
  }
  if (product === "COMMODITY_SWAP") {
    return { ...base, direction: "PAY", book: "SG-ENRG", underlying: "BRENT", notional_currency: "USD", rate_display: "76", notional: "50000", pay_frequency: "3M", start_date: "2026-10-01", maturity_date: "2027-10-01" };
  }
  return { ...base, direction: "BUY", book: "SG-ENRG", underlying: "BRENT", notional_currency: "USD", rate_display: "75", quantity: "10", multiplier: "1000", notional: "10", start_date: "2026-09-25", maturity_date: "2026-12-16" };
}

function pairCurrencies(pair: string) {
  if (pair === "GBPUSD") return ["GBP", "USD"];
  if (pair === "USDJPY") return ["USD", "JPY"];
  return ["EUR", "USD"];
}

export function TicketForm({ tradeId }: { tradeId?: number }) {
  const router = useRouter();
  const { refreshKey, bump } = useDesk();
  const [form, setForm] = useState<Record<string, string>>(EMPTY);
  const [books, setBooks] = useState<Book[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [price, setPrice] = useState<Price | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(!tradeId);

  useEffect(() => {
    api<{ Books: { Code: string; Name: string; Active: boolean }[] }>("/api/Book/All").then((body) =>
      setBooks(body.Books.filter((row) => row.Active).map((row) => ({ code: row.Code, name: row.Name, active: row.Active }))),
    );
    api<{ Parties: { Code: string; Name: string; Active: boolean }[] }>("/api/Party/Property").then((body) =>
      setParties(body.Parties.filter((row) => row.Active).map((row) => ({ code: row.Code, name: row.Name, active: row.Active }))),
    );
  }, [refreshKey]);

  useEffect(() => {
    if (!tradeId) return;
    api<Record<string, unknown>>(`/api/Trades/${tradeId}`)
      .then((trade) => {
        const product = String(trade.ProductType);
        const rateNumber = trade.FixedRate as number | null;
        const rateDisplay =
          product === "BOND" || product === "IRS" ? (rateNumber != null ? (rateNumber * 100).toFixed(4) : "") : rateNumber != null ? String(rateNumber) : "";
        setForm({
          ...defaultsFor(product),
          product_type: product,
          instrument_name: String(trade.Product ?? ""),
          book: String(trade.Book ?? ""),
          counterparty: String(trade.Party ?? ""),
          direction: String(trade.Direction ?? ""),
          notional: String(trade.Notional ?? ""),
          notional_currency: String(trade.SettleCurrency ?? ""),
          secondary_currency: String(trade.SecondaryCurrency ?? ""),
          rate_display: rateDisplay,
          strike: trade.Strike != null ? String(trade.Strike) : "",
          premium: trade.Premium != null ? String(trade.Premium) : "",
          quantity: trade.ContractQuantity != null ? String(trade.ContractQuantity) : "",
          multiplier: trade.Multiplier != null ? String(trade.Multiplier) : "",
          underlying: String(trade.Underlying ?? ""),
          option_type: String(trade.OptionType ?? "CALL"),
          trade_date: String(trade.TradeTime),
          start_date: String(trade.SettlementDate),
          maturity_date: String(trade.Maturity),
          pay_frequency: String(trade.PayFrequency ?? "6M"),
          trader: String(trade.Trader ?? "desk"),
          notes: String(trade.Notes ?? ""),
        });
        setLoaded(true);
      })
      .catch((err: Error) => setBanner(err.message));
  }, [tradeId]);

  const product = form.product_type;
  const rateIsPercent = product === "BOND" || product === "IRS";

  function set<K extends string>(key: K, value: string) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "product_type") return defaultsFor(value);
      if (key === "underlying" && (product.startsWith("FX") || product === "FX_SPOT")) {
        const [base, quote] = pairCurrencies(value);
        next.notional_currency = base;
        next.secondary_currency = quote;
      }
      if (key === "underlying" && product === "COMMODITY_SWAP") {
        next.notional_currency = value === "TTF" ? "EUR" : "USD";
      }
      if (key === "underlying" && product === "COMMODITY_FUTURE") {
        next.notional_currency = value === "TTF" ? "EUR" : "USD";
      }
      if (key === "notional" && (product === "EQUITY_OPTION" || product === "COMMODITY_FUTURE")) {
        next.quantity = value;
      }
      return next;
    });
  }

  function payload() {
    const rate = form.rate_display === "" ? null : Number(form.rate_display);
    const fixed = rate == null || Number.isNaN(rate) ? null : rateIsPercent ? rate / 100 : rate;
    const numOrNull = (key: string) => (form[key] === "" ? null : Number(form[key]));
    return {
      ProductType: form.product_type,
      Product: form.instrument_name,
      Book: form.book,
      Party: form.counterparty,
      Direction: form.direction,
      Notional: Number(form.notional),
      SettleCurrency: form.notional_currency,
      SecondaryCurrency: form.secondary_currency || null,
      FixedRate: fixed,
      Strike: numOrNull("strike"),
      Premium: numOrNull("premium"),
      ContractQuantity: numOrNull("quantity"),
      Multiplier: numOrNull("multiplier"),
      Underlying: form.underlying || null,
      OptionType: product.includes("OPTION") ? form.option_type : null,
      TradeTime: form.trade_date,
      SettlementDate: form.start_date,
      Maturity: product === "FX_SPOT" ? form.start_date : form.maturity_date,
      PayFrequency: form.pay_frequency || "6M",
      Trader: form.trader || "desk",
      Notes: form.notes,
      Message: tradeId ? "Amended from the ticket." : "",
    };
  }

  async function onPrice() {
    setBusy(true);
    setBanner(null);
    setErrors({});
    try {
      setPrice(await api<Price>("/api/Pricing/GetTradePriceFromTradeJson", { method: "POST", body: JSON.stringify(payload()) }));
    } catch (err) {
      setPrice(null);
      if (err instanceof ApiError) setErrors(fieldErrors({ detail: err.detail }));
      setBanner(err instanceof Error ? err.message : "Pricing failed");
    } finally {
      setBusy(false);
    }
  }

  async function onSave() {
    setBusy(true);
    setBanner(null);
    setErrors({});
    try {
      const body = payload();
      const saved = await api<{ Id: number }>(
        "/api/Trades",
        tradeId
          ? { method: "PUT", body: JSON.stringify({ Id: tradeId, ...body }) }
          : { method: "POST", body: JSON.stringify(body) },
      );
      bump();
      router.push(`/fathom/lifecycle?trade=${saved.Id}`);
    } catch (err) {
      if (err instanceof ApiError) setErrors(fieldErrors({ detail: err.detail }));
      setBanner(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  const directions = useMemo(() => {
    if (product === "IRS" || product === "COMMODITY_SWAP") return ["PAY", "RECEIVE"];
    return ["BUY", "SELL"];
  }, [product]);

  if (!loaded) return <Banner message={banner || "Loading ticket…"} />;

  return (
    <>
      <PageHeader
        kicker="Front office"
        title={tradeId ? "Amend ticket" : "New ticket"}
        lede={tradeId ? "Changing economics sends the trade back to Booked. Price it before you save if you want to see the model move." : "Book a trade into a book. It starts as Booked. Price draft does not save anything."}
      />
      <Banner message={banner} />
      <div className="layout-2">
        <div className="panel">
          <div className="panel-hd">Economics</div>
          <div className="form-grid">
            <label className="stack">
              Product
              <select className="select" value={form.product_type} onChange={(e) => set("product_type", e.target.value)} disabled={!!tradeId}>
                {PRODUCTS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="stack">
              Direction
              <select className="select" value={form.direction} onChange={(e) => set("direction", e.target.value)}>
                {directions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <FieldError message={errors.direction} />
            </label>
            <label className="stack wide">
              Instrument name
              <input className="field" value={form.instrument_name} onChange={(e) => set("instrument_name", e.target.value)} placeholder="A name you will recognise on the blotter" />
              <FieldError message={errors.Product} />
            </label>
            <label className="stack">
              Book
              <select className="select" value={form.book} onChange={(e) => set("book", e.target.value)}>
                {books.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.code} — {item.name}
                  </option>
                ))}
              </select>
              <FieldError message={errors.Book} />
            </label>
            <label className="stack">
              Counterparty
              <select className="select" value={form.counterparty} onChange={(e) => set("counterparty", e.target.value)}>
                {parties.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
              <FieldError message={errors.Party} />
            </label>
            {(product.startsWith("FX") || product.includes("OPTION") || product.startsWith("COMMODITY")) && (
              <label className="stack">
                {product.includes("EQUITY") ? "Underlying" : product.startsWith("COMMODITY") ? "Commodity" : "Pair"}
                {product.includes("EQUITY") ? (
                  <select className="select" value={form.underlying} onChange={(e) => set("underlying", e.target.value)}>
                    {["AETHER", "BRIGHTLINE", "CINDERCO"].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                ) : product.startsWith("COMMODITY") ? (
                  <select className="select" value={form.underlying} onChange={(e) => set("underlying", e.target.value)}>
                    {["BRENT", "TTF", "API2"].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                ) : (
                  <select className="select" value={form.underlying} onChange={(e) => set("underlying", e.target.value)}>
                    {["EURUSD", "GBPUSD", "USDJPY"].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                )}
                <FieldError message={errors.Underlying} />
              </label>
            )}
            {product.includes("OPTION") && (
              <label className="stack">
                Call / put
                <select className="select" value={form.option_type} onChange={(e) => set("option_type", e.target.value)}>
                  <option>CALL</option>
                  <option>PUT</option>
                </select>
              </label>
            )}
            <label className="stack">
              {product === "COMMODITY_FUTURE" ? "Lots" : product === "EQUITY_OPTION" ? "Contracts (also notional)" : product === "COMMODITY_SWAP" ? "Volume per period" : "Notional"}
              <input className="field" value={form.notional} onChange={(e) => set("notional", e.target.value)} />
              <FieldError message={errors.Notional} />
            </label>
            <label className="stack">
              Currency
              <select className="select" value={form.notional_currency} onChange={(e) => set("notional_currency", e.target.value)}>
                {["USD", "EUR", "GBP", "JPY"].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <FieldError message={errors.SettleCurrency} />
            </label>
            {product !== "EQUITY_OPTION" && product !== "FX_OPTION" && (
              <label className="stack">
                {rateIsPercent ? "Coupon / fixed rate (%)" : product === "COMMODITY_FUTURE" ? "Entry price" : product.startsWith("FX") ? "Traded rate" : "Fixed price"}
                <input className="field" value={form.rate_display} onChange={(e) => set("rate_display", e.target.value)} />
                <FieldError message={errors.FixedRate} />
              </label>
            )}
            {product.includes("OPTION") && (
              <>
                <label className="stack">
                  Strike
                  <input className="field" value={form.strike} onChange={(e) => set("strike", e.target.value)} />
                  <FieldError message={errors.Strike} />
                </label>
                <label className="stack">
                  Premium per unit
                  <input className="field" value={form.premium} onChange={(e) => set("premium", e.target.value)} />
                  <FieldError message={errors.Premium} />
                </label>
              </>
            )}
            {(product === "EQUITY_OPTION" || product === "COMMODITY_FUTURE") && (
              <label className="stack">
                Multiplier
                <input className="field" value={form.multiplier} onChange={(e) => set("multiplier", e.target.value)} />
                <FieldError message={errors.ContractQuantity} />
              </label>
            )}
            {(product === "BOND" || product === "IRS" || product === "COMMODITY_SWAP") && (
              <label className="stack">
                Frequency
                <select className="select" value={form.pay_frequency} onChange={(e) => set("pay_frequency", e.target.value)}>
                  {["1M", "3M", "6M", "1Y"].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
            )}
            <label className="stack">
              Trade date
              <input className="field" type="date" value={form.trade_date} onChange={(e) => set("trade_date", e.target.value)} />
            </label>
            <label className="stack">
              {product === "BOND" ? "Dated date" : product === "IRS" ? "Effective date" : "Start / value date"}
              <input className="field" type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
              <FieldError message={errors.SettlementDate} />
            </label>
            {product !== "FX_SPOT" && (
              <label className="stack">
                Maturity
                <input className="field" type="date" value={form.maturity_date} onChange={(e) => set("maturity_date", e.target.value)} />
                <FieldError message={errors.Maturity} />
              </label>
            )}
            <label className="stack">
              Trader
              <input className="field" value={form.trader} onChange={(e) => set("trader", e.target.value)} />
            </label>
            <label className="stack wide">
              Notes
              <input className="field" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </label>
          </div>
          <div className="pad split">
            <button className="btn" disabled={busy} onClick={onPrice}>
              Price draft
            </button>
            <button className="btn primary" disabled={busy} onClick={onSave}>
              {tradeId ? "Save amendment" : "Book trade"}
            </button>
          </div>
        </div>
        <aside className="panel">
          <div className="panel-hd">Model</div>
          {!price ? (
            <div className="note">Price the draft to see present value, the model name, and a plain-English explanation. Booking is a separate button.</div>
          ) : (
            <div className="pad">
              <div className="lbl faint">Present value USD</div>
              <div className={`mono ${signedClass(price.PvUsd)}`} style={{ fontSize: 28 }}>
                {money(price.PvUsd, 0)}
              </div>
              <p className="muted">{price.Model}</p>
              <p>{price.Explanation}</p>
              <div className="faint">Inputs</div>
              <div className="mono" style={{ fontSize: 12, lineHeight: 1.6 }}>
                {Object.entries(price.Inputs).map(([key, value]) => (
                  <div key={key}>
                    {key}: {typeof value === "number" ? value.toLocaleString("en-US", { maximumFractionDigits: 6 }) : String(value)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="err">{message}</span>;
}
