import Link from "next/link";
import { DirectoryExplorer } from "@/components/DirectoryExplorer";
import { counts, formatDate, getPeopleSorted, site } from "@/lib/people";

export default function Home() {
  const stats = counts();
  const people = getPeopleSorted();

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="text-xs tracking-[0.2em] text-accent uppercase">
        Political transparency · last updated {formatDate(site.lastUpdated)}
      </p>
      <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight text-balance text-ink sm:text-5xl">
        Labour politicians and other public figures with a documented Fabian
        Society relationship
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
        {site.tagline} The Fabian Society does not publish a complete membership
        list. This site records only what public sources name.
      </p>

      <dl className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["People in this register", stats.total],
          ["Named role or membership", stats.named],
          ["Pamphlet or essay only", stats.outputOnly],
          ["Sitting MPs", stats.mps],
          ["Former MPs", stats.formerMps],
          ["Other public figures", stats.otherPublicFigures],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-line bg-card px-5 py-4">
            <dt className="text-xs tracking-wide text-muted uppercase">{label}</dt>
            <dd className="mt-2 font-serif text-3xl text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-12 max-w-3xl border-t border-line pt-10">
        <h2 className="font-serif text-2xl text-ink">What is included</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-muted">
          <li>
            Sitting and former Labour MPs, ministers, peers, MSPs, Senedd
            members, mayors, PCCs and prominent councillors where a named Fabian
            role, an explicit membership statement, or a donation to the Society
            can be cited.
          </li>
          <li>
            Other public figures with a published link: pamphlet authors,
            Society officers, conference chairs, think-tank people named on
            Fabian papers, and donors the Society or the Electoral Commission
            names.
          </li>
          <li>
            People whose only public link is a Fabian pamphlet or essay. They are
            labelled “authorship only” and are not counted as confirmed members.
          </li>
          <li>
            Ordinary private Labour members are excluded. Event speakers are
            excluded unless another sourced role exists. A Labour Party donation
            is not treated as a Fabian donation.
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
