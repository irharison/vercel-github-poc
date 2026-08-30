"use client";

import { useMemo, useState } from "react";
import type { ReferenceCategory, ReferenceCategoryId } from "@/lib/types";
import { REFERENCE_CATEGORY_LABELS } from "@/lib/types";

const selectClass =
  "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink";

export function ReferencesExplorer({
  categories,
}: {
  categories: ReferenceCategory[];
}) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<"" | ReferenceCategoryId>("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .filter((category) => (group ? category.id === group : true))
      .map((category) => ({
        ...category,
        links: category.links.filter((item) => {
          if (!q) return true;
          const haystack = [item.title, item.publisher, item.summary, item.url, item.date]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(q);
        }),
      }))
      .filter((category) => category.links.length > 0);
  }, [categories, group, query]);

  const visibleCount = filtered.reduce((total, category) => total + category.links.length, 0);

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-xs tracking-wide text-muted uppercase">Search</span>
          <input
            className={selectClass}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Title, publisher or phrase"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs tracking-wide text-muted uppercase">Group</span>
          <select
            className={selectClass}
            value={group}
            onChange={(event) => setGroup(event.target.value as "" | ReferenceCategoryId)}
          >
            <option value="">All groups</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {REFERENCE_CATEGORY_LABELS[category.id]} ({category.links.length})
              </option>
            ))}
          </select>
        </label>
      </div>

      <nav aria-label="Reference groups" className="mt-6 flex flex-wrap gap-2">
        {categories.map((category) => (
          <a
            key={category.id}
            className="rounded-full border border-line bg-card px-3 py-1 text-xs text-muted hover:text-ink"
            href={`#${category.id}`}
          >
            {REFERENCE_CATEGORY_LABELS[category.id]}
          </a>
        ))}
      </nav>

      <p className="mt-6 text-sm text-muted">
        Showing {visibleCount} {visibleCount === 1 ? "link" : "links"}
        {group ? ` in ${REFERENCE_CATEGORY_LABELS[group]}` : " across all groups"}.
      </p>

      <div className="mt-8 space-y-14">
        {filtered.map((category) => (
          <section key={category.id} id={category.id} aria-labelledby={`${category.id}-heading`}>
            <h2 id={`${category.id}-heading`} className="font-serif text-2xl text-ink">
              {category.title}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">{category.intro}</p>
            <ul className="mt-6 divide-y divide-line border-y border-line">
              {category.links.map((item) => (
                <li key={item.url} className="py-4">
                  <p className="font-medium leading-6">
                    <a
                      className="text-accent underline-offset-2 hover:underline"
                      href={item.url}
                      rel="noreferrer"
                    >
                      {item.title}
                    </a>
                  </p>
                  <p className="mt-1 text-xs tracking-wide text-muted uppercase">
                    {item.publisher}
                    {item.date ? ` · ${item.date}` : ""}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted">{item.summary}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
