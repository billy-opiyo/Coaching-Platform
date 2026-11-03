import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { connection } from "next/server";
import { getPrisma } from "@/lib/prisma";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const BLUEPRINT_WINDOW_MS = 60 * 60 * 1000;
const BLUEPRINT_MAX_ATTEMPTS = 5;

function digest(value: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Authentication is not configured.");
  return createHash("sha256").update(`${secret}:${value}`).digest("hex");
}

async function authBuckets(email: string): Promise<string[]> {
  const requestHeaders = await headers();
  const address = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return [`auth:ip:${digest(address)}`, `auth:email:${digest(email.toLowerCase())}`];
}

export async function isAuthRateLimited(email: string): Promise<boolean> {
  const buckets = await authBuckets(email);
  const db = getPrisma();
  const cutoff = new Date(Date.now() - WINDOW_MS);
  const counts = await Promise.all(buckets.map((bucket) => db.securityEvent.count({ where: { bucket, createdAt: { gte: cutoff } } })));
  return counts.some((count) => count >= MAX_ATTEMPTS);
}

export async function recordAuthAttempt(email: string): Promise<void> {
  const buckets = await authBuckets(email);
  await getPrisma().securityEvent.createMany({ data: buckets.map((bucket) => ({ bucket })) });
}

export async function enforceAuthRateLimit(email: string): Promise<boolean> {
  if (await isAuthRateLimited(email)) return false;
  await recordAuthAttempt(email);
  return true;
}

export async function enforceBlueprintRateLimit(email: string): Promise<boolean> {
  const requestHeaders = await headers();
  const address = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const buckets = [`blueprint:ip:${digest(address)}`, `blueprint:email:${digest(email.toLowerCase())}`];
  const db = getPrisma();
  const cutoff = new Date(Date.now() - BLUEPRINT_WINDOW_MS);
  const counts = await Promise.all(buckets.map((bucket) => db.securityEvent.count({ where: { bucket, createdAt: { gte: cutoff } } })));
  if (counts.some((count) => count >= BLUEPRINT_MAX_ATTEMPTS)) return false;
  await db.securityEvent.createMany({ data: buckets.map((bucket) => ({ bucket })) });
  return true;
}

export async function requireUser() {
  await connection();
  const { auth } = await import("@/auth");
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  const user = await getPrisma().user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, role: true, disabledAt: true, deletionRequestedAt: true, emailVerified: true, sessionVersion: true } });
  if (!user || user.disabledAt || user.sessionVersion !== Number(session.sessionVersion)) return null;
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!user || user.disabledAt || (user.role !== "CONTENT_ADMIN" && user.role !== "PLATFORM_ADMIN")) return null;
  return user;
}

export async function requirePlatformAdmin() {
  const user = await requireUser();
  if (!user || user.role !== "PLATFORM_ADMIN") return null;
  return user;
}
