import Link from "next/link";
import { AppSwitcher } from "./app-switcher";
import { SignOutButton } from "./sign-out-button";

export function UmbrellaShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail: string;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link href="/" className="text-lg font-semibold tracking-tight text-[var(--brand)]">
            ND
          </Link>
          <AppSwitcher />
          <div className="ml-auto flex items-center gap-2">
            <span
              className="max-w-[14rem] truncate text-xs text-stone-600 dark:text-stone-300"
              title={userEmail}
            >
              {userEmail}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
