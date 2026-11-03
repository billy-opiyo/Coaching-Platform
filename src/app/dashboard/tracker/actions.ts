"use server";

import { revalidatePath } from "next/cache";
import { getPrisma } from "@/lib/prisma";
import { requireUser } from "@/lib/security";
import { isFutureTrackerDate, trackerDate, trackerEntrySchema } from "@/lib/tracker-validation";

export type TrackerActionState = { success: boolean; message: string };

export async function saveTrackerEntry(_previous: TrackerActionState, formData: FormData): Promise<TrackerActionState> {
  const user = await requireUser();
  if (!user) return { success: false, message: "Sign in again to save your check-in." };
  const parsed = trackerEntrySchema.safeParse({
    entryId: formData.get("entryId") || undefined,
    entryDate: formData.get("entryDate"),
    mood: formData.get("mood"),
    energy: formData.get("energy"),
    stress: formData.get("stress"),
    reflection: formData.get("reflection") ?? "",
  });
  if (!parsed.success || isFutureTrackerDate(parsed.success ? parsed.data.entryDate : "2000-01-01")) {
    return { success: false, message: "Choose today or an earlier date and use a score from 1 to 5." };
  }
  const { entryId, entryDate, mood, energy, stress, reflection } = parsed.data;
  const db = getPrisma();
  try {
    if (entryId) {
      const updated = await db.trackerEntry.updateMany({
        where: { id: entryId, userId: user.id },
        data: { entryDate: trackerDate(entryDate), mood, energy, stress, reflection: reflection || null },
      });
      if (updated.count !== 1) return { success: false, message: "That check-in is unavailable." };
    } else {
      await db.trackerEntry.upsert({
        where: { userId_entryDate: { userId: user.id, entryDate: trackerDate(entryDate) } },
        create: { userId: user.id, entryDate: trackerDate(entryDate), mood, energy, stress, reflection: reflection || null },
        update: { mood, energy, stress, reflection: reflection || null },
      });
    }
  } catch {
    return { success: false, message: "A check-in already exists for that date, or it could not be saved. Review your history and try again." };
  }
  revalidatePath("/dashboard/tracker");
  revalidatePath("/dashboard");
  return { success: true, message: "Your private check-in was saved." };
}

export async function deleteTrackerEntry(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!user) throw new Error("Sign in again to delete this check-in.");
  const entryId = formData.get("entryId");
  if (typeof entryId !== "string" || entryId.length > 64) throw new Error("That check-in is unavailable.");
  await getPrisma().trackerEntry.deleteMany({ where: { id: entryId, userId: user.id } });
  revalidatePath("/dashboard/tracker");
  revalidatePath("/dashboard");
}
