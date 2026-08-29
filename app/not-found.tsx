import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-20 sm:px-8">
      <h1 className="font-serif text-4xl text-ink">Page not found</h1>
      <p className="mt-4 text-muted">
        That address is not in this register.
      </p>
      <p className="mt-6">
        <Link className="text-accent underline-offset-2 hover:underline" href="/directory">
          Return to the directory
        </Link>
      </p>
    </main>
  );
}
