import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { getPrisma } from "../src/lib/prisma";

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error("Usage: npm run admin:promote -- member@example.com");
}

const db = getPrisma();
const user = await db.user.findUnique({ where: { email }, select: { id: true, email: true, role: true, disabledAt: true, emailVerified: true } });
if (!user || user.disabledAt || !user.emailVerified) {
  await db.$disconnect();
  throw new Error("An active, email-verified account with that email was not found.");
}
if (user.role === "PLATFORM_ADMIN") {
  await db.$disconnect();
  process.stdout.write("That account is already a platform administrator.\n");
  process.exit(0);
}

const terminal = createInterface({ input: stdin, output: stdout });
const answer = await terminal.question(`Promote ${user.email} to PLATFORM_ADMIN? Type PROMOTE ${user.email} to continue: `);
terminal.close();
if (answer !== `PROMOTE ${user.email}`) {
  await db.$disconnect();
  process.stdout.write("No role change made.\n");
  process.exit(0);
}

await db.$transaction(async (tx) => {
  await tx.user.update({ where: { id: user.id }, data: { role: "PLATFORM_ADMIN" } });
  await tx.adminAuditLog.create({ data: { actorId: user.id, action: "user.promote_platform_admin", entityType: "User", entityId: user.id, summary: "Promoted initial platform administrator using the controlled bootstrap command" } });
});
await db.$disconnect();
process.stdout.write("Administrator role updated. Review the audit event.\n");
