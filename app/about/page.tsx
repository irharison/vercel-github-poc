import type { Metadata } from "next";
import { formatDate, site } from "@/lib/people";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How this unofficial Labour–Fabian public register is compiled, what is excluded, and how to update it.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="font-serif text-4xl text-ink">Methodology</h1>
      <p className="mt-4 text-lg leading-8 text-muted">
        Last updated {formatDate(site.lastUpdated)}. This site is a static public
        register. It is not an official Fabian Society or Labour Party list.
      </p>

      <section className="mt-10">
        <h2 className="font-serif text-2xl text-ink">Purpose</h2>
        <p className="mt-3 text-base leading-7">
          The Fabian Society is a membership think tank affiliated to the Labour
          Party. It does not publish a complete membership roll. This register
          collects only those Labour public office-holders whose Fabian
          relationship is documented in a public source with a URL.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-2xl text-ink">What is included</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-7">
          <li>
            A named Fabian office: executive, chair, vice-chair, treasurer,
            vice-president, local society officer, Young Fabians or Fabian
            Women&apos;s Network role.
          </li>
          <li>
            An explicit membership statement on an official register or
            biography (for example the Holyrood register of interests).
          </li>
          <li>
            Authorship of a Fabian pamphlet or named essay collection, labelled
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
          <li>UK Parliament biographies and registers of interests.</li>
          <li>TheyWorkForYou register extracts, used only as a pointer to official filings.</li>
          <li>GOV.UK ministerial lists and appointment notices (current as of 29 August 2026).</li>
          <li>Scottish Parliament biographies and the Holyrood register of interests.</li>
          <li>
            Electoral Commission political finance registers, cited where a
            specific record was copied. Coverage is incomplete.
          </li>
          <li>
            Reputable news used only to corroborate a fact already grounded in a
            primary page (for example LabourList on the August 2026 co-chair
            election).
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-2xl text-ink">Donations</h2>
        <p className="mt-3 text-base leading-7">
          A donation is recorded only when an official record was opened and the
          donor, amount, date, nature and recipient could be copied. A Fabian
          Society unpaid office declared on a parliamentary register is listed
          in the donations table as a register entry, not as money. Nothing is
          described as a “Fabian donation” unless the donor is the Fabian
          Society or a clearly related body.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-2xl text-ink">How to add a person</h2>
        <p className="mt-3 text-base leading-7">
          Edit <code className="rounded bg-accent-dim px-1.5 py-0.5">data/people.json</code>.
          Follow the fields in{" "}
          <code className="rounded bg-accent-dim px-1.5 py-0.5">lib/types.ts</code>.
          Every fact needs a source URL, a short label and an access date. If a
          field is unknown, leave it blank. Do not guess membership.
        </p>
      </section>
    </main>
  );
}
