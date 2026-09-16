"use client";

import { useEffect, useMemo, useState } from "react";
import { areaGroups, readAveragePrice, readMonthlyRent, researchEndpoints } from "@/lib/propertydata";
import { loadPdCache, savePdCache, type CachedPdEntry } from "@/lib/store";
import { useDeal } from "./deal-provider";
import { money } from "@/lib/format";
import { NoteBanner, SectionCard } from "./fields";

export function ResearchPanel() {
  const { worker, updateDeal, deal } = useDeal();
  const [groupName, setGroupName] = useState(areaGroups[0].name);
  const group = areaGroups.find((item) => item.name === groupName) ?? areaGroups[0];
  const [postcode, setPostcode] = useState(group.districts[0].postcode);
  const [endpoint, setEndpoint] = useState(researchEndpoints[0].endpoint);
  const option = researchEndpoints.find((item) => item.endpoint === endpoint) ?? researchEndpoints[0];
  const [body, setBody] = useState<unknown>(null);
  const [source, setSource] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const averagePrice = useMemo(() => (body ? readAveragePrice(body) : null), [body]);
  const monthlyRent = useMemo(() => (body ? readMonthlyRent(body) : null), [body]);

  async function lookup(refresh: boolean) {
    setError("");
    const cache = loadPdCache();
    const hit = cache.find((entry) => entry.endpoint === option.endpoint && entry.params.postcode === postcode);
    if (!refresh && hit) {
      setBody(hit.body);
      setSource("browser cache");
      return;
    }
    if (refresh && !window.confirm(`Re-query ${option.label} for ${postcode}? This may spend ${option.credits} credit.`)) {
      return;
    }
    setLoading(true);
    try {
      const base = worker.baseUrl.replace(/\/$/, "");
      const url = `${base}/${option.endpoint}?postcode=${encodeURIComponent(postcode)}${refresh ? "&refresh=1" : ""}`;
      const headers: HeadersInit = { accept: "application/json" };
      if (worker.appToken) headers.authorization = `Bearer ${worker.appToken}`;
      const response = await fetch(url, { headers });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || `HTTP ${response.status}`);
      const data = json.data ?? json;
      setBody(data);
      setSource(json.cache ?? "live");
      const next: CachedPdEntry = {
        endpoint: option.endpoint,
        params: { postcode },
        body: data,
        fetchedAt: json.fetchedAt ?? new Date().toISOString(),
        creditsSpent: json.creditsSpent ?? (refresh ? option.credits : 0),
      };
      savePdCache([next, ...cache.filter((entry) => !(entry.endpoint === next.endpoint && entry.params.postcode === postcode))]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-10">
      <NoteBanner text="PropertyData charges per query. Cached answers load free. A refresh always asks first." />
      <SectionCard title="Area" subtitle={group.note}>
        <select
          className="w-full rounded-md border border-stone-300 px-3 py-2 dark:border-stone-700 dark:bg-stone-950"
          value={groupName}
          onChange={(event) => {
            const next = areaGroups.find((item) => item.name === event.target.value) ?? areaGroups[0];
            setGroupName(next.name);
            setPostcode(next.districts[0].postcode);
          }}
        >
          {areaGroups.map((item) => (
            <option key={item.name} value={item.name}>
              {item.name} ({item.districts.length} lookups)
            </option>
          ))}
        </select>
        <select
          className="w-full rounded-md border border-stone-300 px-3 py-2 dark:border-stone-700 dark:bg-stone-950"
          value={postcode}
          onChange={(event) => setPostcode(event.target.value)}
        >
          {group.districts.map((item) => (
            <option key={item.postcode} value={item.postcode}>
              {item.label}
            </option>
          ))}
        </select>
        <select
          className="w-full rounded-md border border-stone-300 px-3 py-2 dark:border-stone-700 dark:bg-stone-950"
          value={endpoint}
          onChange={(event) => setEndpoint(event.target.value)}
        >
          {researchEndpoints.map((item) => (
            <option key={item.endpoint} value={item.endpoint}>
              {item.label}
            </option>
          ))}
        </select>
        <p className="text-sm text-stone-500">{option.description}</p>
        <div className="flex gap-2">
          <button type="button" className="rounded-md bg-[var(--brand)] px-4 py-2 text-white" onClick={() => lookup(false)} disabled={loading}>
            Load cached / fetch
          </button>
          <button type="button" className="rounded-md border border-stone-300 px-4 py-2 dark:border-stone-700" onClick={() => lookup(true)} disabled={loading}>
            Refresh (costs a credit)
          </button>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {source ? <p className="text-xs text-stone-500">Source: {source}</p> : null}
        {averagePrice != null ? (
          <button type="button" className="text-left text-sm underline" onClick={() => updateDeal({ ...deal, purchasePrice: averagePrice, postcode })}>
            Use {money(averagePrice)} as purchase price
          </button>
        ) : null}
        {monthlyRent != null ? (
          <button type="button" className="block text-left text-sm underline" onClick={() => updateDeal({ ...deal, monthlyRent, postcode })}>
            Use {money(monthlyRent)} as monthly rent
          </button>
        ) : null}
        {body ? (
          <pre className="max-h-96 overflow-auto rounded-md bg-stone-950 p-3 text-xs text-stone-100">
            {JSON.stringify(body, null, 2)}
          </pre>
        ) : null}
      </SectionCard>
    </div>
  );
}

export function CachePanel() {
  const [entries, setEntries] = useState<CachedPdEntry[]>([]);
  useEffect(() => {
    setEntries(loadPdCache());
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-10">
      <SectionCard title="Cached PropertyData" subtitle="Kept in this browser. Credits already spent do not need spending again.">
        <p className="text-sm">{entries.length} lookups held</p>
        <button
          type="button"
          className="rounded-md border border-stone-300 px-4 py-2 dark:border-stone-700"
          onClick={() => {
            if (!window.confirm("Export the cache as JSON?")) return;
            const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "ndproperty-pd-cache.json";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Export JSON
        </button>
        <button
          type="button"
          className="ml-2 rounded-md border border-red-300 px-4 py-2 text-red-700"
          onClick={() => {
            if (!window.confirm("Clear the browser cache? You would have to pay again for these lookups.")) return;
            savePdCache([]);
            setEntries([]);
          }}
        >
          Clear cache
        </button>
        {entries.map((entry) => (
          <div key={`${entry.endpoint}-${entry.params.postcode}-${entry.fetchedAt}`} className="border-t border-stone-200 pt-2 text-sm dark:border-stone-800">
            <div className="font-medium">{entry.endpoint} · {entry.params.postcode}</div>
            <div className="text-xs text-stone-500">{entry.fetchedAt} · credits {entry.creditsSpent}</div>
          </div>
        ))}
      </SectionCard>
    </div>
  );
}
