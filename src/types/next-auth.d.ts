import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User { role?: string; sessionVersion?: number }
  interface Session { sessionVersion: number; user: { id: string; role: string } & DefaultSession["user"] }
}

declare module "next-auth/jwt" {
  interface JWT { role?: string; sessionVersion?: number }
}
