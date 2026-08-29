import type { Metadata } from "next";
import { DirectoryExplorer } from "@/components/DirectoryExplorer";
import { counts, getPeopleSorted } from "@/lib/people";

export const metadata: Metadata = {
  title: "Directory",
  description:
    "Searchable directory of Labour public office-holders with a documented Fabian Society relationship.",
};

export default function DirectoryPage() {
  const stats = counts();
  const people = getPeopleSorted();

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="font-serif text-4xl text-ink">Directory</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
        {stats.total} people. {stats.named} have a named Fabian role or an
        explicit membership statement. {stats.outputOnly} appear only as authors
        of a Fabian pamphlet or essay.
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
        Cards show name, public office and the Fabian relationship in one line.
        Open a person for the timeline, donations table, organisations and full
        citations.
      </p>
      <div className="mt-10">
        <DirectoryExplorer people={people} />
      </div>
    </main>
  );
}
