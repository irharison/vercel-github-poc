"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { DataGrid, type Column } from "@/components/fathom/grid";
import { Banner, Loading, PageHeader, useDesk } from "@/components/fathom/shell";
import { api, withBook } from "@/lib/fathom/api";

type Trade = {
  Id: number;
  TradingSystemReference: string;
  Product: string;
  ProductType: string;
  Status: string;
  Book: string;
  PartyName: string;
};

type EventRow = {
  Id: number;
  EventType: string;
  FromStatus: string | null;
  ToStatus: string;
  Actor: string;
  Message: string;
  Payload: { changes?: Record<string, { from: unknown; to: unknown }> };
  CreatedAt: string;
};

const NEXT: Record<string, { action: string; label: string }[]> = {
  BOOKED: [
    { action: "verify", label: "Verify" },
    { action: "cancel", label: "Cancel" },
  ],
  VERIFIED: [
    { action: "confirm", label: "Confirm" },
    { action: "cancel", label: "Cancel" },
  ],
  CONFIRMED: [
    { action: "settle", label: "Settle" },
    { action: "cancel", label: "Cancel" },
  ],
};

function LifecycleInner() {
  const params = useSearchParams();
  const { book, refreshKey, bump } = useDesk();
  const [rows, setRows] = useState<Trade[] | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(params.get("trade") ? Number(params.get("trade")) : null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [status, setStatus] = useState<string>("");
  const [message, setMessage] = useState("Checked on the desk.");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api<{ Trades: Trade[] }>(withBook("/api/Trades", book))
      .then((body) => {
        if (cancelled) return;
        setRows(body.Trades);
        setSelectedId((current) => current ?? body.Trades[0]?.Id ?? null);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [book, refreshKey]);

  useEffect(() => {
    if (selectedId == null) return;
    api<{ Status: string; Events: EventRow[] }>(`/api/Trades/${selectedId}`)
      .then((body) => {
        setEvents(body.Events);
        setStatus(body.Status);
      })
      .catch((err: Error) => setError(err.message));
  }, [selectedId, refreshKey]);

  async function act(action: string) {
    if (selectedId == null) return;
    setBusy(true);
    setError(null);
    try {
      await api("/api/Trades", {
        method: "PUT",
        body: JSON.stringify({ Id: selectedId, Action: action, Message: message }),
      });
      bump();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transition failed");
    } finally {
      setBusy(false);
    }
  }

  const columns: Column<Trade>[] = [
    { key: "ref", label: "Ref", sort: (r) => r.TradingSystemReference, render: (r) => <span className="mono">{r.TradingSystemReference}</span> },
    { key: "name", label: "Instrument", sort: (r) => r.Product, render: (r) => r.Product },
    { key: "book", label: "Book", render: (r) => r.Book },
    { key: "status", label: "Status", sort: (r) => r.Status, render: (r) => <span className={`pill ${r.Status}`}>{r.Status}</span> },
  ];

  return (
    <>
      <PageHeader
        kicker="Middle office"
        title="Lifecycle"
        lede="Booked, then verified, then confirmed, then settled. Cancel is allowed until settlement. Each step is an event you can read back."
      />
      <Banner message={error} />
      {!rows ? <Loading /> : null}
      {rows && (
        <div className="layout-2">
          <DataGrid rows={rows} columns={columns} selected={selectedId} onRow={(row) => setSelectedId(row.Id)} />
          <section className="panel">
            <div className="panel-hd">
              Audit trail
              <span className={`pill ${status}`}>{status || "—"}</span>
            </div>
            <div className="timeline">
              {events.map((event, index) => (
                <div className="event" key={event.Id}>
                  <div className="rail">
                    <div className="dot" />
                    {index < events.length - 1 ? <div className="stem" /> : null}
                  </div>
                  <div className="body">
                    <div className="split">
                      <strong>{event.EventType}</strong>
                      <span className="when">{event.CreatedAt?.replace("T", " ").slice(0, 16)}</span>
                    </div>
                    <div className="muted">
                      {event.FromStatus ? `${event.FromStatus} → ${event.ToStatus}` : event.ToStatus} · {event.Actor}
                    </div>
                    <div>{event.Message}</div>
                    {event.Payload?.changes &&
                      Object.entries(event.Payload.changes).map(([field, change]) => (
                        <div key={field} className="mono faint">
                          {field}: {String(change.from)} → {String(change.to)}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
              {events.length === 0 && <div className="note">Select a trade.</div>}
            </div>
            <div className="pad">
              <label className="stack">
                Comment
                <input className="field" value={message} onChange={(e) => setMessage(e.target.value)} />
              </label>
              <div className="toolbar mt">
                {(NEXT[status] ?? []).map((item) => (
                  <button key={item.action} className={`btn ${item.action === "cancel" ? "danger" : "primary"}`} disabled={busy} onClick={() => act(item.action)}>
                    {item.label}
                  </button>
                ))}
                {(status === "SETTLED" || status === "CANCELLED") && <span className="muted">This status is closed. {status === "SETTLED" ? "The economic position can still be open." : "Cancelled trades stay on the blotter."}</span>}
              </div>
              {selectedId && rows.find((row) => row.Id === selectedId) && (
                <div className="faint mt">
                  {rows.find((row) => row.Id === selectedId)?.PartyName} · {rows.find((row) => row.Id === selectedId)?.ProductType.replaceAll("_", " ")}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}

export default function LifecyclePage() {
  return (
    <Suspense fallback={<Loading />}>
      <LifecycleInner />
    </Suspense>
  );
}
