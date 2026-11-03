import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LoadingBlock } from "@/components/site-shell";
import { EmailStepForm } from "@/components/email-step-form";
import { setEmailAutomationPaused } from "@/app/admin/email/actions";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security";

export const metadata = { title: "Email automation", robots: { index: false, follow: false } };

export default function AdminEmailPage() {
  return <main className="page-main"><header className="admin-header"><Link className="wordmark" href="/admin"><span className="wordmark-mark" aria-hidden="true">C</span>Administration</Link><nav aria-label="Administration"><Link href="/admin/content">Learning content</Link><Link href="/admin/resources">External tools</Link><Link href="/admin/email" aria-current="page">Email</Link></nav></header><Suspense fallback={<LoadingBlock label="Loading email settings…"/>}><EmailSettings/></Suspense></main>;
}

async function EmailSettings() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");
  const db = getPrisma();
  const [steps, control, activeEnrollments, failedJobs] = await Promise.all([
    db.emailSequenceStep.findMany({ where: { sequenceKey: "blueprint-onboarding" }, orderBy: { stepNumber: "asc" } }),
    db.emailAutomationControl.findUnique({ where: { id: "default" }, select: { paused: true } }),
    db.emailSequenceEnrollment.count({ where: { sequenceKey: "blueprint-onboarding", status: "ACTIVE" } }),
    db.emailJob.count({ where: { status: "FAILED" } }),
  ]);
  const paused = control?.paused ?? true;
  return <section className="content-wrap"><p className="eyebrow">Administration</p><h1 className="admin-title">Email sequence</h1><p className="admin-lead">Edit the optional four-email onboarding sequence. Guide delivery is transactional and remains separate. Sequence enrollment requires recorded consent.</p><div className="admin-metrics"><article><span>Automation</span><strong>{paused ? "Paused" : "Running"}</strong></article><article><span>Active enrollments</span><strong>{activeEnrollments}</strong></article><article><span>Failed jobs</span><strong>{failedJobs}</strong></article></div><form action={setEmailAutomationPaused}><input type="hidden" name="paused" value={String(!paused)}/><button className="button button-dark">{paused ? "Resume email automation" : "Pause email automation"}</button></form><div className="admin-records email-steps">{steps.map((step) => <section className="admin-record" key={step.id}><div className="admin-record-heading"><div><p className="eyebrow">{step.delayDays} days after signup consent</p><h2>{step.subject}</h2></div><span className="status-badge">{step.isEnabled ? "Enabled" : "Draft / disabled"}</span></div><EmailStepForm step={step}/></section>)}{steps.length !== 4 && <div className="notice">The four onboarding email records are incomplete. Marketing enrollment stays unavailable until all four steps exist and are approved.</div>}</div></section>;
}
