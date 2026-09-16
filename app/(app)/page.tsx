"use client";

import { DealWorkspace } from "@/components/deal-form";
import { useDeal } from "@/components/deal-provider";

export default function DealPage() {
  const { hydrated } = useDeal();
  if (!hydrated) return <p className="text-sm text-stone-500">Loading saved deals…</p>;
  return <DealWorkspace />;
}
