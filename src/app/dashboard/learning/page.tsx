import { updateLessonProgress } from "@/app/dashboard/actions";
import { Suspense } from "react";
import { LoadingBlock } from "@/components/site-shell";
import { getPrisma } from "@/lib/prisma";
import { getPublishedPaths } from "@/lib/published-content";
import { requireUser } from "@/lib/security";

export default function MemberLearningPage() {
  return <Suspense fallback={<LoadingBlock label="Loading your learning progress…"/>}><MemberLearningContent/></Suspense>;
}

async function MemberLearningContent() {
  const user = await requireUser();
  if (!user) return null;
  const [paths, progress] = await Promise.all([
    getPublishedPaths(),
    getPrisma().lessonProgress.findMany({ where: { userId: user.id }, select: { lessonId: true } }),
  ]);
  const completed = new Set(progress.map((item) => item.lessonId));
  const records = paths.flatMap((path) => path.lessons.map((lesson) => ({ path, lesson })));
  return <>
    <section className="page-heading member-heading"><p className="eyebrow">Your learning</p><h1>Continue at your pace.</h1><p className="lead">Mark a lesson complete when it feels useful. Your history is private and can be changed at any time.</p></section>
    <section className="content-wrap member-learning-list">
      {paths.length === 0 ? <div className="empty-state"><p>No published learning paths are available yet. Check back later.</p></div> : paths.map((path) => <section key={path.slug} className="member-path"><div><p className="eyebrow">Learning path</p><h2>{path.name}</h2><p>{path.description}</p></div><div className="member-lesson-list">{path.lessons.map((lesson) => {
        const lessonId = lesson.id;
        const isComplete = lessonId ? completed.has(lessonId) : false;
        return <article key={`${path.slug}/${lesson.slug}`} className="member-lesson"><div><h3>{lesson.title}</h3><p>{lesson.summary}</p></div>{lessonId ? <form action={updateLessonProgress}><input type="hidden" name="lessonId" value={lessonId}/><input type="hidden" name="completed" value={isComplete ? "false" : "true"}/><button className="button button-small" type="submit">{isComplete ? "Mark incomplete" : "Mark complete"}</button></form> : <span className="status-badge">Sample content</span>}</article>;
      })}</div></section>)}
      <p className="member-progress-total">{completed.size} of {records.length} available lessons complete</p>
    </section>
  </>;
}
