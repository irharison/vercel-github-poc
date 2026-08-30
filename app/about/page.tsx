import type { Metadata } from "next";
import { formatDate, site } from "@/lib/people";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How this unofficial public Fabian register is compiled, what is excluded, and how Wikipedia is used as a lead.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="font-serif text-4xl text-ink">Methodology</h1>
      <p className="mt-4 text-lg leading-8 text-muted">
        Last updated {formatDate(site.lastUpdated)}. This site is a static public
        register. It is not an official Fabian Society or Labour Party list, and
        it is not a membership roll.
      </p>

      <section className="mt-10">
        <h2 className="font-serif text-2xl text-ink">Purpose</h2>
        <p className="mt-3 text-base leading-7">
          The Fabian Society is a membership think tank affiliated to the Labour
          Party. It does not publish a complete membership roll. This register
          collects people — in politics, the civil service, public bodies, the
          NHS, universities, the media, unions and companies — whose Fabian
          relationship is documented in a public source with a URL.
        </p>
        <p className="mt-3 text-base leading-7">{site.methodologyNote}</p>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-2xl text-ink">What is included</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-7">
          <li>
            A named Fabian office, or an explicit membership statement on a
            public page.
          </li>
          <li>
            Former and sitting office-holders, peers, civil servants, diplomats,
            judges, regulators, NHS and public-body chairs, academics,
            journalists, union officials and named company directors or
            employees, on the same evidence test.
          </li>
          <li>
            Historic Liberals, SDP figures, Conservatives, independents and
            people with no stated party, if sourced as Fabians.
          </li>
          <li>
            Deceased historical figures, with last known job, organisation and
            dates where the sources give them.
          </li>
          <li>
            Wikipedia-listed members whose <em>article body</em> states a Fabian
            link. Category membership alone is not enough. Those records are
            labelled Wikipedia only until a second source is added.
          </li>
          <li>
            Gifts to the Fabian Society named by the Society or the Electoral
            Commission. A donation to the Labour Party is recorded only as a
            Labour donation.
          </li>
          <li>
            Authorship of a Fabian pamphlet or essay collection, labelled
            separately so it is not mistaken for membership.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-2xl text-ink">What is excluded</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-7">
          {site.limitations.map((item) => (
            <li key={item}>{item}</li>
          ))}
          <li>
            Private leaked lists, member-only directories, paywalled databases
            and rumour.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-2xl text-ink">Sources used</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-7">
          <li>
            <a className="text-accent underline-offset-2 hover:underline" href="https://fabians.org.uk/">
              fabians.org.uk
            </a>{" "}
            — Our people, Our history, executive biographies, annual reports and
            publication pages.
          </li>
          <li>
            Wikipedia category{" "}
            <a
              className="text-accent underline-offset-2 hover:underline"
              href="https://en.wikipedia.org/wiki/Category:Members_of_the_Fabian_Society"
            >
              Members of the Fabian Society
            </a>{" "}
            and related officer categories, used as a lead. Each kept name was
            checked so the article body, not only the category, mentions a
            Fabian link.
          </li>
          <li>UK Parliament biographies and registers of interests.</li>
          <li>TheyWorkForYou register extracts, used only as a pointer to official filings.</li>
          <li>GOV.UK ministerial lists and appointment notices (checked 30 August 2026).</li>
          <li>Scottish Parliament biographies and the Holyrood register of interests.</li>
          <li>
            Electoral Commission political finance registers, cited where a
            specific record was copied. Coverage is incomplete.
          </li>
          <li>
            University, think-tank and company about pages, and reputable news,
            used to corroborate a job or a Fabian fact already grounded in a
            public page.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-2xl text-ink">Donations</h2>
        <p className="mt-3 text-base leading-7">
          A donation is recorded only when an official record was opened and the
          donor, amount, date, nature and recipient could be copied. Gifts{" "}
          <em>to</em> the Fabian Society are flagged as Society-related. A gift
          to the Labour Party is not described as a Fabian donation.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-2xl text-ink">How to add a person</h2>
        <p className="mt-3 text-base leading-7">
          Edit <code className="rounded bg-accent-dim px-1.5 py-0.5">data/people.json</code>.
          Follow the fields in{" "}
          <code className="rounded bg-accent-dim px-1.5 py-0.5">lib/types.ts</code>.
          Every fact needs a source URL, a short label and an access date. Set
          <code className="rounded bg-accent-dim px-1.5 py-0.5">sourceQuality</code>{" "}
          to <code className="rounded bg-accent-dim px-1.5 py-0.5">wikipedia_only</code>{" "}
          if Wikipedia is the only citation. Do not guess membership.
        </p>
      </section>
    </main>
  );
}
