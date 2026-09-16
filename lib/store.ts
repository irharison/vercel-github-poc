"use client";

import { defaultDeal, defaultSettings } from "./calc/defaults";
import { dealFromJson, settingsFromJson } from "./calc/json";
import type { AppSettings, DealInputs } from "./calc/types";

const SETTINGS_KEY = "ndproperty.settings";
const DEALS_KEY = "ndproperty.deals";
const CURRENT_KEY = "ndproperty.currentDeal";
const PD_CACHE_KEY = "ndproperty.pdCache";
const WORKER_KEY = "ndproperty.worker";

export interface WorkerConfig {
  baseUrl: string;
  appToken: string;
}

export interface CachedPdEntry {
  endpoint: string;
  params: Record<string, string>;
  body: unknown;
  fetchedAt: string;
  creditsSpent: number;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadSettings(): AppSettings {
  return settingsFromJson(readJson(SETTINGS_KEY, {}));
}

export function saveSettings(settings: AppSettings): void {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadDeals(): DealInputs[] {
  const raw = readJson<unknown[]>(DEALS_KEY, []);
  return Array.isArray(raw) ? raw.map((item) => dealFromJson(item)) : [];
}

export function saveDeals(deals: DealInputs[]): void {
  window.localStorage.setItem(DEALS_KEY, JSON.stringify(deals));
}

export function loadCurrentDeal(): DealInputs {
  const stored = readJson<unknown | null>(CURRENT_KEY, null);
  if (stored) return dealFromJson(stored);
  const deals = loadDeals();
  return deals[0] ?? defaultDeal();
}

export function saveCurrentDeal(deal: DealInputs): void {
  window.localStorage.setItem(CURRENT_KEY, JSON.stringify(deal));
}

export function loadWorkerConfig(): WorkerConfig {
  return readJson<WorkerConfig>(WORKER_KEY, { baseUrl: "/api/pd", appToken: "" });
}

export function saveWorkerConfig(config: WorkerConfig): void {
  window.localStorage.setItem(WORKER_KEY, JSON.stringify(config));
}

export function loadPdCache(): CachedPdEntry[] {
  const raw = readJson<unknown[]>(PD_CACHE_KEY, []);
  return Array.isArray(raw) ? (raw as CachedPdEntry[]) : [];
}

export function savePdCache(entries: CachedPdEntry[]): void {
  window.localStorage.setItem(PD_CACHE_KEY, JSON.stringify(entries));
}

export { defaultDeal, defaultSettings };
