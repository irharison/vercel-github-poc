# ND apps

Umbrella for the Natalie Dennis tools, hosted on Vercel from
[irharison/vercel-github-poc](https://github.com/irharison/vercel-github-poc).

**Grok / agents: read [GROK.md](./GROK.md) first.**

Live site: https://vercel-github-poc.vercel.app

One Google sign-in covers every app. The header switches between them.

| App | Path | What it is |
| --- | --- | --- |
| Launcher | `/` | Picks an app |
| ND Property | `/property` | Deal appraisal (stamp duty, lending, hold, sale) |
| Fathom Desk | `/fathom` | Teaching trading-and-risk desk, fictional books |

ND Property used to live at `/`, `/research`, `/cache`, and `/settings`. Those
three still redirect:

- `/research` → `/property/research`
- `/cache` → `/property/cache`
- `/settings` → `/property/settings`

`/` is now the launcher. The deal screen is `/property`.

## Run locally

Node app and the Fathom Python API are separate processes. The API is what
Vercel runs as the `fathom` service.

```bash
npm install
cp .env.example .env.local
# Set AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET.
# For a browser pass without Google, also set AUTH_DEV_BYPASS=1 (see below).

cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt -r requirements-dev.txt
cd ..

npm test
npm run test:api
npm run dev:stack
```

Open http://localhost:3000. The desk UI calls `/fathom/api/...` on that same
origin. `next dev` proxies those paths to http://127.0.0.1:8741. A production
build does not embed that address.

Two terminals, if you prefer:

```bash
# API. Export the bypass here too if .env.local sets it; uvicorn does not read .env.local.
cd backend && NODE_ENV=development AUTH_DEV_BYPASS=1 .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8741

# Web
AUTH_DEV_BYPASS=1 npm run dev
```

`npm run dev:stack` starts both and forwards `AUTH_DEV_BYPASS` from the
environment or `.env.local` into the API process.

### Dev-only sign-in bypass

`AUTH_DEV_BYPASS=1` skips the Google gate so the pages can be opened without
a Google client. It is active only when `NODE_ENV=development` and `VERCEL`
is unset. `next build`, `next start`, and every Vercel deployment ignore it.
Do not set it on the Vercel project. Classroom logins inside Fathom
(`desk` / `fathom`, `ops` / `fathom`) still apply to the desk API.

## Access (Google, nataliedennis.co.uk only)

The whole site is private, including Fathom pages, Swagger, and the Fathom
API. Auth.js (NextAuth v5) with the Google provider allows only accounts
whose email ends with `@nataliedennis.co.uk`. Copy `.env.example` to
`.env.local` and set:

| Variable | Purpose |
| --- | --- |
| `AUTH_SECRET` | Session signing secret (`openssl rand -base64 32`). The Fathom API reads this same value to check the session cookie. |
| `AUTH_GOOGLE_ID` | Google OAuth 2.0 client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth 2.0 client secret |
| `AUTH_URL` | App origin (`http://localhost:3000` locally) |
| `AUTH_TRUST_HOST=true` | Trust `X-Forwarded-*` on Vercel |
| `AUTH_DEV_BYPASS` | Optional. Local `next dev` only. Never set on Vercel. |
| `FATHOM_API_URL` | Optional. Local API origin for `next dev`. Default `http://127.0.0.1:8741`. Leave unset on Vercel. |
| `PROPERTYDATA_API_KEY` | Optional. Research only. |

No new variable is required on Vercel for Fathom. The Python service uses the
project's existing `AUTH_SECRET`.

### Google Cloud Console

1. [APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials) → Create credentials → OAuth client ID → Web application.
2. Authorized JavaScript origins:
   - `http://localhost:3000`
   - `https://vercel-github-poc.vercel.app`
3. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://vercel-github-poc.vercel.app/api/auth/callback/google`
4. Copy the client ID and secret into `.env.local` / Vercel env. Do not commit them.
5. Set the same values (plus `AUTH_SECRET`, `AUTH_URL=https://vercel-github-poc.vercel.app`, `AUTH_TRUST_HOST=true`) on the Vercel project.

The OAuth `hd=nataliedennis.co.uk` hint narrows the account picker. The app
still hard-checks the email domain in the Auth.js `signIn` / JWT callbacks,
and the Fathom API checks the session cookie again.

Signed-in sessions last **30 days** (JWT cookie, rolling). Production cookies
are `httpOnly`, `secure`, and `sameSite=lax`. Keep `AUTH_SECRET` stable on
Vercel so existing sessions stay valid across deploys.

The public sign-in page is only a Google login button. A non-ND account fails
after Google with an access-denied error.

## Fathom Desk API

Public paths keep the vendor shape under `/fathom`:

| | |
| --- | --- |
| Trades, pricing, risk, static data | `/fathom/api/...` (for example `/fathom/api/Trades`) |
| Liveness and valuation date | `/fathom/Monitoring/Ping` |
| Swagger | `/fathom/docs` |
| ReDoc | `/fathom/redoc` |
| OpenAPI | `/fathom/openapi.json` |

`/api/auth` stays Auth.js. `/api/pd` stays the PropertyData proxy. Nothing
under `/api` is sent to Python.

Classroom HTTP Basic is a second login for the desk API and for Swagger's
Authorize button: `desk` / `fathom` (Harper Quill) and `ops` / `fathom`
(Rowan Ash). `GET /fathom/Monitoring/Ping` does not need Basic. It still
needs the Google session. Passwords are plaintext in the seeded database on
purpose. This is a lesson, not a login system.

On Vercel the book is a SQLite file in `/tmp` for that function instance.
A cold start loads the sample book again. Reset is `PUT /fathom/api/Task`
with `{"Name":"SampleReset","Status":"Run"}`, or the Reset data button.

## PropertyData

Research lookups go through `GET /api/pd/...`. They are optional. Set
`PROPERTYDATA_API_KEY` to enable them. Cached answers live in the browser.
A refresh asks before spending a credit.

## Add an app

1. Add routes under `app/(umbrella)/<id>/` with their own layout if they need a sub-nav.
2. Append one object to `lib/apps.ts` (`id`, `name`, `href`, `description`, `match`). The launcher and the header switcher both read that list.
3. If the app has an API, give it a prefix that is not `/api/auth` or `/api/pd`. Route that prefix in `vercel.json` (and in the local `next dev` rewrites) without a catch-all over `/api`.

## Tests

```bash
npm test          # property engine, auth rules
npm run test:api  # Fathom pytest, from backend/.venv
npm run lint
npm run build
```

Property numbers that disagree with `NDPropertyDev/app/lib/calc/engine.dart`
should be fixed in TypeScript. None of the tax or lending figures are advice.

## Deploy

The Vercel project is `vercel-github-poc`. Production builds from `main`.
`vercel.json` defines two services in that one project:

- `web` — this Next.js app (`framework: nextjs`, root `.`)
- `fathom` — FastAPI (`root: backend`, entrypoint `app.main:app`)

Public rewrites send only the `/fathom` API, monitoring, and docs paths to
Python. Everything else, including `/api/auth` and `/api/pd`, goes to Next.js.

Push `main` to deploy. Do not add `AUTH_DEV_BYPASS` or `FATHOM_API_URL` on
Vercel.
