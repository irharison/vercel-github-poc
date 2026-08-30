import type { Metadata } from "next";
import Link from "next/link";
import { ReferencesExplorer } from "@/components/ReferencesExplorer";
import { getReferenceCategories, referenceCount, referencesData } from "@/lib/references";
import { formatDate } from "@/lib/people";

export const metadata: Metadata = {
  title: "References and further reading",
  description:
    "A sourced public library of pages that name the UK Fabian Society or Fabianism, grouped for browsing.",
};

export default function ReferencesPage() {
  const categories = getReferenceCategories();
  const total = referenceCount();

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="text-xs tracking-[0.2em] text-accent uppercase">
        Public register · last updated {formatDate(referencesData.lastUpdated)}
      </p>
      <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight text-ink">
        References and further reading
      </h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-muted">
        A browseable library of {total} public pages that name the UK Fabian
        Society or Fabianism as a political tradition. Each entry has a title,
        publisher, date if known, a one-line description and a URL that was
        checked on 30 August 2026.
      </p>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">
        {referencesData.methodology}{" "}
        <Link className="text-accent underline-offset-2 hover:underline" href="/about">
          Full methodology
        </Link>
        .
      </p>

      <section className="mt-10">
        <h2 className="font-serif text-2xl text-ink">How the groups are arranged</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Official Society pages come first. Then parliamentary and Electoral
          Commission records, reference works, academic texts, news, Hansard,
          archives, sister organisations, international namesakes, and a separate
          criticism group so the page is not only sympathetic. This is not a
          membership roll; names in the{" "}
          <Link className="text-accent underline-offset-2 hover:underline" href="/directory">
            directory
          </Link>{" "}
          still need their own citations.
        </p>
      </section>

      <section className="mt-12" aria-labelledby="library-heading">
        <h2 id="library-heading" className="sr-only">
          Link library
        </h2>
        <ReferencesExplorer categories={categories} />
      </section>
    </main>
  );
}
