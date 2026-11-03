"use server";

import { revalidatePath } from "next/cache";
import { getPrisma } from "@/lib/prisma";
import { deletionRequestSchema, lessonProgressSchema, profileSchema } from "@/lib/member-validation";
import { requireUser } from "@/lib/security";

export type MemberFormState = { success: boolean; message: string };

export async function updateProfile(_previous: MemberFormState, formData: FormData): Promise<MemberFormState> {
  const user = await requireUser();
  if (!user) return { success: false, message: "Sign in again to update your profile." };
  const parsed = profileSchema.safeParse({ name: formData.get("name") ?? "" });
  if (!parsed.success) return { success: false, message: "Use a display name of 80 characters or fewer." };
  await getPrisma().user.update({ where: { id: user.id }, data: { name: parsed.data.name } });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  return { success: true, message: "Your profile has been updated." };
}

export async function updateLessonProgress(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!user) throw new Error("Sign in to save learning progress.");
  const parsed = lessonProgressSchema.safeParse({ lessonId: formData.get("lessonId"), completed: formData.get("completed") });
  if (!parsed.success) throw new Error("That lesson progress update is invalid.");

  const lesson = await getPrisma().lesson.findFirst({
    where: { id: parsed.data.lessonId, isPublished: true, path: { isPublished: true } },
    select: { id: true },
  });
  if (!lesson) throw new Error("That lesson is not available.");

  if (parsed.data.completed === "true") {
    await getPrisma().lessonProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
      create: { userId: user.id, lessonId: lesson.id },
      update: { completedAt: new Date() },
    });
  } else {
    await getPrisma().lessonProgress.deleteMany({ where: { userId: user.id, lessonId: lesson.id } });
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/learning");
}

export async function requestAccountDeletion(_previous: MemberFormState, formData: FormData): Promise<MemberFormState> {
  const user = await requireUser();
  if (!user) return { success: false, message: "Sign in again to submit this request." };
  const parsed = deletionRequestSchema.safeParse({ confirmation: formData.get("confirmation"), intent: formData.get("intent") });
  if (!parsed.success) return { success: false, message: "Type DELETE exactly to confirm your request." };
  await getPrisma().user.updateMany({ where: { id: user.id, deletionRequestedAt: null }, data: { deletionRequestedAt: new Date() } });
  revalidatePath("/dashboard/settings");
  return { success: true, message: "Your request has been recorded. Your account remains available until the request is reviewed; you can cancel it in settings." };
}

export async function cancelAccountDeletion(): Promise<void> {
  const user = await requireUser();
  if (!user) throw new Error("Sign in again to update this request.");
  await getPrisma().user.updateMany({ where: { id: user.id }, data: { deletionRequestedAt: null } });
  revalidatePath("/dashboard/settings");
}
