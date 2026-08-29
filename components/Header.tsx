import Link from "next/link";

const links = [
  { href: "/directory", label: "Directory" },
  { href: "/about", label: "Methodology" },
];

export function Header() {
  return (
    <header className="border-b border-line bg-card/80">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-5 py-4 sm:px-8">
        <Link href="/" className="min-w-0">
          <p className="text-[0.7rem] tracking-[0.18em] text-muted uppercase">
            Public register
          </p>
          <p className="font-serif text-lg leading-tight text-ink">
            Labour–Fabian records
          </p>
        </Link>
        <nav aria-label="Primary">
          <ul className="flex items-center gap-5 text-sm">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-muted underline-offset-4 hover:text-ink hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
