"use client";

import { defaultSpainVilla } from "./defaults";
import { villaFromJson } from "./json";
import type { SpainVillaInputs } from "./types";

const SPAIN_VILLA_KEY = "ndproperty.spainVilla";

export function loadSpainVilla(): SpainVillaInputs {
  if (typeof window === "undefined") return defaultSpainVilla();
  try {
    const raw = window.localStorage.getItem(SPAIN_VILLA_KEY);
    if (!raw) return defaultSpainVilla();
    return villaFromJson(JSON.parse(raw));
  } catch {
    return defaultSpainVilla();
  }
}

export function saveSpainVilla(inputs: SpainVillaInputs): void {
  window.localStorage.setItem(SPAIN_VILLA_KEY, JSON.stringify(inputs));
}
