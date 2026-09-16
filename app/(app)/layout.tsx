import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { isAllowedEmail } from "@/lib/auth-domain";

export default async function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  const email = session?.user?.email;
  if (!isAllowedEmail(email)) {
    redirect("/signin");
  }

  return <AppShell userEmail={email!}>{children}</AppShell>;
}
