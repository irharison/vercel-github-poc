import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAllowedEmail } from "@/lib/auth-domain";
import { SignInForm } from "@/components/sign-in-form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  if (isAllowedEmail(session?.user?.email)) {
    redirect("/");
  }

  const { callbackUrl, error } = await searchParams;
  const configured = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <p className="text-sm font-medium tracking-wide text-[var(--brand)]">ND Property</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">
          This appraisal app is private. Only Google accounts ending in{" "}
          <code className="rounded bg-stone-100 px-1 py-0.5 font-mono text-[0.9em] dark:bg-stone-800">
            @nataliedennis.co.uk
          </code>{" "}
          are allowed. Other Google or Gmail accounts are blocked.
        </p>
        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-100">
            {error === "AccessDenied"
              ? "That Google account is not on nataliedennis.co.uk, so access was denied."
              : "Sign-in failed. Try again with an @nataliedennis.co.uk Google account."}
          </p>
        ) : null}
        {!configured ? (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
            Google sign-in is not configured yet. Set AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, and
            AUTH_SECRET (see README).
          </p>
        ) : (
          <SignInForm callbackUrl={callbackUrl} />
        )}
      </div>
    </div>
  );
}
