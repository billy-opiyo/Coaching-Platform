import { z } from "zod";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value && parsed.getUTCDay() === 1;
}, "Choose a valid Monday in UTC.");

export const squadSchema = z.object({
  id: z.string().max(64).optional(),
  name: z.string().trim().min(3).max(100),
  description: z.string().trim().min(30).max(1000),
  capacity: z.coerce.number().int().min(2).max(100),
  status: z.enum(["DRAFT", "OPEN", "CLOSED"]),
});

export const squadIdSchema = z.string().min(1).max(64);

export const squadCheckInSchema = z.object({
  membershipId: squadIdSchema,
  weekStart: dateOnly,
  focus: z.string().trim().min(3).max(400),
  reflection: z.string().trim().min(3).max(400),
});

export const squadReportSchema = z.object({
  membershipId: squadIdSchema,
  category: z.enum(["SAFETY", "CONDUCT", "OTHER"]),
  details: z.string().trim().min(20).max(1000),
});

export const squadReportReviewSchema = z.object({
  reportId: squadIdSchema,
  status: z.enum(["REVIEWED", "CLOSED"]),
});

export function currentSquadWeekStart(now = new Date()): Date {
  const day = now.getUTCDay();
  const daysFromMonday = (day + 6) % 7;
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysFromMonday));
}
