import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { BlueprintCaptureForm } from "@/components/blueprint-capture-form";
import { PageFrame, PageHeading, LoadingBlock } from "@/components/site-shell";
import { BLUEPRINT_SEQUENCE_KEY, isBlueprintCaptureAvailable } from "@/lib/blueprint-config";
import { getPrisma } from "@/lib/prisma";

export const metadata = { title: "Free 7-Day Blueprint", description: "Information about the planned free 7-Day Blueprint." };

export default function BlueprintPage() {
  return <PageFrame><main className="page-main"><Suspense fallback={<LoadingBlock label="Checking guide availability…"/>}><BlueprintRequestStatus/></Suspense></main></PageFrame>;
}

async function BlueprintRequestStatus() {
  await connection();
  const available = await isBlueprintCaptureAvailable();
  const enabledSteps = available ? await getPrisma().emailSequenceStep.count({ where: { sequenceKey: BLUEPRINT_SEQUENCE_KEY, isEnabled: true } }) : 0;
  return <><PageHeading eyebrow="A free starting point" title="The 7-Day Blueprint" description={available ? "Request the owner-approved guide and receive a private download link." : "A simple guide is planned to help you explore one manageable step at a time. The owner-approved PDF and delivery settings are not ready yet."}/><section className="content-wrap"><div className="split-content"><article className="info-card"><p className="eyebrow">Guide access</p>{available ? <><h2>Request the guide.</h2><p>The owner-approved guide is ready for private delivery. Requesting it does not sign you up for ongoing emails.</p><BlueprintCaptureForm marketingEnabled={enabledSteps === 4}/></> : <><h2>Requests are not open yet.</h2><p>The owner-approved PDF, email delivery, consent wording, retention period, and private file access must be ready before this form collects email addresses.</p><div className="placeholder-note">No email addresses are collected while guide delivery is unavailable.</div></>}<p style={{marginTop:22}}><Link className="button button-dark" href="/resources">Explore free resources <span aria-hidden="true">→</span></Link></p></article><article className="info-card"><p className="eyebrow">Email preferences</p><h2>Your choice matters.</h2><p>Asking for the guide is separate from optional consent to ongoing educational emails. Marketing email enrollment requires a separate affirmative choice and can be cancelled at any time.</p><p><Link className="text-link" href="/privacy">Read the privacy information <span aria-hidden="true">→</span></Link></p></article></div></section></>;
}
