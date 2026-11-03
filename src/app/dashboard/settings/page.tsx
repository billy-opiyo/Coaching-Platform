import { CancelDeletionForm, ProfileForm, DeletionRequestForm } from "@/components/member-forms";
import { Suspense } from "react";
import { LoadingBlock } from "@/components/site-shell";
import { requireUser } from "@/lib/security";

export default function MemberSettingsPage() {
  return <Suspense fallback={<LoadingBlock label="Loading your account settings…"/>}><MemberSettingsContent/></Suspense>;
}

async function MemberSettingsContent() {
  const user = await requireUser();
  if (!user) return null;
  return <>
    <section className="page-heading member-heading"><p className="eyebrow">Account settings</p><h1>Your account, your choices.</h1><p className="lead">Review and update the minimum profile information used in your learning space.</p></section>
    <section className="content-wrap member-settings-grid">
      <div><h2>Profile</h2><p className="member-settings-copy">Your email is used to sign in and is not shown to other members.</p><ProfileForm name={user.name ?? ""}/></div>
      <div><h2>Account deletion</h2><p className="member-settings-copy">Submitting a request records your choice for review. The account remains available until it is processed. You can cancel the request here.</p>{user.deletionRequestedAt ? <div className="notice"><p>A deletion request is pending since {user.deletionRequestedAt.toLocaleDateString()}.</p><CancelDeletionForm/></div> : <DeletionRequestForm/>}</div>
    </section>
  </>;
}
