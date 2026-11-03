import { z } from "zod";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Enter a valid calendar date.");

export const trackerEntrySchema = z.object({
  entryId: z.string().max(64).optional(),
  entryDate: dateOnly,
  mood: z.coerce.number().int().min(1).max(5),
  energy: z.coerce.number().int().min(1).max(5),
  stress: z.coerce.number().int().min(1).max(5),
  reflection: z.string().trim().max(500),
});

export function trackerDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function isFutureTrackerDate(value: string, today = new Date()): boolean {
  return trackerDate(value).getTime() > Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
}
