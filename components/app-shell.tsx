"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DealProvider } from "./deal-provider";
import { SignOutButton } from "./sign-out-button";

const links = [
  { href: "/", label: "Deal" },
  { href: "/research", label: "Research" },
  { href: "/cache", label: "Cache" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail: string;
}) {
  const pathname = usePathname();
  return (
    <DealProvider>
      <header className="border-b border-stone-200 bg-white/90 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <div className="text-lg font-semibold tracking-tight">ND Property</div>
            <div className="text-xs text-stone-500">Deal appraisal for limited-company BTL and development</div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <nav className="flex gap-1">
              {links.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-md px-3 py-1.5 text-sm ${active ? "bg-[var(--brand)] text-white" : "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"}`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <div className="flex items-center gap-2 border-l border-stone-200 pl-3 dark:border-stone-700">
              <span className="max-w-[14rem] truncate text-xs text-stone-600 dark:text-stone-300" title={userEmail}>
                {userEmail}
              </span>
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </DealProvider>
  );
}
