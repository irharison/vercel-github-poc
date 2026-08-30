import Link from "next/link";
import { formatDate, site } from "@/lib/people";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-card">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-8 text-sm text-muted sm:flex-row sm:items-start sm:justify-between sm:px-8">
        <div className="max-w-xl space-y-2">
          <p>
            Last updated {formatDate(site.lastUpdated)}. This is an unofficial
            compilation of public records. It is not a Fabian Society or Labour
            Party publication.
          </p>
          <p>
            Primary sources include{" "}
            <a
              className="underline underline-offset-2 hover:text-ink"
              href="https://fabians.org.uk/"
            >
              fabians.org.uk
            </a>
            , UK Parliament registers, GOV.UK ministerial lists, Holyrood
            biographies, and the Electoral Commission.
          </p>
        </div>
        <ul className="flex flex-col gap-2 sm:items-end">
          <li>
            <Link className="hover:text-ink" href="/references">
              References and further reading
            </Link>
          </li>
          <li>
            <Link className="hover:text-ink" href="/about">
              Methodology and limitations
            </Link>
          </li>
          <li>
            <Link className="hover:text-ink" href="/directory">
              Browse the directory
            </Link>
          </li>
          <li>
            <a className="hover:text-ink" href={site.repoUrl}>
              Source code on GitHub
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
