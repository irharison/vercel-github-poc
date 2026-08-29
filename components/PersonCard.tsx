import Link from "next/link";
import type { Person } from "@/lib/types";
import { FABIAN_STATUS_LABELS } from "@/lib/types";

export function PersonCard({ person }: { person: Person }) {
  const outputOnly = person.inclusionBasis === "documented_output_only";

  return (
    <article className="rounded-xl border border-line bg-card p-5 shadow-[0_1px_0_rgba(28,25,22,0.03)]">
      <h2 className="font-serif text-xl leading-snug text-ink">
        <Link
          href={`/people/${person.slug}`}
          className="underline-offset-4 hover:underline"
        >
          {person.honorific ? `${person.honorific} ` : ""}
          {person.name}
        </Link>
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted">{person.currentPosition}</p>
      <p className="mt-3 text-sm leading-6 text-ink">
        <span className="text-muted">Fabian relationship: </span>
        {person.fabianSummary}
      </p>
      <p className="mt-3 text-xs tracking-wide text-muted uppercase">
        {FABIAN_STATUS_LABELS[person.primaryFabianStatus]}
        {outputOnly ? " · authorship only" : ""}
      </p>
    </article>
  );
}
