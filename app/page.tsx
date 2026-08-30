import Link from "next/link";
import { DirectoryExplorer } from "@/components/DirectoryExplorer";
import { counts, formatDate, getPeopleSorted, site } from "@/lib/people";
import { SECTOR_LABELS } from "@/lib/types";

export default function Home() {
  const stats = counts();
  const people = getPeopleSorted();
  const sectorEntries = Object.entries(stats.bySector).filter(([, value]) => value > 0);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="text-xs tracking-[0.2em] text-accent uppercase">
        Public register · last updated {formatDate(site.lastUpdated)}
      </p>
      <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight text-balance text-ink sm:text-5xl">
        A public register of documented Fabian Society connections
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
        {site.tagline} The Society does not publish a complete membership list.
        This site records only what public pages name.
      </p>

      <dl className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["People in this register", stats.total],
          ["Living", stats.living],
          ["Deceased", stats.deceased],
          ["Corroborated beyond Wikipedia", stats.corroborated],
          ["Wikipedia only", stats.wikipediaOnly],
          ["Pamphlet or essay only", stats.outputOnly],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-line bg-card px-5 py-4">
            <dt className="text-xs tracking-wide text-muted uppercase">{label}</dt>
            <dd className="mt-2 font-serif text-3xl text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-10">
        <h2 className="font-serif text-2xl text-ink">By sector</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sectorEntries.map(([sector, value]) => (
            <div key={sector} className="rounded-lg border border-line px-4 py-3">
              <dt className="text-xs tracking-wide text-muted uppercase">
                {SECTOR_LABELS[sector as keyof typeof SECTOR_LABELS]}
              </dt>
              <dd className="mt-1 font-serif text-2xl text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12 max-w-3xl border-t border-line pt-10">
        <h2 className="font-serif text-2xl text-ink">What is included</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-muted">
          <li>
            Sitting and former office-holders, peers, civil servants, public-body
            chairs, NHS and regulator figures, academics, journalists, union
            officials and people in companies, where a published Fabian link
            can be cited.
          </li>
          <li>
            Historic Liberals, SDP figures, Conservatives, independents and
            people with no stated party, if a public page names them as Fabians.
          </li>
          <li>
            Deceased historical figures (Webb, Shaw, Attlee and later chairs)
            with last known job and organisation.
          </li>
          <li>
            Wikipedia is a lead. If the article body states membership but no
            second source was found, the record is labelled Wikipedia only.
          </li>
          <li>
            Authorship-only pamphlets are labelled and not counted as confirmed
            membership. Ordinary private members without a public source are
            excluded. A Labour donation is not a Fabian donation.
          </li>
        </ul>
        <p className="mt-4 text-sm leading-7 text-muted">
          The society’s 2024–25 annual report said 141 Fabian MPs were elected in
          July 2024. That list was not published, so those unnamed people are not
          invented here.{" "}
          <Link className="text-accent underline-offset-2 hover:underline" href="/about">
            Read the full methodology
          </Link>
          .
        </p>
      </section>

      <section className="mt-12 max-w-3xl border-t border-line pt-10">
        <h2 className="font-serif text-2xl text-ink">References and further reading</h2>
        <p className="mt-3 text-sm leading-7 text-muted">
          A separate page collects official Society documents, parliamentary and
          Electoral Commission records, encyclopaedia entries, academic texts,
          news, Hansard, archives, sister organisations and a criticism group.
          It is a public trail for the Society and the doctrine, not only the
          people in this register.
        </p>
        <p className="mt-4">
          <Link className="text-accent underline-offset-2 hover:underline" href="/references">
            Browse the references library
          </Link>
        </p>
      </section>

      <section className="mt-14" aria-labelledby="directory-heading">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <h2 id="directory-heading" className="font-serif text-2xl text-ink">
            Search the register
          </h2>
          <Link
            className="text-sm text-accent underline-offset-2 hover:underline"
            href="/directory"
          >
            Open the full directory page
          </Link>
        </div>
        <DirectoryExplorer people={people} />
      </section>
    </main>
  );
}
