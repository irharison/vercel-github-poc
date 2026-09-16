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
copy .env.example .env.local
# then set AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET in .env.local
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

## Access (Google, nataliedennis.co.uk only)

The whole site is private. Auth.js (NextAuth v5) with the Google provider
allows only accounts whose email ends with `@nataliedennis.co.uk`. Other
Google / Gmail accounts are rejected. Copy `.env.example` to `.env.local`
and set:

| Variable | Purpose |
| --- | --- |
| `AUTH_SECRET` | Session signing secret (`openssl rand -base64 32`) |
| `AUTH_GOOGLE_ID` | Google OAuth 2.0 client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth 2.0 client secret |
| `AUTH_URL` | App origin (`http://localhost:3000` locally) |
| `AUTH_TRUST_HOST=true` | Trust `X-Forwarded-*` on Vercel |

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
still **hard-checks** the email domain in the Auth.js `signIn` / JWT
callbacks.

## PropertyData

Research lookups go through `GET /api/pd/...`. They are optional. Set
`PROPERTYDATA_API_KEY` in `.env.local` / Vercel to enable them. Cached
answers live in the browser; a refresh asks before spending a credit. Authenticated
`@nataliedennis.co.uk` users only.

## Tests

```bash
npm test
```

These are a TypeScript port of the Flutter engine tests. If a number
disagrees with `NDPropertyDev/app/lib/calc/engine.dart`, fix the TypeScript.
