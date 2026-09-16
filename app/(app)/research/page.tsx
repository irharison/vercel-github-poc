"use client";

import { ResearchPanel } from "@/components/research-panel";
import { useDeal } from "@/components/deal-provider";

export default function ResearchPage() {
  const { hydrated } = useDeal();
  if (!hydrated) return <p className="text-sm text-stone-500">Loading…</p>;
  return <ResearchPanel />;
}
