"use client";

import { SettingsForm } from "@/components/settings-form";
import { useDeal } from "@/components/deal-provider";

export default function SettingsPage() {
  const { hydrated } = useDeal();
  if (!hydrated) return <p className="text-sm text-stone-500">Loading…</p>;
  return <SettingsForm />;
}
