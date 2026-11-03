import { learningPaths } from "@/lib/content";
import { getPrisma } from "@/lib/prisma";

export type PublishedLesson = { id?: string; slug: string; title: string; summary: string; durationMins: number | null; body?: string; youtubeUrl?: string | null };
export type PublishedPath = { id?: string; slug: string; name: string; description: string; lessons: PublishedLesson[]; isSample: boolean };

function samplePaths(): PublishedPath[] {
  return learningPaths.map((path) => ({
    slug: path.slug,
    name: path.name,
    description: path.description,
    isSample: true,
    lessons: path.lessons.map((lesson) => ({ slug: lesson.slug, title: lesson.title, summary: lesson.summary, durationMins: Number.parseInt(lesson.duration, 10) })),
  }));
}

export async function getPublishedPaths(): Promise<PublishedPath[]> {
  if (!process.env.DATABASE_URL) return samplePaths();
  const paths = await getPrisma().learningPath.findMany({
    where: { isPublished: true, lessons: { some: { isPublished: true } } },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    include: { lessons: { where: { isPublished: true }, orderBy: [{ displayOrder: "asc" }, { title: "asc" }] } },
  });
  return paths.map((path) => ({ ...path, isSample: false, lessons: path.lessons.map((lesson) => ({ id: lesson.id, slug: lesson.slug, title: lesson.title, summary: lesson.summary, durationMins: lesson.durationMins, body: lesson.body, youtubeUrl: lesson.youtubeUrl })) }));
}

export async function getPublishedPath(slug: string): Promise<PublishedPath | null> {
  const paths = await getPublishedPaths();
  return paths.find((path) => path.slug === slug) ?? null;
}

export async function getPublishedLesson(category: string, slug: string): Promise<{ path: PublishedPath; lesson: PublishedLesson } | null> {
  const path = await getPublishedPath(category);
  const lesson = path?.lessons.find((item) => item.slug === slug);
  return path && lesson ? { path, lesson } : null;
}

export async function getPublishedTools() {
  if (!process.env.DATABASE_URL) return [];
  return getPrisma().externalResource.findMany({ where: { isPublished: true }, orderBy: [{ displayOrder: "asc" }, { name: "asc" }] });
}
