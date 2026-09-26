import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UmbrellaShell } from "@/components/umbrella-shell";
import { isAuthDevBypass } from "@/lib/auth-dev";
import { isAllowedEmail } from "@/lib/auth-domain";

export default async function UmbrellaLayout({ children }: { children: ReactNode }) {
  if (isAuthDevBypass()) {
    return <UmbrellaShell userEmail="Local dev">{children}</UmbrellaShell>;
  }

  const session = await auth();
  const email = session?.user?.email;
  if (!isAllowedEmail(email)) {
    redirect("/signin");
  }

  return <UmbrellaShell userEmail={email!}>{children}</UmbrellaShell>;
}
