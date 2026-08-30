# Labour–Fabian public register

An unofficial, statically generated directory of **Labour politicians, former office-holders, peers, donors and other public figures** with a **documented** relationship to the [Fabian Society](https://fabians.org.uk/).

Live site: <https://vercel-github-poc.vercel.app>

This is political transparency, not a membership scrape. The Fabian Society does not publish a complete membership list. People are included when a public source names a Fabian role, states membership, records a gift **to the Society**, or records a Fabian pamphlet or essay. Wikipedia is never the sole source.

Ordinary private members are not listed unless they have a public role or another published link. Authorship of a pamphlet, without a named role or membership statement, is labelled “authorship only” and is not treated as proof of membership.

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
3. Fill only fields you can source. Leave donations, organisations or output blank if unknown.
4. Set `inclusionBasis` to `named_role_or_membership` only when a source names a role, states membership, or names a gift to the Society. Use `documented_output_only` for pamphlet or essay authors without a membership citation.
5. Use `positionType` `former_mp`, `donor` or `other_public_figure` where that is the clearest public description.
6. Add every citation to `sources` with `url`, `label` and `accessed` (ISO date).
7. Check the TypeScript fields in `lib/types.ts` if the build fails.

Do not invent membership. Do not scrape member-only, leaked or paywalled lists. Do not call a general Labour donation a Fabian donation.

Site-wide copy and the last-updated date live in `data/site.json`.

## Deploy

This repo is already linked to the Vercel project `vercel-github-poc`. Next.js is auto-detected. There is no `vercel.json` and no runtime API keys.

Push to `main` to deploy production.

## What this replaced

The previous homepage was a GitHub → Vercel proof of concept. That copy is gone.
