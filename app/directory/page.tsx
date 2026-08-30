import type { Metadata } from "next";
import { DirectoryExplorer } from "@/components/DirectoryExplorer";
import { counts, getPeopleSorted } from "@/lib/people";

export const metadata: Metadata = {
  title: "Directory",
  description:
    "Searchable public directory of people with a documented Fabian Society relationship, including job, organisation and source quality.",
};

export default function DirectoryPage() {
  const stats = counts();
  const people = getPeopleSorted();

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="font-serif text-4xl text-ink">Directory</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
        {stats.total} people. {stats.living} living, {stats.deceased} deceased.{" "}
        {stats.corroborated} corroborated beyond Wikipedia; {stats.wikipediaOnly}{" "}
        Wikipedia only. {stats.outputOnly} appear only as authors of a pamphlet
        or essay.
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
        Cards show job and organisation on one line. Filter by sector, party,
        living or deceased, and source quality. Search matches organisation
        names such as BBC, Cabinet Office or a university.
      </p>
      <div className="mt-10">
        <DirectoryExplorer people={people} />
      </div>
    </main>
  );
}
