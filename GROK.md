# GROK.md — continue ND Property from this repo

This file is the handoff for Grok (and any other agent) working in
`vercel-github-poc` / local `NDPropertyVercel`.

**Work in this repository.** Do not edit the Flutter app unless the user
asks. The live site is expected to stay on Vercel project `vercel-github-poc`
(`https://vercel-github-poc.vercel.app`). Pushing `main` deploys production.

## What this is

A Next.js (App Router) port of **NDPropertyDev**, a Flutter deal-appraisal
app for UK residential development / limited-company buy-to-let:

- stamp duty (progressive bands + additional-dwelling surcharge)
- interest-only lending (LTV cap vs ICR stress test — lender takes the lower)
- day-one cash
- rental hold (company CT vs personal Section 24)
- sale / exit tax (company CT on gain vs personal residential CGT)

**None of the tax or lending figures are advice.** They are seeded, editable
defaults. Keep that warning visible.

## Source Flutter app (read-only reference)

The folder the user first named, `C:\Users\IanHarrison\OneDrive\svn\NDProperty`,
was **empty**. The real Flutter app is:

```
C:\Users\IanHarrison\OneDrive\svn\NDPropertyDev
  app/lib/calc/engine.dart      ← calculation engine (source of truth for maths)
  app/lib/calc/deal.dart
  app/lib/calc/tax_tables.dart
  app/test/engine_test.dart     ← 105 Dart tests; port more of these if needed
  app/lib/ui/                   ← Deal, Research, Cache, Settings screens
  worker/                       ← Cloudflare PropertyData proxy
```

If Dart and TypeScript disagree, **Dart wins** until the user says otherwise.

## Local paths

| Role | Path |
| --- | --- |
| This web app (run everything from here) | `C:\Users\IanHarrison\OneDrive\svn\NDPropertyVercel` |
| GitHub remote for Grok | `https://github.com/irharison/vercel-github-poc` |
| Flutter original | `C:\Users\IanHarrison\OneDrive\svn\NDPropertyDev` |

```bash
cd C:\Users\IanHarrison\OneDrive\svn\NDPropertyVercel
npm install
npm test
npm run dev
npm run build
```

Open http://localhost:3000

## What is already implemented

- Faithful TypeScript port of the calc engine in `lib/calc/`
- Vitest suite in `tests/engine.test.ts` covering the important Dart cases
- Deal screen: inputs + live appraisal (desktop two-column)
- Settings: ownership, SDLT bands, mortgage defaults, CT/CGT/IT
- Saved deals / current deal / settings in `localStorage`
- Research + browser cache UI for PropertyData
- Vercel route `GET /api/pd/[...endpoint]` (allowlisted proxy)
- Auth.js (NextAuth v5) Google sign-in, restricted to `@nataliedennis.co.uk`

Seeded defaults match Flutter: £250k purchase, £1,200/month rent, 24-month
hold, 3% growth, company ownership, 75% LTV, 1.25× ICR at 5.5% stress. On
those defaults the sale is a **chargeable loss** — that is expected.

## What still needs doing (continue here)

1. **Port remaining Dart engine tests** from `NDPropertyDev/app/test/engine_test.dart`
   into `tests/engine.test.ts`. Do not change engine behaviour to make a test
   pass unless you can show the Dart engine does the same thing.
2. **Polish UI** to match Flutter more closely: mortgage-terms expansion,
   SDLT band add/remove rows, saved-deal picker in the header, mobile tabs
   for Inputs vs Appraisal.
3. **PropertyData server cache.** `/api/pd` currently has no durable cache
   (serverless memory dies). Add Vercel KV / Redis (or keep using the
   Cloudflare worker URL in Settings). **Never call upstream on a cache hit.
   Never spend a credit without an explicit confirm.** Asking rents from
   PropertyData are **weekly** — `readMonthlyRent` already converts.
4. **Set `PROPERTYDATA_API_KEY`** in the Vercel project if Research should
   work in production. Do not commit the key. Deal appraisal must keep
   working with no key (503 on research is fine).
5. **Optional:** point Settings → PropertyData base URL at the existing
   Cloudflare worker instead of `/api/pd`, and send `Authorization: Bearer APP_TOKEN`.
6. **Do not** copy secrets from `C:\Users\IanHarrison\OneDrive\svn`
   (`*.apikey`, `*ClientSecret*`, `keys/`, `.dev.vars`).

## Architecture

```
app/page.tsx                 Deal
app/research/page.tsx        PropertyData lookups
app/cache/page.tsx           Browser cache of paid lookups
app/settings/page.tsx        Tax / lending tables
app/signin/page.tsx          Google sign-in (nataliedennis.co.uk only)
app/api/auth/[...nextauth]   Auth.js route handlers
app/api/pd/[...endpoint]     PropertyData proxy (key stays on the server)
auth.ts                      Auth.js (Google + domain allowlist)
proxy.ts                     Require a session on every non-auth route
lib/auth-domain.ts           `@nataliedennis.co.uk` check
lib/calc/engine.ts           Pure functions — no UI, no I/O
lib/calc/types.ts
lib/calc/defaults.ts
lib/calc/json.ts             localStorage-safe parse with defaults
lib/store.ts                 browser persistence
lib/propertydata.ts          allowlist, postcode canonicalisation, parsers
components/                  client UI
```

`calculateDeal({ deal, settings })` is the whole appraisal. UI is a shell
over that.

## Engine rules you must not break

- Additional-dwelling surcharge is added to **every** SDLT band, including
  the nil-rate band, once price ≥ `surchargeMinPrice`.
- A company buying a dwelling always pays those higher rates.
- Loan = min(LTV cap, ICR cap). A requested deposit below the lender
  minimum is **not** honoured; `cappedByLender` becomes true and the
  deposit is forced up.
- Company: interest deductible; CT on cash profit and on the gain. No CGT
  annual exemption.
- Personal: Section 24 — interest added back, then a basic-rate credit
  capped at interest, taxable profit, and tax due. A cash-loss year can
  still produce a tax bill.
- Arrangement fee added to the loan is not day-one cash, but interest is
  charged on the drawn balance.
- `extractNumber` returns **null, not zero**, when a field is missing.

## Auth (Google domain allowlist)

The site is not public. `proxy.ts` sends anonymous visitors to `/signin`.
Only a Google account whose email ends with `@nataliedennis.co.uk`
(case-insensitive) can get a session. That check runs in the Auth.js
`signIn` callback and again on the JWT/session. Google also receives
`hd=nataliedennis.co.uk` as an account-picker hint.

Unauthenticated routes: `/signin`, `/auth/error`, `/api/auth/*`.

Sessions are JWT cookies, **30 days**, rolling (activity extends expiry). Cookies are
`httpOnly`, `sameSite=lax`, and `secure` on HTTPS/Vercel. They are not
browser-session cookies — closing the tab does not sign Ian out. Sign out
still clears the cookie. `AUTH_SECRET` must be a stable Vercel env value or
JWTs cannot survive deploys.

The public `/signin` page must never mention env var names, README, or
missing credentials. Setup lives only in this file, README, and `.env.example`.

Env (never commit real values):

- `AUTH_SECRET`
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
- `AUTH_URL` (production: `https://vercel-github-poc.vercel.app`)
- `AUTH_TRUST_HOST=true`

Google Cloud OAuth redirect URIs:

- `http://localhost:3000/api/auth/callback/google`
- `https://vercel-github-poc.vercel.app/api/auth/callback/google`

See README for the full Console steps.

## Deploy

Repo is already the Vercel project `vercel-github-poc`. Push `main`:

```bash
git push origin main
```

Add env in Vercel:

- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `AUTH_URL=https://vercel-github-poc.vercel.app`
- `AUTH_TRUST_HOST=true`
- `PROPERTYDATA_API_KEY` (optional; Research only)

## Product tone

Desktop-first, green brand `#1B5E4A`, GB pounds, honest about losses and
tax traps. Prefer accuracy over marketing copy.
