"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, clearAuth, hasAuth, setAuth } from "@/lib/fathom/api";
import { learnFor } from "@/lib/fathom/learn";

type DeskState = {
  book: string;
  setBook: (code: string) => void;
  books: { code: string; name: string }[];
  valuationDate: string;
  refreshKey: number;
  bump: () => void;
  openLearn: () => void;
};

const DeskContext = createContext<DeskState>({
  book: "",
  setBook: () => {},
  books: [],
  valuationDate: "2026-09-25",
  refreshKey: 0,
  bump: () => {},
  openLearn: () => {},
});

export function useDesk() {
  return useContext(DeskContext);
}

const NAV = [
  ["/fathom", "Cockpit", "01"],
  ["/fathom/blotter", "Blotter", "02"],
  ["/fathom/ticket", "Ticket", "03"],
  ["/fathom/lifecycle", "Lifecycle", "04"],
  ["/fathom/pricing", "Pricing", "05"],
  ["/fathom/market", "Market", "06"],
  ["/fathom/risk", "Risk", "07"],
  ["/fathom/positions", "Positions", "08"],
  ["/fathom/pnl", "P&L", "09"],
  ["/fathom/operations", "Operations", "10"],
  ["/fathom/static", "Static data", "11"],
  ["/fathom/api-guide", "API", "12"],
] as const;

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [book, setBook] = useState("");
  const [books, setBooks] = useState<{ code: string; name: string }[]>([]);
  const [valuationDate, setValuationDate] = useState("2026-09-25");
  const [refreshKey, setRefreshKey] = useState(0);
  const [learnOpen, setLearnOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [session, setSession] = useState<"unknown" | "in" | "out">("unknown");
  const [username, setUsername] = useState("desk");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [who, setWho] = useState("desk");

  useEffect(() => {
    const onOut = () => setSession("out");
    const onGoogle = () => {
      const callback = `${window.location.pathname}${window.location.search}`;
      router.push(`/signin?callbackUrl=${encodeURIComponent(callback)}`);
    };
    window.addEventListener("fathom-unauthorized", onOut);
    window.addEventListener("fathom-google-required", onGoogle);
    const timer = window.setTimeout(() => setSession(hasAuth() ? "in" : "out"), 0);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("fathom-unauthorized", onOut);
      window.removeEventListener("fathom-google-required", onGoogle);
    };
  }, [router]);

  useEffect(() => {
    if (session !== "in") return;
    api<{ ValuationDate: string }>("/Monitoring/Ping")
      .then((row) => setValuationDate(row.ValuationDate))
      .catch(() => setValuationDate("—"));
    api<{ Books: { Code: string; Name: string }[] }>("/api/Book/All")
      .then((row) => setBooks(row.Books.map((item) => ({ code: item.Code, name: item.Name }))))
      .catch(() => setBooks([]));
    api<{ Username: string; DisplayName: string }>("/api/User/GetUser")
      .then((row) => setWho(row.DisplayName))
      .catch(() => setWho("desk"));
  }, [refreshKey, session]);

  const value = useMemo(
    () => ({
      book,
      setBook,
      books,
      valuationDate,
      refreshKey,
      bump: () => setRefreshKey((n) => n + 1),
      openLearn: () => setLearnOpen(true),
    }),
    [book, books, valuationDate, refreshKey],
  );

  async function signIn() {
    setLoginError(null);
    setAuth(username.trim(), password);
    try {
      const row = await api<{ DisplayName: string }>("/api/User/Login");
      setWho(row.DisplayName);
      setPassword("");
      setSession("in");
    } catch (err) {
      clearAuth();
      setLoginError(err instanceof Error ? err.message : "Sign-in failed");
    }
  }

  if (session !== "in") {
    return (
      <div className="app">
        <header className="topbar">
          <div className="brand">
            <em>Fathom</em>
            <span>Desk</span>
          </div>
        </header>
        <main className="main">
          {session === "unknown" ? <Loading label="Checking the session…" /> : null}
          {session === "out" ? (
            <section className="panel" style={{ maxWidth: 440 }}>
              <div className="panel-hd">Sign in</div>
              <div className="pad">
                <p className="muted">
                  Classroom login for the desk API. This is separate from the site sign-in. Try <span className="mono">desk</span> or <span className="mono">ops</span>, password <span className="mono">fathom</span>.
                </p>
                <label className="stack">
                  Username
                  <input className="field" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
                </label>
                <label className="stack" style={{ marginTop: 8 }}>
                  Password
                  <input className="field" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
                </label>
                {loginError ? <p className="err">{loginError}</p> : null}
                <button className="btn primary" style={{ marginTop: 12 }} onClick={() => void signIn()}>
                  Sign in
                </button>
              </div>
            </section>
          ) : null}
        </main>
      </div>
    );
  }

  const topic = learnFor(pathname);

  return (
    <DeskContext.Provider value={value}>
      <div className="app">
        <header className="topbar">
          <div className="brand">
            <em>Fathom</em>
            <span>Desk</span>
          </div>
          <div className="top-meta">
            <span>
              Valuation <b>{valuationDate}</b>
            </span>
            <span>
              Base <b>USD</b>
            </span>
            <span>
              Signed in <b>{who}</b>
            </span>
          </div>
          <div className="top-actions">
            <select className="select" value={book} onChange={(event) => setBook(event.target.value)} aria-label="Book filter">
              <option value="">All books</option>
              {books.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.code}
                </option>
              ))}
            </select>
            <button className="btn learn-btn" onClick={() => setLearnOpen(true)}>
              Learn
            </button>
            <button className="btn" onClick={() => setResetOpen(true)}>
              Reset data
            </button>
            <button
              className="btn"
              onClick={() => {
                clearAuth();
                setSession("out");
              }}
            >
              Desk sign out
            </button>
          </div>
        </header>
        <nav className="nav">
          {NAV.map(([href, label, index]) => {
            const on = href === "/fathom" ? pathname === "/fathom" : pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={on ? "active" : ""}>
                {label}
                <small>{index}</small>
              </Link>
            );
          })}
        </nav>
        <main className="main">{children}</main>
      </div>
      {learnOpen && (
        <>
          <div className="drawer-back" onClick={() => setLearnOpen(false)} />
          <aside className="drawer" role="dialog" aria-label="Learn">
            <div className="split">
              <div className="kicker">{topic.kicker}</div>
              <button className="btn" onClick={() => setLearnOpen(false)}>
                Close
              </button>
            </div>
            <h2>{topic.title}</h2>
            {topic.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
            <p className="map">{topic.mapping}</p>
          </aside>
        </>
      )}
      {resetOpen && (
        <div className="modal-back">
          <div className="modal" role="dialog" aria-label="Reset demo data">
            <h3 style={{ margin: "0 0 8px" }}>Reset the fictional book?</h3>
            <p className="muted">
              This deletes trades you booked and restores the sample counterparties, market, and lifecycle history. It only touches this local database.
            </p>
            <div className="split mt">
              <button className="btn" onClick={() => setResetOpen(false)} disabled={resetting}>
                Keep my trades
              </button>
              <button
                className="btn primary"
                disabled={resetting}
                onClick={async () => {
                  setResetting(true);
                  try {
                    await api("/api/Task", { method: "PUT", body: JSON.stringify({ Name: "SampleReset", Status: "Run" }) });
                    setResetOpen(false);
                    setRefreshKey((n) => n + 1);
                  } finally {
                    setResetting(false);
                  }
                }}
              >
                {resetting ? "Resetting…" : "Reset demo data"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DeskContext.Provider>
  );
}

export function PageHeader({ kicker, title, lede }: { kicker: string; title: string; lede?: string }) {
  const { openLearn } = useDesk();
  return (
    <div className="page-head">
      <div>
        <div className="kicker">{kicker}</div>
        <h1>{title}</h1>
        {lede ? <p className="lede">{lede}</p> : null}
      </div>
      <button className="btn learn-btn" onClick={openLearn}>
        What is this?
      </button>
    </div>
  );
}

export function Banner({ message }: { message: string | null }) {
  if (!message) return null;
  return <div className="banner">{message}</div>;
}

export function Loading({ label = "Loading the book…" }: { label?: string }) {
  return <div className="panel note">{label}</div>;
}
