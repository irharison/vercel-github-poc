# Public Fabian register

An unofficial, statically generated directory of people with a **documented** relationship to the [Fabian Society](https://fabians.org.uk/). It is not limited to sitting Labour politicians. Records include job title, organisation, sector, party if any, living or deceased, and whether the Fabian link is corroborated or Wikipedia-only.

Live site: <https://vercel-github-poc.vercel.app>

This is political transparency, not a membership scrape. The Society does not publish a complete membership list. People are included when a public source names a Fabian role, states membership, records a gift **to the Society**, or records a Fabian pamphlet or essay.

Wikipedia categories are leads only. A name is kept only if the article body states a Fabian link. If that is the only citation, the person page says **Wikipedia only**.

Ordinary private members are not listed unless they have a public role or another published link. Authorship of a pamphlet, without a named role or membership statement, is labelled “authorship only”.

A donation to the Labour Party is not a donation to the Fabian Society.

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
3. Fill `jobTitle`, `organisation`, `sector`, `living`, `party` and `sourceQuality`.
4. Set `inclusionBasis` to `named_role_or_membership` only when a source names a role, states membership, or names a gift to the Society. Use `documented_output_only` for pamphlet authors without a membership citation.
5. Set `sourceQuality` to `wikipedia_only` if Wikipedia is the only URL. Do not treat a Wikipedia category tag as enough if the article never says they were a Fabian.
6. Add every citation to `sources` with `url`, `label` and `accessed` (ISO date).
7. Check the TypeScript fields in `lib/types.ts` if the build fails.

Do not invent membership. Do not scrape member-only, leaked or paywalled lists. Do not call a general Labour donation a Fabian donation.

Site-wide copy and the last-updated date live in `data/site.json`.

## Deploy

This repo is already linked to the Vercel project `vercel-github-poc`. Next.js is auto-detected. There is no `vercel.json` and no runtime API keys.

Push to `main` to deploy production.

## What this replaced

The previous homepage was a GitHub → Vercel proof of concept. That copy is gone.
