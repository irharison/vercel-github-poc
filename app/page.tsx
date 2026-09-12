function deployFacts() {
  const onVercel = process.env.VERCEL === "1";
  const environment = process.env.VERCEL_ENV ?? "development";
  const region = process.env.VERCEL_REGION ?? "local";
  const sha = process.env.VERCEL_GIT_COMMIT_SHA;
  const commit = sha ? sha.slice(0, 7) : "local";

  return [
    { label: "Status", value: onVercel ? "Live on Vercel" : "Running locally" },
    { label: "Environment", value: environment },
    { label: "Region", value: region },
    { label: "Commit", value: commit },
    { label: "Built at", value: new Date().toISOString() },
  ];
}

export default function Home() {
  const facts = deployFacts();
  const onVercel = process.env.VERCEL === "1";

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden">
      <div
        aria-hidden="true"
        className="hero-grid pointer-events-none absolute inset-0"
      />
      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <p className="font-mono text-xs tracking-[0.22em] text-muted uppercase">
          vercel-github-poc
        </p>
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card/80 px-3 py-1 text-xs text-foreground">
          <span
            className={`h-1.5 w-1.5 rounded-full ${onVercel ? "bg-accent" : "bg-amber-400"}`}
            aria-hidden="true"
          />
          {onVercel ? "Production deploy" : "Local preview"}
        </span>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 pt-8 pb-16">
        <p className="mb-4 font-mono text-sm text-accent">Placeholder</p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
          This repo is free for new work.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-pretty text-muted">
          Standard Next.js App Router. Push to{" "}
          <code className="rounded bg-accent-dim px-1.5 py-0.5 font-mono text-[0.9em] text-accent">
            main
          </code>{" "}
          and Vercel builds this page automatically.
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
          The previous Labour–Fabian public directory was archived to{" "}
          <code className="rounded bg-accent-dim px-1.5 py-0.5 font-mono text-[0.9em] text-accent">
            archive/fabian-directory
          </code>
          .
        </p>

        <section
          aria-labelledby="deploy-facts"
          className="mt-12 overflow-hidden rounded-2xl border border-line bg-card/70 backdrop-blur-sm"
        >
          <div className="border-b border-line px-5 py-4">
            <h2 id="deploy-facts" className="text-sm font-medium tracking-tight">
              Deploy facts
            </h2>
            <p className="mt-1 text-sm text-muted">
              Values come from the Vercel build environment.
            </p>
          </div>
          <dl className="grid sm:grid-cols-2 lg:grid-cols-5">
            {facts.map((fact) => (
              <div
                key={fact.label}
                className="border-t border-line px-5 py-4 last:border-b-0 sm:odd:border-r lg:border-r lg:last:border-r-0"
              >
                <dt className="font-mono text-[11px] tracking-wider text-muted uppercase">
                  {fact.label}
                </dt>
                <dd className="mt-1 font-mono text-sm break-all">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>

      <footer className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-6 text-xs text-muted">
        <p>GitHub → Vercel · Next.js App Router</p>
        <a
          href="https://github.com/irharison/vercel-github-poc"
          className="hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          irharison/vercel-github-poc
        </a>
      </footer>
    </div>
  );
}
