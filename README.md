# ND Property (Vercel)

Web port of the NDPropertyDev Flutter deal-appraisal app. Hosted on Vercel
from GitHub repo [irharison/vercel-github-poc](https://github.com/irharison/vercel-github-poc).

**Grok / agents: read [GROK.md](./GROK.md) first.**

Live site (once this `main` is deployed): https://vercel-github-poc.vercel.app

## Run locally

All development happens in this folder:

```bash
cd C:\Users\IanHarrison\OneDrive\svn\NDPropertyVercel
npm install
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What it does

Appraises a residential purchase held in a limited company (or personally):

1. Stamp duty
2. How much an interest-only lender will actually advance (LTV vs ICR)
3. Cash required on day one
4. Rental hold and tax
5. Sale and tax on the gain

Every rate is editable in Settings. None of it is advice.

## PropertyData

Research lookups go through `GET /api/pd/...`. They are optional. Set
`PROPERTYDATA_API_KEY` in `.env.local` / Vercel to enable them. Cached
answers live in the browser; a refresh asks before spending a credit.

## Tests

```bash
npm test
```

These are a TypeScript port of the Flutter engine tests. If a number
disagrees with `NDPropertyDev/app/lib/calc/engine.dart`, fix the TypeScript.
