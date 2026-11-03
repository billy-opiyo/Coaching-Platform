import { z } from "zod";

export const blueprintRequestSchema = z.object({
  email: z.email().trim().toLowerCase().max(254),
  marketingConsent: z.enum(["yes", "no"]),
});

export const emailStepSchema = z.object({
  id: z.string().min(1).max(64),
  subject: z.string().trim().min(3).max(180),
  bodyText: z.string().trim().min(30).max(10000),
  delayDays: z.coerce.number().int().min(0).max(30),
  isEnabled: z.enum(["true", "false"]),
});
