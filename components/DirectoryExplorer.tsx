"use client";

import { useMemo, useState } from "react";
import { PersonCard } from "@/components/PersonCard";
import type { Person } from "@/lib/types";
import {
  CHAMBER_LABELS,
  FABIAN_STATUS_LABELS,
  LABOUR_ROLE_LABELS,
  POSITION_LABELS,
} from "@/lib/types";

const selectClass =
  "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink";

export function DirectoryExplorer({ people }: { people: Person[] }) {
  const [query, setQuery] = useState("");
  const [positionType, setPositionType] = useState("");
  const [labourRole, setLabourRole] = useState("");
  const [chamber, setChamber] = useState("");
  const [fabianRole, setFabianRole] = useState("");
  const [basis, setBasis] = useState("");
  const [hasDonations, setHasDonations] = useState(false);
  const [hasPamphlets, setHasPamphlets] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return people.filter((person) => {
      if (positionType === "donor") {
        const isDonor =
          person.positionType === "donor" ||
          person.donations.some((donation) => Boolean(donation.amount));
        if (!isDonor) return false;
      } else if (positionType && person.positionType !== positionType) {
        return false;
      }
      if (labourRole && person.labourRole !== labourRole) return false;
      if (chamber && person.chamber !== chamber) return false;
      if (fabianRole && person.primaryFabianStatus !== fabianRole) return false;
      if (basis && person.inclusionBasis !== basis) return false;
      if (hasDonations && person.donations.length === 0) return false;
      if (hasPamphlets && person.outputs.length === 0) return false;
      if (!q) return true;

      const haystack = [
        person.name,
        person.honorific,
        person.currentPosition,
        person.constituency,
        person.fabianSummary,
        ...person.outputs.map((item) => item.title),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [
    people,
    query,
    positionType,
    labourRole,
    chamber,
    fabianRole,
    basis,
    hasDonations,
    hasPamphlets,
  ]);

  return (
    <div>
      <form
        className="rounded-2xl border border-line bg-card p-5 sm:p-6"
        onSubmit={(event) => event.preventDefault()}
        role="search"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="md:col-span-2 xl:col-span-3">
            <span className="mb-1 block text-xs tracking-wide text-muted uppercase">
              Search
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, constituency, pamphlet title…"
              className={selectClass}
            />
          </label>
          <label>
            <span className="mb-1 block text-xs tracking-wide text-muted uppercase">
              Position type
            </span>
            <select
              className={selectClass}
              value={positionType}
              onChange={(event) => setPositionType(event.target.value)}
            >
              <option value="">All</option>
              {Object.entries(POSITION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs tracking-wide text-muted uppercase">
              Labour role
            </span>
            <select
              className={selectClass}
              value={labourRole}
              onChange={(event) => setLabourRole(event.target.value)}
            >
              <option value="">All</option>
              {Object.entries(LABOUR_ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs tracking-wide text-muted uppercase">
              Chamber
            </span>
            <select
              className={selectClass}
              value={chamber}
              onChange={(event) => setChamber(event.target.value)}
            >
              <option value="">All</option>
              {Object.entries(CHAMBER_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs tracking-wide text-muted uppercase">
              Fabian role
            </span>
            <select
              className={selectClass}
              value={fabianRole}
              onChange={(event) => setFabianRole(event.target.value)}
            >
              <option value="">All</option>
              {Object.entries(FABIAN_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs tracking-wide text-muted uppercase">
              Inclusion basis
            </span>
            <select
              className={selectClass}
              value={basis}
              onChange={(event) => setBasis(event.target.value)}
            >
              <option value="">All documented relationships</option>
              <option value="named_role_or_membership">
                Named role or membership
              </option>
              <option value="documented_output_only">
                Pamphlet or essay only
              </option>
            </select>
          </label>
          <fieldset className="flex flex-col justify-end gap-2 text-sm">
            <legend className="sr-only">Record filters</legend>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={hasDonations}
                onChange={(event) => setHasDonations(event.target.checked)}
              />
              Has a sourced donation or register entry
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={hasPamphlets}
                onChange={(event) => setHasPamphlets(event.target.checked)}
              />
              Has pamphlets or other Fabian output
            </label>
          </fieldset>
        </div>
      </form>

      <p className="mt-6 text-sm text-muted" aria-live="polite">
        Showing {filtered.length} of {people.length} people
      </p>

      {filtered.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-line bg-card px-5 py-10 text-center text-muted">
          No records match these filters. Try clearing a field or searching a
          different name.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {filtered.map((person) => (
            <PersonCard key={person.slug} person={person} />
          ))}
        </div>
      )}
    </div>
  );
}
