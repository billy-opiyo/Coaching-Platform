"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/security";
import { getPrisma } from "@/lib/prisma";
import { getYouTubeId, safeExternalUrl } from "@/lib/content";

export type ContentActionState = { success: boolean; message: string };
const initialError: ContentActionState = { success: false, message: "" };
const slugSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100);
const orderSchema = z.coerce.number().int().min(0).max(10000);

export async function saveLearningPath(_previous: ContentActionState, formData: FormData): Promise<ContentActionState> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, message: "You are not authorized to manage learning paths." };
  const parsed = z.object({ name: z.string().trim().min(2).max(100), slug: slugSchema, description: z.string().trim().min(10).max(500), displayOrder: orderSchema }).safeParse({ name: formData.get("name"), slug: formData.get("slug"), description: formData.get("description"), displayOrder: formData.get("displayOrder") || 0 });
  if (!parsed.success) return { ...initialError, message: "Check the path name, slug, description, and display order." };
  try {
    const db = getPrisma();
    await db.$transaction(async (tx) => {
      const created = await tx.learningPath.create({ data: parsed.data });
      await tx.adminAuditLog.create({ data: { actorId: admin.id, action: "learning_path.create", entityType: "LearningPath", entityId: created.id, summary: `Created learning path ${created.slug}` } });
      return created;
    });
    revalidatePath("/resources");
    revalidatePath("/admin/content");
    return { success: true, message: "Learning path saved as a draft." };
  } catch {
    return { success: false, message: "That slug may already be in use, or the database is unavailable." };
  }
}

export async function updateLearningPath(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Not authorized.");
  const id = String(formData.get("id") ?? "");
  const parsed = z.object({ name: z.string().trim().min(2).max(100), slug: slugSchema, description: z.string().trim().min(10).max(500), displayOrder: orderSchema }).safeParse({ name: formData.get("name"), slug: formData.get("slug"), description: formData.get("description"), displayOrder: formData.get("displayOrder") || 0 });
  if (!z.string().cuid().safeParse(id).success || !parsed.success) throw new Error("Check the learning path fields.");
  const db = getPrisma();
  const previous = await db.learningPath.findUniqueOrThrow({ where: { id }, select: { slug: true } });
  await db.$transaction(async (tx) => {
    await tx.learningPath.update({ where: { id }, data: parsed.data });
    await tx.adminAuditLog.create({ data: { actorId: admin.id, action: "learning_path.update", entityType: "LearningPath", entityId: id, summary: `Updated learning path ${parsed.data.slug}` } });
  });
  revalidatePath("/resources");
  revalidatePath(`/resources/${previous.slug}`);
  revalidatePath(`/resources/${parsed.data.slug}`);
  revalidatePath("/admin/content");
}

export async function saveLesson(_previous: ContentActionState, formData: FormData): Promise<ContentActionState> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, message: "You are not authorized to manage lessons." };
  const parsed = z.object({ pathId: z.string().cuid(), title: z.string().trim().min(3).max(160), slug: slugSchema, summary: z.string().trim().min(10).max(500), body: z.string().trim().min(30).max(30000), youtubeUrl: z.string().trim().max(300).optional(), durationMins: z.coerce.number().int().min(1).max(600).optional(), displayOrder: orderSchema }).safeParse({ pathId: formData.get("pathId"), title: formData.get("title"), slug: formData.get("slug"), summary: formData.get("summary"), body: formData.get("body"), youtubeUrl: formData.get("youtubeUrl") || undefined, durationMins: formData.get("durationMins") || undefined, displayOrder: formData.get("displayOrder") || 0 });
  if (!parsed.success) return { ...initialError, message: "Check the lesson fields and try again." };
  const youtubeUrl = parsed.data.youtubeUrl;
  if (youtubeUrl && !getYouTubeId(youtubeUrl)) return { ...initialError, message: "Enter a valid YouTube video URL, or leave the field blank." };
  try {
    const db = getPrisma();
    await db.$transaction(async (tx) => {
      const created = await tx.lesson.create({ data: { ...parsed.data, youtubeUrl: youtubeUrl || null } });
      await tx.adminAuditLog.create({ data: { actorId: admin.id, action: "lesson.create", entityType: "Lesson", entityId: created.id, summary: `Created lesson draft ${created.slug}` } });
      return created;
    });
    revalidatePath("/resources");
    revalidatePath("/admin/content");
    return { success: true, message: "Lesson saved as a draft. Review the content before publishing." };
  } catch {
    return { success: false, message: "The selected path may be unavailable, or that slug may already exist." };
  }
}

export async function updateLesson(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Not authorized.");
  const id = String(formData.get("id") ?? "");
  const parsed = z.object({ title: z.string().trim().min(3).max(160), slug: slugSchema, summary: z.string().trim().min(10).max(500), body: z.string().trim().min(30).max(30000), youtubeUrl: z.string().trim().max(300).optional(), durationMins: z.coerce.number().int().min(1).max(600).optional(), displayOrder: orderSchema }).safeParse({ title: formData.get("title"), slug: formData.get("slug"), summary: formData.get("summary"), body: formData.get("body"), youtubeUrl: formData.get("youtubeUrl") || undefined, durationMins: formData.get("durationMins") || undefined, displayOrder: formData.get("displayOrder") || 0 });
  if (!z.string().cuid().safeParse(id).success || !parsed.success) throw new Error("Check the lesson fields.");
  if (parsed.data.youtubeUrl && !getYouTubeId(parsed.data.youtubeUrl)) throw new Error("Enter a valid YouTube URL.");
  const db = getPrisma();
  const previous = await db.lesson.findUniqueOrThrow({ where: { id }, include: { path: { select: { slug: true } } } });
  const lesson = await db.$transaction(async (tx) => {
    const updated = await tx.lesson.update({ where: { id }, data: { ...parsed.data, youtubeUrl: parsed.data.youtubeUrl || null } });
    await tx.adminAuditLog.create({ data: { actorId: admin.id, action: "lesson.update", entityType: "Lesson", entityId: id, summary: `Updated lesson ${updated.slug}` } });
    return updated;
  });
  revalidatePath("/resources");
  revalidatePath(`/resources/${previous.path.slug}`);
  revalidatePath(`/resources/${lesson.pathId}`);
  revalidatePath(`/resources/${previous.path.slug}/${previous.slug}`);
  revalidatePath(`/resources/${previous.path.slug}/${lesson.slug}`);
  revalidatePath("/admin/content");
}

export async function saveExternalResource(_previous: ContentActionState, formData: FormData): Promise<ContentActionState> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, message: "You are not authorized to manage external resources." };
  const parsed = z.object({ name: z.string().trim().min(2).max(120), description: z.string().trim().min(10).max(1500), url: z.string().trim().url().max(500), category: z.string().trim().min(2).max(80), compatibility: z.string().trim().max(300).optional(), costInformation: z.string().trim().max(300).optional(), privacyNotes: z.string().trim().max(2000).optional() }).safeParse({ name: formData.get("name"), description: formData.get("description"), url: formData.get("url"), category: formData.get("category"), compatibility: formData.get("compatibility") || undefined, costInformation: formData.get("costInformation") || undefined, privacyNotes: formData.get("privacyNotes") || undefined });
  if (!parsed.success) return { ...initialError, message: "Check the external resource details and try again." };
  const safeUrl = safeExternalUrl(parsed.data.url);
  if (!safeUrl) return { ...initialError, message: "Only HTTPS resource links are allowed." };
  try {
    const db = getPrisma();
    await db.$transaction(async (tx) => {
      const created = await tx.externalResource.create({ data: { ...parsed.data, url: safeUrl.toString(), compatibility: parsed.data.compatibility?.split(",").map((item) => item.trim()).filter(Boolean) ?? [] } });
      await tx.adminAuditLog.create({ data: { actorId: admin.id, action: "external_resource.create", entityType: "ExternalResource", entityId: created.id, summary: `Created external resource draft ${created.id}` } });
      return created;
    });
    revalidatePath("/tools");
    revalidatePath("/admin/resources");
    return { success: true, message: "External resource saved as a draft. Verify its cost and privacy details before publishing." };
  } catch {
    return { success: false, message: "The external resource could not be saved." };
  }
}

export async function updateExternalResource(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Not authorized.");
  const id = String(formData.get("id") ?? "");
  const parsed = z.object({ name: z.string().trim().min(2).max(120), description: z.string().trim().min(10).max(1500), url: z.string().trim().url().max(500), category: z.string().trim().min(2).max(80), compatibility: z.string().trim().max(300).optional(), costInformation: z.string().trim().max(300).optional(), privacyNotes: z.string().trim().max(2000).optional(), displayOrder: orderSchema }).safeParse({ name: formData.get("name"), description: formData.get("description"), url: formData.get("url"), category: formData.get("category"), compatibility: formData.get("compatibility") || undefined, costInformation: formData.get("costInformation") || undefined, privacyNotes: formData.get("privacyNotes") || undefined, displayOrder: formData.get("displayOrder") || 0 });
  const safeUrl = parsed.success ? safeExternalUrl(parsed.data.url) : null;
  if (!z.string().cuid().safeParse(id).success || !parsed.success || !safeUrl) throw new Error("Check the resource details and use a valid HTTPS URL.");
  const db = getPrisma();
  await db.$transaction(async (tx) => {
    await tx.externalResource.update({ where: { id }, data: { ...parsed.data, url: safeUrl.toString(), compatibility: parsed.data.compatibility?.split(",").map((item) => item.trim()).filter(Boolean) ?? [] } });
    await tx.adminAuditLog.create({ data: { actorId: admin.id, action: "external_resource.update", entityType: "ExternalResource", entityId: id, summary: "Updated external resource" } });
  });
  revalidatePath("/tools");
  revalidatePath("/admin/resources");
}

export async function setPublicationState(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Not authorized.");
  const id = String(formData.get("id") ?? "");
  const entity = String(formData.get("entity") ?? "");
  const published = formData.get("published") === "true";
  if (!z.string().cuid().safeParse(id).success) throw new Error("Invalid record.");
  const db = getPrisma();
  let entityType: string;
  let pathSlug: string | null = null;
  if (entity === "path") {
    pathSlug = (await db.learningPath.findUniqueOrThrow({ where: { id }, select: { slug: true } })).slug;
    entityType = "LearningPath";
  } else if (entity === "lesson") {
    entityType = "Lesson";
  } else if (entity === "resource") {
    entityType = "ExternalResource";
  } else {
    throw new Error("Invalid record type.");
  }
  await db.$transaction(async (tx) => {
    if (entity === "path") await tx.learningPath.update({ where: { id }, data: { isPublished: published } });
    if (entity === "lesson") await tx.lesson.update({ where: { id }, data: { isPublished: published, publishedAt: published ? new Date() : null } });
    if (entity === "resource") await tx.externalResource.update({ where: { id }, data: { isPublished: published } });
    await tx.adminAuditLog.create({ data: { actorId: admin.id, action: published ? "content.publish" : "content.unpublish", entityType, entityId: id, summary: `${published ? "Published" : "Unpublished"} ${entityType}` } });
  });
  revalidatePath("/resources");
  if (pathSlug) revalidatePath(`/resources/${pathSlug}`);
  revalidatePath("/tools");
  revalidatePath("/admin/content");
  revalidatePath("/admin/resources");
}

