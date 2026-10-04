"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateSpainVilla } from "@/lib/spain/engine";
import { SPAIN_ESTIMATE_NOTE, defaultSpainVilla } from "@/lib/spain/defaults";
import { loadSpainVilla, saveSpainVilla } from "@/lib/spain/storage";
import type { SpainVillaInputs } from "@/lib/spain/types";
import { NoteBanner } from "./fields";
import { SpainAppraisal, SpainFinance, SpainStay } from "./spain-appraisal";
import { SpainInputs } from "./spain-inputs";

export function SpainVillaWorkspace() {
  const [hydrated, setHydrated] = useState(false);
  const [inputs, setInputs] = useState<SpainVillaInputs>(defaultSpainVilla);

  useEffect(() => {
    const loaded = loadSpainVilla();
    const timer = window.setTimeout(() => {
      setInputs(loaded);
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const result = useMemo(() => calculateSpainVilla(inputs), [inputs]);

  if (!hydrated) return <p className="text-sm text-stone-500">Loading saved villa…</p>;

  function update(next: SpainVillaInputs) {
    setInputs(next);
    saveSpainVilla(next);
  }

  function reset() {
    const next = defaultSpainVilla();
    setInputs(next);
    saveSpainVilla(next);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight">Spain villa</h1>
        <p className="max-w-3xl text-sm leading-6 text-stone-600 dark:text-stone-300">
          Purchase costs, a renovation and three ways to fund a villa in Andalucía, or the cost of renting one
          out of season instead. Amounts are in euros, with pounds beside them.
        </p>
        <NoteBanner text={SPAIN_ESTIMATE_NOTE} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <SpainInputs inputs={inputs} result={result} onChange={update} onReset={reset} />
        <SpainAppraisal result={result} />
      </div>
      <SpainFinance result={result} />
      <SpainStay result={result} />
    </div>
  );
}
