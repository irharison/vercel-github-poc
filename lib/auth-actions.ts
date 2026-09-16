"use server";

import { signIn, signOut } from "@/auth";
import { safeCallbackUrl } from "@/lib/auth-domain";

export async function signInWithGoogle(callbackUrl?: string) {
  await signIn("google", { redirectTo: safeCallbackUrl(callbackUrl) });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/signin" });
}
