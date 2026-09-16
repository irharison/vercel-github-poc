import Link from "next/link";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const denied = error === "AccessDenied";

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <p className="text-sm font-medium tracking-wide text-[var(--brand)]">ND Property</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {denied ? "Account not allowed" : "Sign-in error"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">
          {denied
            ? "Only Google accounts whose email ends with @nataliedennis.co.uk can use this site. Gmail and other Google accounts cannot get a session."
            : "Something went wrong while signing in. Use an @nataliedennis.co.uk Google account and try again."}
        </p>
        {error && error !== "AccessDenied" ? (
          <p className="mt-3 font-mono text-xs text-stone-500">Error code: {error}</p>
        ) : null}
        <Link
          href="/signin"
          className="mt-6 inline-flex rounded-md bg-[var(--brand)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-95"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
