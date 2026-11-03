"use client";

import { useActionState } from "react";
import { saveExternalResource, saveLearningPath, saveLesson, type ContentActionState } from "@/app/admin/content/actions";
import type { LearningPath } from "@/generated/prisma/client";

const initial: ContentActionState = { success: false, message: "" };
function Feedback({ state }: { state: ContentActionState }) { return state.message ? <p className={state.success ? "lesson-callout" : "notice"} role="status">{state.message}</p> : null; }

export function NewLearningPathForm() {
  const [state, action, pending] = useActionState(saveLearningPath, initial);
  return <form className="form-card" action={action}><h2>New learning path</h2><label htmlFor="path-name">Name</label><input id="path-name" name="name" maxLength={100} required/><label htmlFor="path-slug">URL slug</label><input id="path-slug" name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={100} required/><label htmlFor="path-description">Description</label><textarea id="path-description" name="description" minLength={10} maxLength={500} required/><label htmlFor="path-order">Display order</label><input id="path-order" name="displayOrder" type="number" min={0} max={10000} defaultValue={0}/><Feedback state={state}/><button className="button button-dark" disabled={pending}>{pending ? "Saving…" : "Save draft path"}</button></form>;
}

export function NewLessonForm({ paths }: { paths: Pick<LearningPath, "id" | "name">[] }) {
  const [state, action, pending] = useActionState(saveLesson, initial);
  return <form className="form-card" action={action}><h2>New lesson</h2>{paths.length ? <><label htmlFor="lesson-path">Learning path</label><select id="lesson-path" name="pathId" required defaultValue=""><option value="" disabled>Choose a path</option>{paths.map((path) => <option value={path.id} key={path.id}>{path.name}</option>)}</select><label htmlFor="lesson-title">Title</label><input id="lesson-title" name="title" maxLength={160} required/><label htmlFor="lesson-slug">URL slug</label><input id="lesson-slug" name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={100} required/><label htmlFor="lesson-summary">Summary</label><textarea id="lesson-summary" name="summary" minLength={10} maxLength={500} required/><label htmlFor="lesson-body">Lesson content</label><textarea id="lesson-body" name="body" minLength={30} maxLength={30000} required/><label htmlFor="lesson-youtube">YouTube video URL <span style={{fontWeight:400,color:"#64748b"}}>(optional)</span></label><input id="lesson-youtube" name="youtubeUrl" type="url" maxLength={300}/><label htmlFor="lesson-duration">Estimated minutes <span style={{fontWeight:400,color:"#64748b"}}>(optional)</span></label><input id="lesson-duration" name="durationMins" type="number" min={1} max={600}/><label htmlFor="lesson-order">Display order</label><input id="lesson-order" name="displayOrder" type="number" min={0} max={10000} defaultValue={0}/></> : <p className="notice">Create a learning path before adding lessons.</p>}<Feedback state={state}/><button className="button button-dark" disabled={pending || paths.length === 0}>{pending ? "Saving…" : "Save lesson draft"}</button></form>;
}

export function NewExternalResourceForm() {
  const [state, action, pending] = useActionState(saveExternalResource, initial);
  return <form className="form-card" action={action}><h2>New external tool</h2><label htmlFor="resource-name">Name</label><input id="resource-name" name="name" maxLength={120} required/><label htmlFor="resource-description">Description</label><textarea id="resource-description" name="description" minLength={10} maxLength={1500} required/><label htmlFor="resource-url">HTTPS URL</label><input id="resource-url" name="url" type="url" maxLength={500} placeholder="https://" required/><label htmlFor="resource-category">Category</label><input id="resource-category" name="category" maxLength={80} required/><label htmlFor="resource-compatibility">Platform compatibility <span style={{fontWeight:400,color:"#64748b"}}>(comma-separated)</span></label><input id="resource-compatibility" name="compatibility" maxLength={300}/><label htmlFor="resource-cost">Cost information</label><input id="resource-cost" name="costInformation" maxLength={300}/><label htmlFor="resource-privacy">Privacy notes</label><textarea id="resource-privacy" name="privacyNotes" maxLength={2000}/><Feedback state={state}/><button className="button button-dark" disabled={pending}>{pending ? "Saving…" : "Save tool draft"}</button></form>;
}
