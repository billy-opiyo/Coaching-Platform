import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().trim().max(80).optional().transform((value) => value || null),
});

export const lessonProgressSchema = z.object({
  lessonId: z.string().min(1).max(64),
  completed: z.enum(["true", "false"]),
});

export const deletionRequestSchema = z.object({
  confirmation: z.literal("DELETE"),
  intent: z.enum(["request", "cancel"]),
});
