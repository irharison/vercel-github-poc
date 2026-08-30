import referencesJson from "@/data/references.json";
import type { ReferenceCategory, ReferencesData } from "@/lib/types";

export const referencesData = referencesJson as ReferencesData;

export function getReferenceCategories(): ReferenceCategory[] {
  return referencesData.categories;
}

export function referenceCount(): number {
  return referencesData.categories.reduce(
    (total, category) => total + category.links.length,
    0,
  );
}
