"use client";

import { useActionState } from "react";
import { saveTrackerEntry, type TrackerActionState } from "@/app/dashboard/tracker/actions";

const initialState: TrackerActionState = { success: false, message: "" };

export function TrackerEntryForm({ entry, today }: {
  entry?: { id: string; entryDate: string; mood: number; energy: number; stress: number; reflection: string | null };
  today: string;
}) {
  const [state, action, pending] = useActionState(saveTrackerEntry, initialState);
  return <form className="form-card tracker-form" action={action}>
    <p className="eyebrow">Private daily check-in</p>
    <h2>{entry ? "Edit your check-in" : "How has today felt?"}</h2>
    <p className="tracker-scale-note">Choose a number from 1 (low) to 5 (high) as a personal reflection. This is not a diagnosis or assessment.</p>
    {entry && <input type="hidden" name="entryId" value={entry.id}/>}
    <label htmlFor="tracker-date">Date</label><input id="tracker-date" name="entryDate" type="date" max={today} defaultValue={entry?.entryDate ?? today} required/>
    <label htmlFor="tracker-mood">Mood</label><select id="tracker-mood" name="mood" defaultValue={entry?.mood ?? 3}>{[1,2,3,4,5].map((value) => <option key={value} value={value}>{value} — {value === 1 ? "Low" : value === 5 ? "High" : "Middle"}</option>)}</select>
    <label htmlFor="tracker-energy">Energy</label><select id="tracker-energy" name="energy" defaultValue={entry?.energy ?? 3}>{[1,2,3,4,5].map((value) => <option key={value} value={value}>{value} — {value === 1 ? "Low" : value === 5 ? "High" : "Middle"}</option>)}</select>
    <label htmlFor="tracker-stress">Stress, as you experienced it</label><select id="tracker-stress" name="stress" defaultValue={entry?.stress ?? 3}>{[1,2,3,4,5].map((value) => <option key={value} value={value}>{value} — {value === 1 ? "Low" : value === 5 ? "High" : "Middle"}</option>)}</select>
    <label htmlFor="tracker-reflection">Optional note (up to 500 characters)</label><textarea id="tracker-reflection" name="reflection" maxLength={500} rows={4} defaultValue={entry?.reflection ?? ""}/>
    <p className="member-field-help">Only you can view this entry. You can edit or delete it later.</p>
    {state.message && <p className={state.success ? "lesson-callout" : "notice"} role="status">{state.message}</p>}
    <button className="button button-dark" disabled={pending}>{pending ? "Saving…" : entry ? "Save changes" : "Save check-in"}</button>
  </form>;
}
