import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import {
  ALLOWED_EMAIL_DOMAIN,
  canCreateSession,
  isAllowedEmail,
} from "@/lib/auth-domain";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    Google({
      authorization: {
        params: {
          // Hint only — Google may still offer other accounts. Hard-checked below.
          hd: ALLOWED_EMAIL_DOMAIN,
          prompt: "select_account",
        },
      },
    }),
  ],
  pages: {
    signIn: "/signin",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user, profile, account }) {
      if (account?.provider !== "google") return false;
      const email = user.email ?? profile?.email;
      const emailVerified =
        typeof profile?.email_verified === "boolean"
          ? profile.email_verified
          : undefined;
      return canCreateSession({ email, emailVerified });
    },
    async jwt({ token, user, profile }) {
      const email = user?.email ?? profile?.email ?? token.email;
      if (!isAllowedEmail(typeof email === "string" ? email : null)) {
        delete token.email;
        return token;
      }
      token.email = String(email).toLowerCase();
      return token;
    },
    async session({ session, token }) {
      if (!isAllowedEmail(typeof token.email === "string" ? token.email : null)) {
        return { ...session, user: { ...session.user, email: undefined } };
      }
      if (session.user) {
        session.user.email = String(token.email);
      }
      return session;
    },
  },
});
