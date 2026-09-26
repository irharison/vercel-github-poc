"use client";

import { useEffect, useState } from "react";
import { Banner, Loading, PageHeader, useDesk } from "@/components/fathom/shell";
import { api } from "@/lib/fathom/api";

type Party = { id: number; code: string; name: string; role: string; city: string; active: boolean };
type Book = { id: number; code: string; name: string; desk: string; base_currency: string; active: boolean };
type Currency = { code: string; name: string; minor_units: number };
type Calendar = { code: string; name: string; center: string; holidays: { date: string; name: string }[] };

export default function StaticPage() {
  const { bump, refreshKey } = useDesk();
  const [tab, setTab] = useState<"parties" | "books" | "ccy" | "cals" | "csa">("parties");
  const [csas, setCsas] = useState<{ Name: string; Party: string; Currency: string; Threshold: number; IndependentAmount: number }[]>([]);
  const [parties, setParties] = useState<Party[] | null>(null);
  const [books, setBooks] = useState<Book[] | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [cal, setCal] = useState("NYC");
  const [error, setError] = useState<string | null>(null);
  const [partyForm, setPartyForm] = useState({ code: "", name: "", role: "Corporate", city: "" });
  const [bookForm, setBookForm] = useState({ code: "", name: "", desk: "Flow", base_currency: "USD" });

  function load() {
    api<{ Parties: { Id: number; Code: string; Name: string; Role: string; City: string; Active: boolean }[] }>("/api/Party/Property").then((b) =>
      setParties(b.Parties.map((row) => ({ id: row.Id, code: row.Code, name: row.Name, role: row.Role, city: row.City, active: row.Active }))),
    );
    api<{ Books: { Id: number; Code: string; Name: string; Desk: string; BaseCurrency: string; Active: boolean }[] }>("/api/Book/All").then((b) =>
      setBooks(b.Books.map((row) => ({ id: row.Id, code: row.Code, name: row.Name, desk: row.Desk, base_currency: row.BaseCurrency, active: row.Active }))),
    );
    api<{ Currencies: { IsoCode: string; Name: string; MinorUnits: number }[] }>("/api/Currency/All").then((b) =>
      setCurrencies(b.Currencies.map((row) => ({ code: row.IsoCode, name: row.Name, minor_units: row.MinorUnits }))),
    );
    api<{ Calendars: { Name: string; Description: string; Center: string; Holidays: { Date: string; Name: string }[] }[] }>("/api/Calendar/All").then((b) =>
      setCalendars(b.Calendars.map((row) => ({ code: row.Name, name: row.Description, center: row.Center, holidays: row.Holidays.map((day) => ({ date: day.Date, name: day.Name })) }))),
    );
    api<{ CsaAgreements: { Name: string; Party: string; Currency: string; Threshold: number; IndependentAmount: number }[] }>("/api/CsaAgreement/All").then((b) =>
      setCsas(b.CsaAgreements),
    );
  }
  useEffect(load, [refreshKey]);

  async function addParty() {
    setError(null);
    try {
      await api("/api/Party", { method: "POST", body: JSON.stringify({ Code: partyForm.code, Name: partyForm.name, Role: partyForm.role, City: partyForm.city, Active: true }) });
      setPartyForm({ code: "", name: "", role: "Corporate", city: "" });
      bump();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add counterparty");
    }
  }
  async function addBook() {
    setError(null);
    try {
      await api("/api/Book", { method: "POST", body: JSON.stringify({ Code: bookForm.code, Name: bookForm.name, Desk: bookForm.desk, BaseCurrency: bookForm.base_currency, Active: true }) });
      setBookForm({ code: "", name: "", desk: "Flow", base_currency: "USD" });
      bump();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add book");
    }
  }

  const holidays = calendars.find((row) => row.code === cal)?.holidays ?? [];
  return (
    <>
      <PageHeader kicker="Reference data" title="Static data" lede="Books and counterparties are the names on every ticket. Currencies and calendars are the units and the closed days." />
      <Banner message={error} />
      <div className="tabs">
        {(["parties", "books", "ccy", "cals", "csa"] as const).map((item) => (
          <button key={item} className={tab === item ? "on" : ""} onClick={() => setTab(item)}>
            {item === "parties" ? "Parties" : item === "books" ? "Books" : item === "ccy" ? "Currencies" : item === "cals" ? "Calendars" : "CSA"}
          </button>
        ))}
      </div>
      {!parties && <Loading />}
      {tab === "parties" && parties && (
        <>
          <div className="panel form-grid">
            <label className="stack">Code<input className="field" value={partyForm.code} onChange={(e) => setPartyForm({ ...partyForm, code: e.target.value })} /></label>
            <label className="stack">Name<input className="field" value={partyForm.name} onChange={(e) => setPartyForm({ ...partyForm, name: e.target.value })} /></label>
            <label className="stack">Role<input className="field" value={partyForm.role} onChange={(e) => setPartyForm({ ...partyForm, role: e.target.value })} /></label>
            <label className="stack">City<input className="field" value={partyForm.city} onChange={(e) => setPartyForm({ ...partyForm, city: e.target.value })} /></label>
            <div className="wide"><button className="btn primary" onClick={addParty}>Add counterparty</button></div>
          </div>
          <table className="grid panel mt">
            <thead><tr><th>Code</th><th>Name</th><th>Role</th><th>City</th><th>Active</th></tr></thead>
            <tbody>
              {parties.map((row) => (
                <tr key={row.id}>
                  <td className="mono">{row.code}</td>
                  <td>{row.name}</td>
                  <td>{row.role}</td>
                  <td>{row.city}</td>
                  <td>
                    <button className="btn" onClick={async () => { await api("/api/Party", { method: "POST", body: JSON.stringify({ Code: row.code, Name: row.name, Role: row.role, City: row.city, Active: !row.active }) }); bump(); }}>
                      {row.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      {tab === "books" && books && (
        <>
          <div className="panel form-grid">
            <label className="stack">Code<input className="field" value={bookForm.code} onChange={(e) => setBookForm({ ...bookForm, code: e.target.value })} /></label>
            <label className="stack">Name<input className="field" value={bookForm.name} onChange={(e) => setBookForm({ ...bookForm, name: e.target.value })} /></label>
            <label className="stack">Desk<input className="field" value={bookForm.desk} onChange={(e) => setBookForm({ ...bookForm, desk: e.target.value })} /></label>
            <label className="stack">Base currency
              <select className="select" value={bookForm.base_currency} onChange={(e) => setBookForm({ ...bookForm, base_currency: e.target.value })}>
                {["USD", "EUR", "GBP", "JPY"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <div className="wide"><button className="btn primary" onClick={addBook}>Add book</button></div>
          </div>
          <table className="grid panel mt">
            <thead><tr><th>Code</th><th>Name</th><th>Desk</th><th>Ccy</th><th></th></tr></thead>
            <tbody>
              {books.map((row) => (
                <tr key={row.id}>
                  <td className="mono">{row.code}</td>
                  <td>{row.name}</td>
                  <td>{row.desk}</td>
                  <td>{row.base_currency}</td>
                  <td><button className="btn" onClick={async () => { await api("/api/Book", { method: "POST", body: JSON.stringify({ Code: row.code, Name: row.name, Desk: row.desk, BaseCurrency: row.base_currency, Active: !row.active }) }); bump(); }}>{row.active ? "Active" : "Inactive"}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      {tab === "ccy" && (
        <table className="grid panel">
          <thead><tr><th>Code</th><th>Name</th><th className="num">Minor units</th></tr></thead>
          <tbody>
            {currencies.map((row) => (
              <tr key={row.code}><td className="mono">{row.code}</td><td>{row.name}</td><td className="num">{row.minor_units}</td></tr>
            ))}
          </tbody>
        </table>
      )}
      {tab === "csa" && (
        <div className="panel">
          <div className="note">Credit support annexes from the static data. They are stored and listed. Pricing does not call them.</div>
          <table className="grid">
            <thead><tr><th>Name</th><th>Party</th><th>Ccy</th><th className="num">Threshold</th><th className="num">Independent amount</th></tr></thead>
            <tbody>
              {csas.map((row) => (
                <tr key={row.Name}>
                  <td className="mono">{row.Name}</td>
                  <td>{row.Party}</td>
                  <td>{row.Currency}</td>
                  <td className="num">{row.Threshold.toLocaleString("en-US")}</td>
                  <td className="num">{row.IndependentAmount.toLocaleString("en-US")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === "cals" && (
        <div className="panel">
          <div className="panel-hd">
            Holidays
            <select className="select" value={cal} onChange={(e) => setCal(e.target.value)}>
              {calendars.map((row) => <option key={row.code} value={row.code}>{row.code} — {row.name}</option>)}
            </select>
          </div>
          <div className="note">{calendars.find((row) => row.code === cal)?.center}. Closed days only; weekends are not listed.</div>
          <table className="grid">
            <tbody>
              {holidays.slice(0, 24).map((row) => (
                <tr key={row.date}><td className="mono">{row.date}</td><td>{row.name}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
