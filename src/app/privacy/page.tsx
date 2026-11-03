import { Suspense } from "react";
import { connection } from "next/server";
import { LoadingBlock, PageFrame, PageHeading } from "@/components/site-shell";
import { isBlueprintCaptureAvailable, getBlueprintRetentionDays } from "@/lib/blueprint-config";
import { isSignupAvailable } from "@/lib/auth-config";

export const metadata = { title: "Privacy", description: "Privacy information and outstanding policy decisions." };

export default function PrivacyPage() {
  return <PageFrame><main className="page-main"><PageHeading eyebrow="Privacy" title="Privacy information" description="This draft describes the current configuration. It is not a reviewed privacy notice or a claim of legal compliance."/><Suspense fallback={<LoadingBlock label="Checking current privacy settings…"/>}><PrivacyStatus/></Suspense></main></PageFrame>;
}

async function PrivacyStatus() {
  await connection();
  const [guideOpen, signupOpen] = await Promise.all([isBlueprintCaptureAvailable(), Promise.resolve(isSignupAvailable())]);
  const retentionDays = guideOpen ? getBlueprintRetentionDays() : null;
  return <article className="content-wrap lesson-content">
    <p className="notice">{guideOpen || signupOpen ? "Some account or guide-request features are enabled in this deployment. Do not submit sensitive health or behaviour details." : "Account registration and guide requests are disabled in this deployment. No email address is collected through those features."}</p>
    <h2>Data collection</h2>
    {guideOpen ? <p>If you request the guide, the platform stores your email address, request time, delivery status, and private download-token hash so it can send and protect the guide. The record is scheduled for deletion after {retentionDays} days, unless an active consented email sequence is still running. Optional marketing emails are enrolled only when you select the separate checkbox. Each consent or unsubscribe is recorded with its wording version.</p> : <p>Guide requests are closed until the owner-approved PDF, email sender, private file path, webhook and scheduler secrets, consent wording, and retention period are configured. No email is collected by the Blueprint page while it is closed.</p>}
    {signupOpen ? <p>Account registration is enabled. Account records include email, optional display name, password hash, email-verification state, role, and security/session state. Passwords are not stored in plain text.</p> : <p>Account registration is not open. It requires explicit owner approval of account policies as well as database, session, and email configuration.</p>}
    <p>Basic technical data may be processed by the hosting provider if the application is deployed. Hosting and analytics configuration have not yet been selected or verified.</p>
    <h2>Member reflections</h2><p>Signed-in members can choose to store one private daily check-in with mood, energy, and stress scores from 1 to 5 and an optional note of up to 500 characters. These entries are visible to that member and can be edited or deleted in the tracker. A two-minute text exercise runs in the browser and does not save protocol use. A separate retention period for tracker entries is awaiting owner approval; do not enter details you would not want stored.</p>
    <h2>Other future member features</h2><p>Payments, accountability groups, and coaching bookings are not active. A guide request is separate from optional marketing consent. Email consent can be withdrawn at any time through the unsubscribe link.</p>
    <h2>Children, sensitive information, and professional care</h2><p>The intended audience and age requirements have not been confirmed. Do not submit health or other sensitive details through this site. Educational content is not a substitute for qualified professional care.</p>
    <h2>Contact and legal review</h2><p>A privacy contact and reviewed notice are pending. The business owner should obtain appropriate legal review, including assessment of the data-protection rules applicable to the audience and operating countries.</p>
  </article>;
}
