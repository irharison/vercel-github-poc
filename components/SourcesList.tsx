import { formatDate } from "@/lib/people";
import type { Source } from "@/lib/types";

export function SourcesList({ sources }: { sources: Source[] }) {
  return (
    <ol className="space-y-3 text-sm leading-6">
      {sources.map((source, index) => (
        <li key={`${source.url}-${index}`} className="flex gap-3">
          <span className="w-6 shrink-0 text-muted">{index + 1}.</span>
          <span>
            <a
              className="text-accent underline-offset-2 hover:underline"
              href={source.url}
              rel="noreferrer"
            >
              {source.label}
            </a>
            <span className="text-muted">
              {" "}
              — accessed {formatDate(source.accessed)}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
