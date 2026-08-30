import type { Person } from "@/lib/types";

export function jobLine(person: Person): string {
  const job = person.jobTitle?.trim();
  const org = person.organisation?.trim();
  if (job && org && !job.includes(org)) return `${job}, ${org}`;
  if (job) return job;
  return person.currentPosition;
}
