"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeApp, apps } from "@/lib/apps";

export function AppSwitcher() {
  const pathname = usePathname();
  const current = activeApp(pathname);

  return (
    <nav aria-label="Apps" className="flex flex-wrap gap-1">
      {apps.map((app) => {
        const on = current?.id === app.id;
        return (
          <Link
            key={app.id}
            href={app.href}
            aria-current={on ? "page" : undefined}
            className={`rounded-md px-3 py-1.5 text-sm ${on ? "bg-[var(--brand)] text-white" : "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"}`}
          >
            {app.name}
          </Link>
        );
      })}
    </nav>
  );
}
