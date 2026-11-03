"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PublishedPath } from "@/lib/published-content";

export function ResourceBrowser({ paths }: { paths: PublishedPath[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const results = useMemo(() => paths.flatMap((path) => path.lessons.map((lesson) => ({ path, lesson })))
    .filter(({ path }) => category === "all" || path.slug === category)
    .filter(({ path, lesson }) => `${path.name} ${path.description} ${lesson.title} ${lesson.summary}`.toLowerCase().includes(query.trim().toLowerCase())), [category, query, paths]);
  return <>
    <div className="resource-toolbar" role="search">
      <label className="sr-only" htmlFor="resource-search">Search resources</label>
      <input id="resource-search" className="field resource-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search topics or lessons" />
      <label className="sr-only" htmlFor="resource-category">Filter by learning path</label>
      <select id="resource-category" className="field" value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All learning paths</option>{paths.map((path) => <option key={path.slug} value={path.slug}>{path.name}</option>)}</select>
    </div>
    <p className="result-count" aria-live="polite">{results.length} {results.length === 1 ? "resource" : "resources"}</p>
    {results.length ? <div className="resource-grid">{results.map(({ path, lesson }) => <article className="resource-card" key={`${path.slug}-${lesson.slug}`}><p className="eyebrow">{path.name} · {lesson.durationMins ? `${lesson.durationMins} min` : "Lesson"}</p><h3>{lesson.title}</h3><p>{lesson.summary}</p><Link className="card-link" href={`/resources/${path.slug}/${lesson.slug}`}>Read resource <span aria-hidden="true">→</span></Link></article>)}</div> : <div className="empty-state"><h2>{query || category !== "all" ? "No matching resources" : "No lessons published yet"}</h2><p>{query || category !== "all" ? "Try a different search or learning path." : "Check back after the content team publishes learning resources."}</p></div>}
    {paths.some((path) => path.isSample) && <p className="notice" style={{marginTop:32}}>The current lessons are sample copy for the platform foundation and require owner review before publication.</p>}
  </>;
}
