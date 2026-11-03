import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoadingBlock } from "@/components/site-shell";
import { NewExternalResourceForm } from "@/components/admin-content-forms";
import { requireAdmin } from "@/lib/security";
import { getPrisma } from "@/lib/prisma";
import { setPublicationState, updateExternalResource } from "@/app/admin/content/actions";

export const metadata = { title: "Manage external resources", robots: { index: false, follow: false } };

export default function AdminResourcesPage() {
  return <main className="page-main"><header className="admin-header"><Link className="wordmark" href="/admin"><span className="wordmark-mark">C</span>Administration</Link><nav aria-label="Administration"><Link href="/admin/content">Learning content</Link><Link href="/admin/resources" aria-current="page">External tools</Link></nav></header><Suspense fallback={<section className="content-wrap"><LoadingBlock label="Loading external tools…"/></section>}><ExternalResourcesEditor/></Suspense></main>;
}

async function ExternalResourcesEditor() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");
  const resources = await getPrisma().externalResource.findMany({ orderBy: [{ displayOrder: "asc" }, { name: "asc" }] });
  return <section className="content-wrap"><p className="eyebrow">Content management</p><h1 className="admin-title">External tools directory</h1><p className="admin-lead">Verify each provider, link, cost, and privacy note before publishing it.</p><div className="admin-editor-grid"><NewExternalResourceForm/><div className="admin-records">{resources.length ? resources.map((resource) => <article className="admin-record" key={resource.id}><div className="admin-record-heading"><div><p className="eyebrow">{resource.category}</p><h2>{resource.name}</h2><p>{resource.isPublished ? "Published" : "Draft"}</p></div><form action={setPublicationState}><input type="hidden" name="id" value={resource.id}/><input type="hidden" name="entity" value="resource"/><input type="hidden" name="published" value={String(!resource.isPublished)}/><button className="button button-small" type="submit">{resource.isPublished ? "Unpublish" : "Publish"}</button></form></div><form className="admin-edit-form" action={updateExternalResource}><input type="hidden" name="id" value={resource.id}/><label>Name<input name="name" defaultValue={resource.name} maxLength={120} required/></label><label>Category<input name="category" defaultValue={resource.category} maxLength={80} required/></label><label className="form-span">Description<textarea name="description" defaultValue={resource.description} minLength={10} maxLength={1500} required/></label><label className="form-span">HTTPS URL<input name="url" type="url" defaultValue={resource.url} maxLength={500} required/></label><label>Compatibility<input name="compatibility" defaultValue={resource.compatibility.join(", ")} maxLength={300}/></label><label>Cost information<input name="costInformation" defaultValue={resource.costInformation ?? ""} maxLength={300}/></label><label className="form-span">Privacy notes<textarea name="privacyNotes" defaultValue={resource.privacyNotes ?? ""} maxLength={2000}/></label><label>Display order<input name="displayOrder" type="number" min={0} max={10000} defaultValue={resource.displayOrder}/></label><button className="button button-small button-dark">Save changes</button></form></article>) : <div className="empty-state"><h2>No external tools yet</h2><p>New entries are drafts and remain private until published.</p></div>}</div></div></section>;
}
