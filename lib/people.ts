import peopleJson from "@/data/people.json";
import siteJson from "@/data/site.json";
import type { Person } from "@/lib/types";

export const people = peopleJson as Person[];
export const site = siteJson;

export function getPerson(slug: string): Person | undefined {
  return people.find((person) => person.slug === slug);
}

export function getPeopleSorted(): Person[] {
  return [...people].sort((a, b) => a.name.localeCompare(b.name, "en-GB"));
}

export function counts() {
  const named = people.filter((p) => p.inclusionBasis === "named_role_or_membership");
  const outputOnly = people.filter((p) => p.inclusionBasis === "documented_output_only");
  const withDonations = people.filter((p) => p.donations.length > 0);
  const withPamphlets = people.filter((p) => p.outputs.length > 0);
  const cabinetOrMinister = people.filter(
    (p) => p.labourRole === "cabinet" || p.labourRole === "minister" || p.labourRole === "whip",
  );

  return {
    total: people.length,
    named: named.length,
    outputOnly: outputOnly.length,
    withDonations: withDonations.length,
    withPamphlets: withPamphlets.length,
    cabinetOrMinister: cabinetOrMinister.length,
    mps: people.filter((p) => p.positionType === "mp").length,
    formerMps: people.filter((p) => p.positionType === "former_mp").length,
    peers: people.filter((p) => p.positionType === "peer").length,
    msps: people.filter((p) => p.positionType === "msp").length,
    senedd: people.filter((p) => p.positionType === "senedd").length,
    donors: people.filter(
      (p) =>
        p.positionType === "donor" ||
        p.donations.some((donation) => Boolean(donation.amount)),
    ).length,
    otherPublicFigures: people.filter(
      (p) => p.positionType === "other_public_figure",
    ).length,
    local: people.filter((p) =>
      ["councillor", "mayor", "pcc", "combined_authority"].includes(p.positionType),
    ).length,
  };
}

export function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1)));
}
