# GROK.md — continue this repo

This file is the handoff for Grok (and any other agent) working in
`vercel-github-poc` / local `NDPropertyVercel`.

**Work in this repository.** Do not edit the Flutter app unless the user
asks. The live site stays on Vercel project `vercel-github-poc`
(`https://vercel-github-poc.vercel.app`). Pushing `main` deploys production.
Ian prefers this solo repo pushed straight to `main` with no pull request
unless he asks for one.

## What this is

An umbrella Next.js app with a header switcher and a small registry in
`lib/apps.ts`. Two apps ship today:

1. **ND Property** (`/property`) — the Next.js port of **NDPropertyDev**, a
   deal-appraisal app for UK residential development / limited-company
   buy-to-let:
   - stamp duty (progressive bands + additional-dwelling surcharge)
   - interest-only lending (LTV cap vs ICR stress test — lender takes the lower)
   - day-one cash
   - rental hold (company CT vs personal Section 24)
   - sale / exit tax (company CT on gain vs personal residential CGT)
   - Spain villa (`/property/spain`, nav label **Spain villa**) — Andalucía
     purchase costs, renovation, and three finance options (cash, Spanish
     non-resident mortgage, UK remortgage). Euros, with pounds at an editable
     rate. Defaults are estimates to verify with a Spanish lawyer or gestor.
2. **Fathom Desk** (`/fathom`) — a teaching trading-and-risk desk. Its UI is
   inside this Next app. Its API is FastAPI + QuantLib, deployed as a second
   Vercel service in the same project. Books, firms, and prices are fictional.

**None of the tax or lending figures are advice.** They are seeded, editable
defaults. Keep that warning visible.

`/` is the launcher. Old ND Property URLs redirect:

- `/research` → `/property/research`
- `/cache` → `/property/cache`
- `/settings` → `/property/settings`

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
| Fathom API | `backend/` in this repo (`app.main:app`, Python 3.12) |

```bash
npm install
cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt -r requirements-dev.txt && cd ..
npm test
npm run test:api
npm run dev:stack
```

Open http://localhost:3000. `next dev` proxies `/fathom/api`, `/fathom/Monitoring`,
`/fathom/docs`, `/fathom/redoc`, and `/fathom/openapi.json` to
`http://127.0.0.1:8741` (override with `FATHOM_API_URL` or `API_PROXY_URL`).
That proxy is omitted when `VERCEL` is set or `NODE_ENV=production`, so
`next build` does not embed the loopback address. On Vercel, `vercel.json`
routes those prefixes to the Python service.

`AUTH_DEV_BYPASS=1` opens the site without Google during `next dev` only.
It does nothing when `VERCEL` is set or `NODE_ENV` is production. The API
process needs the same variable and `NODE_ENV=development`. `npm run dev:stack`
forwards it from the shell or `.env.local`. Do not set it on Vercel.

## What is already implemented

- Faithful TypeScript port of the calc engine in `lib/calc/`
- Vitest suite in `tests/engine.test.ts` covering the important Dart cases
- Deal screen: inputs + live appraisal (desktop two-column), now at `/property`
- Settings, research, and browser cache under `/property`
- Saved deals / current deal / settings in `localStorage`
- Vercel route `GET /api/pd/[...endpoint]` (allowlisted proxy)
- Auth.js (NextAuth v5) Google sign-in, restricted to `@nataliedennis.co.uk`,
  covering the launcher, ND Property, Fathom pages, and the Fathom API
- Fathom Desk screens and Learn drawer under `/fathom`
- Fathom FastAPI service, classroom Basic auth (`desk`/`fathom`, `ops`/`fathom`)
  as a second layer on the desk API
- Spain villa screen at `/property/spain`. Pure model in `lib/spain/`
  (`calculateSpainVilla`), covered by `tests/spain-villa.test.ts`. It does
  not change the UK deal engine. Inputs autosave to `localStorage` key
  `ndproperty.spainVilla`.

Seeded property defaults match Flutter: £250k purchase, £1,200/month rent,
24-month hold, 3% growth, company ownership, 75% LTV, 1.25× ICR at 5.5%
stress. On those defaults the sale is a **chargeable loss** — that is expected.

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
7. **Do not** set `AUTH_DEV_BYPASS` or `FATHOM_API_URL` on Vercel. Fathom needs
   no new env var. It reads the existing `AUTH_SECRET`.

## Add an app

Adding a third app is code plus one registry entry:

1. Routes under `app/(umbrella)/<id>/`. Give the app its own URL prefix.
2. One object in `lib/apps.ts` (`id`, `name`, `href`, `description`, `match`).
   The launcher and `components/app-switcher.tsx` both read that list.
3. If it has an API, do not send `/api/auth` or `/api/pd` to it. Add a specific
   prefix in `vercel.json` rewrites and in the local `next dev` rewrites in
   `next.config.ts`.

## Architecture

```
app/(umbrella)/page.tsx              Launcher
app/(umbrella)/layout.tsx            Google gate + umbrella header
app/(umbrella)/property/             ND Property (deal, Spain villa, research, cache, settings)
app/(umbrella)/property/spain/     Spain villa screen
app/(umbrella)/fathom/               Fathom screens + scoped desk CSS
app/signin/page.tsx                  Google sign-in
app/api/auth/[...nextauth]           Auth.js route handlers
app/api/pd/[...endpoint]             PropertyData proxy (key stays on the server)
auth.ts                              Auth.js (Google + domain allowlist)
proxy.ts                             Session check. Dev bypass returns before Auth.js.
lib/apps.ts                          App registry
lib/auth-domain.ts                   @nataliedennis.co.uk check, public paths
lib/auth-dev.ts                      AUTH_DEV_BYPASS (development, not Vercel)
lib/calc/                            UK property engine — pure functions
lib/spain/                         Andalucía villa model — pure functions
lib/fathom/                          Desk client (API prefix /fathom)
components/umbrella-shell.tsx        Header, switcher, sign out
components/property-shell.tsx        Deal / Research / Cache / Settings
components/fathom/                   Desk shell, ticket, grids
backend/app/main.py                  FastAPI entrypoint app.main:app
backend/app/gate.py                  Auth.js cookie check for the Python service
backend/app/prefix.py                PUBLIC_PREFIX = /fathom
vercel.json                          Services: web (Next) + fathom (Python)
```

`calculateDeal({ deal, settings })` is the whole UK property appraisal. UI is a
shell over that. `calculateSpainVilla(inputs)` in `lib/spain/engine.ts` is the
whole Andalucía villa model, and the Spain villa screen is a shell over that.
The two engines do not share inputs.

## Spain villa

Nav label **Spain villa**, route `/property/spain`, next to Deal.

Currency transfer is not inside the single acquisition total. A Spanish
mortgage does not convert the borrowed euros, so each finance column has its
own transfer cost. Acquisition on the summary is the price plus purchase
costs before that transfer. Total cost of ownership is that all-in project
cost, plus the option's transfer, finance fees and interest over the term.
Running costs stay annual.

Default assumptions (all editable, all estimates — confirm with a Spanish
lawyer or gestor):

| Item | Default |
| --- | --- |
| Purchase | €750,000 resale, Marbella / Málaga illustration |
| ITP | 7% (new build instead: 10% IVA + 1.2% AJD) |
| Notary / land registry | 0.75% each of the price (often quoted 0.5–1%) |
| Lawyer | 1% + 21% IVA on the fee |
| NIE, bank, admin | €1,000 |
| Survey | €1,500 |
| Buyer's agent | 0% (21% IVA if a fee is entered; about 3% is a common fee) |
| FX spread | 0.5% of the euros that option buys |
| Pounds per euro | 0.86 |
| Renovation | 200 m² at the medium tier, €1,000/m² (light €500, full €1,800). Line items are stored but not added unless that mode is on |
| Architect / project manager | 10% of the works budget |
| Licencia / ICIO | 4% of the works budget |
| IVA on works | 21% of works, fees and contingency (not on the licence) |
| Contingency | 10% of works plus professional fees |
| Spanish mortgage | 70% LTV of the price, 3.5% fixed, 20 years, 1% arrangement fee, €450 valuation |
| UK remortgage | £500,000, 4.5%, 20 years, 1% arrangement, £1,500 other fees |
| IRNR | 24% on imputed income (1.1% of a €300,000 cadastral-value placeholder) |

On those defaults the resale tax is €52,500, purchase costs before transfer
are €75,325, the renovation is €300,820 and the all-in project cost before
transfer is €1,126,145. A 70% Spanish loan is €525,000, so the deposit is
30% of the price and the costs are extra cash.

**Rent instead** is on the same screen. It prices an off-season tenancy
(default 7 months, October to May/June, at €2,500 a month — a Costa del Sol
estimate, not a listing). The season cost includes rent, an agency fee of one
month plus 21% IVA, utilities, cleaning, insurance, optional car hire and
travel. A 2-month deposit is shown and is not a cost, because it is
refundable. Later seasons rise by 3% a year. The page compares the cumulative
rent after 1, 5 and 10 years with the cost of buying on each finance option:
price, purchase costs, renovation, currency transfer, finance fees, interest
for those years and running costs, minus the villa's value. Value starts at
the post-renovation figure, or the purchase price if that is blank, and grows
by 2% a year. The first year (up to 40) in which buying costs less is the
breakeven. Selling costs are not deducted.

**Peak-season let** is off until switched on. It then uses 3 months at
€5,500 a month, 60% occupancy, a 20% manager plus 21% IVA, and a €350 one-off
VFT allowance. That income feeds the net annual cost. Imputed non-resident
tax remains on the months that are not offered. Andalucía requires the VFT
registration before a tourist let is advertised.

**Digital nomad visa** is off until switched on. Spain's property golden visa
ended on 3 April 2025, and the model never reduces ITP, IVA or AJD because of
a visa. Switching it on treats the owner as Spanish tax resident: imputed
non-resident tax on the villa drops to zero, including any non-resident tax
on rent (a resident's rental profit is IRPF, and it is not calculated here).
Visa costs are estimates: €160 application, €16 TIE, €400 translations and
apostilles, €120 criminal-record check, €1,500 immigration lawyer, €1,500 a
year of health insurance, and an €800 renewal every 3 years. The one-off total
is in year one. The annual total (health insurance plus the renewal spread
over the interval) is in the net annual cost, in each finance option's total
cost of ownership for that option's term (cash uses the Spanish term), and on
both sides of the 1, 5 and 10 year comparison. The income test compares
€48,000 of example remote-work income with €34,188, about 200% of the 2026
minimum wage (€2,849 a month). IRPF uses combined state + Andalucía bands
after a €5,550 allowance. Beckham is 24% of employment income up to €600,000
and 47% above that, for 6 years, and only while the eligibility switch is on.
UK income tax is blank until typed. Salary tax is shown beside the villa and
is not added to its cost. Wealth tax, the solidarity tax, social security and
the UK–Spain treaty are not calculated.

Small **i** buttons sit beside the main inputs and results. Hover opens the note on a desktop pointer; a tap pins it, including on a phone; Escape or a tap outside closes it. The note says what the figure is, how this model calculates it, and where to check it with a lawyer or gestor. The same button is used on the Deal page for the price, stamp duty, borrowing and profit lines. The notes describe the model. They are not advice.

None of this is advice.

Fathom fetches are same-origin. `lib/fathom/api.ts` prefixes them with
`/fathom`, so `/api/Trades` in the client becomes `/fathom/api/Trades`.
FastAPI routes use that same prefix, and Swagger / `openapi.json` list it.
JSON fields stay PascalCase.

The Python service sees the public path. Vercel does not strip `/fathom`.
Do not add a catch-all rewrite of `/api/(.*)`.

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

Vercel service rewrites send `/fathom/api`, `/fathom/Monitoring`,
`/fathom/docs`, `/fathom/redoc`, and `/fathom/openapi.json` to Python
**before** Next.js `proxy.ts` runs. `backend/app/gate.py` decrypts the
Auth.js session cookie (`dir` + `A256CBC-HS512`, HKDF from `AUTH_SECRET`,
salt = cookie name) and applies the same email rule. A missing or foreign
session is 401. A browser navigation to Swagger redirects to `/signin`.
Classroom Basic is checked only after that gate, inside the API routes.
`GET /fathom/Monitoring/Ping` does not need Basic.

`FATHOM_TESTING=1` turns the Python gate off for pytest. It is ignored when
`VERCEL` is set.

Sessions are JWT cookies, **30 days**, rolling (activity extends expiry). Cookies are
`httpOnly`, `sameSite=lax`, and `secure` on HTTPS/Vercel. They are not
browser-session cookies — closing the tab does not sign Ian out. Sign out
still clears the cookie. `AUTH_SECRET` must be a stable Vercel env value or
JWTs cannot survive deploys, and the Fathom API would reject them.

The public `/signin` page is only branding plus Sign in with Google. It must not
mention env var names, README, missing credentials, or the allowed email domain.
Rejected Google accounts fail after sign-in with a generic access-denied error.

Fathom's own sign-out button clears the classroom Basic login only. The
header Sign out ends the Google session.

Env (never commit real values):

- `AUTH_SECRET`
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
- `AUTH_URL` (production: `https://vercel-github-poc.vercel.app`)
- `AUTH_TRUST_HOST=true`
- `AUTH_DEV_BYPASS` (local next dev only; leave unset on Vercel)
- `FATHOM_API_URL` (local proxy only; leave unset on Vercel)
- `FATHOM_DB` / `FATHOM_DATABASE_URL` (optional SQLite overrides; not Postgres)

Google Cloud OAuth redirect URIs:

- `http://localhost:3000/api/auth/callback/google`
- `https://vercel-github-poc.vercel.app/api/auth/callback/google`

See README for the full Console steps.

## Deploy

Repo is already the Vercel project `vercel-github-poc`. Push `main`:

```bash
git push origin main
```

`vercel.json` services:

| Service | Root | Runtime |
| --- | --- | --- |
| `web` | `.` | Next.js |
| `fathom` | `backend` | Python, entrypoint `app.main:app` |

Rewrites, in order: `/fathom/api/(.*)`, `/fathom/Monitoring/(.*)`,
`/fathom/docs`, `/fathom/docs/(.*)`, `/fathom/redoc`, `/fathom/openapi.json`
go to `fathom`. `/(.*)` goes to `web`.

Existing Vercel env (do not change it from this repo):

- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `AUTH_URL=https://vercel-github-poc.vercel.app`
- `AUTH_TRUST_HOST=true`
- `PROPERTYDATA_API_KEY` (optional; Research only)

QuantLib ships a manylinux wheel and fits the standard Python bundle limit.
The book on Vercel is `/tmp/fathom.db` per instance, seeded on cold start.

## Product tone

Desktop-first. Property uses green `#1B5E4A`, GB pounds, and is honest about
losses and tax traps. Fathom keeps its own dark desk chrome inside the
umbrella header. Prefer accuracy over marketing copy.
