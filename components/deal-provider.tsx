"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { calculateDeal } from "@/lib/calc/engine";
import type { AppSettings, DealInputs, DealResult } from "@/lib/calc/types";
import {
  defaultDeal,
  defaultSettings,
  loadCurrentDeal,
  loadDeals,
  loadSettings,
  loadWorkerConfig,
  saveCurrentDeal,
  saveDeals,
  saveSettings,
  saveWorkerConfig,
  type WorkerConfig,
} from "@/lib/store";

interface DealContextValue {
  hydrated: boolean;
  settings: AppSettings;
  deal: DealInputs;
  savedDeals: DealInputs[];
  result: DealResult;
  worker: WorkerConfig;
  updateDeal: (next: DealInputs) => void;
  updateSettings: (next: AppSettings) => void;
  resetSettings: () => void;
  updateWorker: (next: WorkerConfig) => void;
  saveDeal: () => void;
  deleteDeal: (label: string) => void;
  openDeal: (deal: DealInputs) => void;
  newDeal: () => void;
}

const DealContext = createContext<DealContextValue | null>(null);

export function DealProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings());
  const [deal, setDeal] = useState<DealInputs>(defaultDeal());
  const [savedDeals, setSavedDeals] = useState<DealInputs[]>([]);
  const [worker, setWorker] = useState<WorkerConfig>({ baseUrl: "/api/pd", appToken: "" });

  useEffect(() => {
    setSettings(loadSettings());
    setDeal(loadCurrentDeal());
    setSavedDeals(loadDeals());
    setWorker(loadWorkerConfig());
    setHydrated(true);
  }, []);

  const result = useMemo(() => calculateDeal({ deal, settings }), [deal, settings]);

  const value: DealContextValue = {
    hydrated,
    settings,
    deal,
    savedDeals,
    result,
    worker,
    updateDeal: (next) => {
      setDeal(next);
      saveCurrentDeal(next);
    },
    updateSettings: (next) => {
      setSettings(next);
      saveSettings(next);
    },
    resetSettings: () => {
      const next = defaultSettings();
      setSettings(next);
      saveSettings(next);
    },
    updateWorker: (next) => {
      setWorker(next);
      saveWorkerConfig(next);
    },
    saveDeal: () => {
      const next = [...savedDeals.filter((item) => item.label !== deal.label), deal];
      setSavedDeals(next);
      saveDeals(next);
      saveCurrentDeal(deal);
    },
    deleteDeal: (label) => {
      const next = savedDeals.filter((item) => item.label !== label);
      setSavedDeals(next);
      saveDeals(next);
    },
    openDeal: (next) => {
      setDeal(next);
      saveCurrentDeal(next);
    },
    newDeal: () => {
      const next = defaultDeal();
      setDeal(next);
      saveCurrentDeal(next);
    },
  };

  return <DealContext.Provider value={value}>{children}</DealContext.Provider>;
}

export function useDeal() {
  const ctx = useContext(DealContext);
  if (!ctx) throw new Error("useDeal must be used inside DealProvider");
  return ctx;
}
