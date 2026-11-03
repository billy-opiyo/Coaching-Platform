import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "pg";

type PrismaGlobal = typeof globalThis & { coachingPrisma?: PrismaClient; coachingPool?: Pool };

export function getPrisma(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("Database is not configured. Set DATABASE_URL in the server environment.");
  const globalForPrisma = globalThis as PrismaGlobal;
  if (!globalForPrisma.coachingPrisma) {
    const pool = new Pool({ connectionString: databaseUrl, max: 5, idleTimeoutMillis: 30_000 });
    globalForPrisma.coachingPool = pool;
    globalForPrisma.coachingPrisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  }
  return globalForPrisma.coachingPrisma;
}
