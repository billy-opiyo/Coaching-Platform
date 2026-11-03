import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { isAuthRateLimited, recordAuthAttempt } from "@/lib/security";

const credentialSchema = z.object({ email: z.email().max(254), password: z.string().min(1).max(128).refine((value) => Buffer.byteLength(value, "utf8") <= 72) });

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 4 * 60 * 60, updateAge: 30 * 60 },
  providers: [
    Credentials({
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
      async authorize(credentials) {
        const parsed = credentialSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const email = parsed.data.email.trim().toLowerCase();
        if (await isAuthRateLimited(email)) return null;
        const user = await getPrisma().user.findUnique({ where: { email } });
        if (!user || user.disabledAt || !user.emailVerified) {
          await recordAuthAttempt(email);
          return null;
        }
        if (!(await compare(parsed.data.password, user.passwordHash))) {
          await recordAuthAttempt(email);
          return null;
        }
        return { id: user.id, email: user.email, name: user.name, role: user.role, sessionVersion: user.sessionVersion };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      if (user && "role" in user) token.role = String(user.role);
      if (user && "sessionVersion" in user) token.sessionVersion = Number(user.sessionVersion);
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = typeof token.role === "string" ? token.role : "FREE_MEMBER";
        session.sessionVersion = typeof token.sessionVersion === "number" ? token.sessionVersion : 0;
      }
      return session;
    },
  },
});
