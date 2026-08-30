import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SourcesList } from "@/components/SourcesList";
import { jobLine } from "@/lib/format";
import { getPeopleSorted, getPerson } from "@/lib/people";
import {
  CHAMBER_LABELS,
  FABIAN_STATUS_LABELS,
  PARTY_LABELS,
  POSITION_LABELS,
  SECTOR_LABELS,
  SOURCE_QUALITY_LABELS,
} from "@/lib/types";

export function generateStaticParams() {
  return getPeopleSorted().map((person) => ({ slug: person.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/people/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const person = getPerson(slug);
  if (!person) return { title: "Not found" };

  return {
    title: person.name,
    description: `${person.currentPosition}. ${person.fabianSummary}`,
  };
}

export default async function PersonPage({
  params,
}: PageProps<"/people/[slug]">) {
  const { slug } = await params;
  const person = getPerson(slug);
  if (!person) notFound();

  const outputOnly = person.inclusionBasis === "documented_output_only";
  const wikiOnly = person.sourceQuality === "wikipedia_only";

  return (
    <article className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="text-sm">
        <Link className="text-accent underline-offset-2 hover:underline" href="/directory">
          ← Directory
        </Link>
      </p>
      <p className="mt-6 text-xs tracking-[0.18em] text-muted uppercase">
        {SECTOR_LABELS[person.sector]} · {POSITION_LABELS[person.positionType]}
        {" · "}
        {person.living ? "Living" : "Deceased"}
        {outputOnly ? " · authorship only" : ""}
        {wikiOnly ? " · Wikipedia only" : ""}
      </p>
      <h1 className="mt-3 font-serif text-4xl leading-tight text-ink">
        {person.honorific ? `${person.honorific} ` : ""}
        {person.name}
      </h1>
      <p className="mt-4 text-lg leading-8 text-muted">{jobLine(person)}</p>
      {person.currentPosition !== jobLine(person) ? (
        <p className="mt-2 text-base leading-7 text-muted">{person.currentPosition}</p>
      ) : null}

      <dl className="mt-8 grid gap-4 border-y border-line py-6 sm:grid-cols-2">
        <div>
          <dt className="text-xs tracking-wide text-muted uppercase">Job title</dt>
          <dd className="mt-1">{person.jobTitle}</dd>
        </div>
        <div>
          <dt className="text-xs tracking-wide text-muted uppercase">Organisation</dt>
          <dd className="mt-1">{person.organisation}</dd>
        </div>
        <div>
          <dt className="text-xs tracking-wide text-muted uppercase">Party</dt>
          <dd className="mt-1">{PARTY_LABELS[person.party]}</dd>
        </div>
        <div>
          <dt className="text-xs tracking-wide text-muted uppercase">
            Primary Fabian status
          </dt>
          <dd className="mt-1">{FABIAN_STATUS_LABELS[person.primaryFabianStatus]}</dd>
        </div>
        <div>
          <dt className="text-xs tracking-wide text-muted uppercase">Source quality</dt>
          <dd className="mt-1">{SOURCE_QUALITY_LABELS[person.sourceQuality]}</dd>
        </div>
        <div>
          <dt className="text-xs tracking-wide text-muted uppercase">
            {person.chamber === "none" ? "Record notes" : "Chamber or institution"}
          </dt>
          <dd className="mt-1">
            {person.chamber === "none"
              ? person.died
                ? `Died ${person.died}`
                : "Not a parliamentary seat"
              : CHAMBER_LABELS[person.chamber]}
            {person.constituency ? ` · ${person.constituency}` : ""}
          </dd>
        </div>
      </dl>

      <section className="mt-10">
        <h2 className="font-serif text-2xl text-ink">Fabian involvement</h2>
        <p className="mt-3 text-base leading-7">{person.fabianSummary}</p>
        {outputOnly ? (
          <p className="mt-3 rounded-lg bg-accent-dim px-4 py-3 text-sm leading-6">
            Included because of documented Fabian output, not because membership
            has been independently confirmed. Do not read this page as a
            membership claim.
          </p>
        ) : null}
        {wikiOnly ? (
          <p className="mt-3 rounded-lg bg-accent-dim px-4 py-3 text-sm leading-6">
            The Fabian link on this page is cited from Wikipedia only. The
            article body does state a Fabian connection, but it has not yet been
            corroborated on a Society, parliamentary or news page. Treat it as a
            lead, not as a closed official record.
          </p>
        ) : null}
        <ol className="mt-6 space-y-4">
          {person.involvement.map((item) => (
            <li key={`${item.title}-${item.start ?? ""}`} className="border-l-2 border-line pl-4">
              <p className="text-xs tracking-wide text-muted uppercase">
                {item.start ?? "Date not stated"}
                {item.end ? ` – ${item.end}` : item.current ? " – present" : ""}
              </p>
              <p className="mt-1 font-medium">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{item.summary}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-2xl text-ink">Fabian output</h2>
        {person.outputs.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            No pamphlets, essays or recorded speeches were copied from the
            sources used for this entry.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {person.outputs.map((item) => (
              <li key={item.title} className="py-3">
                <p className="font-medium">
                  {item.url ? (
                    <a
                      className="text-accent underline-offset-2 hover:underline"
                      href={item.url}
                      rel="noreferrer"
                    >
                      {item.title}
                    </a>
                  ) : (
                    item.title
                  )}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {item.kind}
                  {item.date ? ` · ${item.date}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-2xl text-ink">Donations and register entries</h2>
        {person.donations.length === 0 ? (
          <p className="mt-3 text-sm leading-6 text-muted">
            No Electoral Commission donation or Register of Interests extract was
            copied into this dataset. That does not mean none exist. Check the{" "}
            <a
              className="text-accent underline-offset-2 hover:underline"
              href="https://www.electoralcommission.org.uk/political-registration-and-regulation/registers"
            >
              Electoral Commission registers
            </a>{" "}
            and the official parliamentary registers.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <caption className="sr-only">
                Sourced donations and register entries
              </caption>
              <thead className="border-b border-line text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="py-2 pr-4 font-medium">Donor or subject</th>
                  <th className="py-2 pr-4 font-medium">Amount</th>
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 font-medium">Nature</th>
                  <th className="py-2 font-medium">Recipient</th>
                </tr>
              </thead>
              <tbody>
                {person.donations.map((donation) => (
                  <tr key={`${donation.donor}-${donation.date}`} className="border-b border-line align-top">
                    <td className="py-3 pr-4">
                      {donation.recordUrl ? (
                        <a
                          className="text-accent underline-offset-2 hover:underline"
                          href={donation.recordUrl}
                          rel="noreferrer"
                        >
                          {donation.donor}
                        </a>
                      ) : (
                        donation.donor
                      )}
                    </td>
                    <td className="py-3 pr-4">{donation.amount ?? "—"}</td>
                    <td className="py-3 pr-4">{donation.date ?? "—"}</td>
                    <td className="py-3 pr-4">{donation.nature}</td>
                    <td className="py-3">{donation.recipient}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-2xl text-ink">Other organisations</h2>
        {person.organisations.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            No additional organisations were copied from the sources used for
            this entry.
          </p>
        ) : (
          <ul className="mt-4 space-y-2 text-sm leading-6">
            {person.organisations.map((org) => (
              <li key={org.name}>
                <span className="font-medium">{org.name}</span>
                <span className="text-muted">
                  {" "}
                  — {org.kind}
                  {org.role ? `; ${org.role}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-2xl text-ink">Sources</h2>
        <p className="mt-3 mb-4 text-sm text-muted">
          Every fact on this page is drawn from the citations below.
        </p>
        <SourcesList sources={person.sources} />
        <p className="mt-6 text-sm leading-6 text-muted">
          For debates, archives and further reading that mention the Society
          rather than this person, see{" "}
          <Link className="text-accent underline-offset-2 hover:underline" href="/references">
            References and further reading
          </Link>
          .
        </p>
      </section>
    </article>
  );
}
