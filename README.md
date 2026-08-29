# Labour–Fabian public register

An unofficial, statically generated directory of **Labour public office-holders** with a **documented** relationship to the [Fabian Society](https://fabians.org.uk/).

Live site: <https://vercel-github-poc.vercel.app>

This is political transparency, not a membership scrape. The Fabian Society does not publish a complete membership list. People are included only when a public source names a Fabian role, states membership, or records a Fabian pamphlet or essay. Wikipedia is never the sole source.

The site is not an official Fabian Society or Labour Party publication.

## Local

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `npm run build` is the same command Vercel runs.

## How to add a person

1. Open `data/people.json`.
2. Copy an existing object and give it a unique `slug`.
3. Fill only fields you can source. Leave donations, organisations or output blank if unknown.
4. Set `inclusionBasis` to `named_role_or_membership` only when a source names a role or states membership. Use `documented_output_only` for pamphlet or essay authors without a membership citation.
5. Add every citation to `sources` with `url`, `label` and `accessed` (ISO date).
6. Check the TypeScript fields in `lib/types.ts` if the build fails.

Do not invent membership. Do not scrape member-only, leaked or paywalled lists.

Site-wide copy and the last-updated date live in `data/site.json`.

## Deploy

This repo is already linked to the Vercel project `vercel-github-poc`. Next.js is auto-detected. There is no `vercel.json` and no runtime API keys.

Push to `main` to deploy production.

## What this replaced

The previous homepage was a GitHub → Vercel proof of concept. That copy is gone.
