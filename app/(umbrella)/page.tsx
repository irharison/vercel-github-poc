import Link from "next/link";
import { apps } from "@/lib/apps";

export default function LauncherPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Apps</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600 dark:text-stone-300">
        One Google sign-in covers every app. Open one here, or switch from the header.
      </p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {apps.map((app) => (
          <li key={app.id}>
            <Link
              href={app.href}
              className="block h-full rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-[var(--brand)] dark:border-stone-800 dark:bg-stone-900"
            >
              <h2 className="text-lg font-semibold tracking-tight">{app.name}</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">{app.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
