# GitHub → Vercel PoC

A small Next.js (App Router) web app that proves GitHub → Vercel auto-deploy.

Vercel detects Next.js from `package.json` and deploys with **zero extra config**. Pushing to `main` triggers a production deployment. No custom server, no `vercel.json`, and no extra secrets.

The homepage is a finished one-pager named as a GitHub → Vercel proof of concept — not the default create-next-app splash.

## Local

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `npm run build` is the same command Vercel runs.

## Deploy on Vercel

1. Import [this GitHub repo](https://github.com/irharison/vercel-github-poc) in Vercel.
2. Leave the detected Next.js settings as-is.
3. Push to `main`. Vercel builds and deploys automatically.

Connect the project once; after that, every push to `main` ships a new production deploy.
