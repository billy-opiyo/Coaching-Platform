import { PageFrame, PageHeading } from "@/components/site-shell";
import { UnsubscribeForm } from "@/components/unsubscribe-form";

export const metadata = { title: "Email preferences", robots: { index: false, follow: false } };

export default function UnsubscribePage() {
  return <PageFrame><main className="page-main"><PageHeading eyebrow="Email preferences" title="Manage optional updates" description="Your guide request is separate from ongoing educational emails."/><section className="content-wrap"><UnsubscribeForm/></section></main></PageFrame>;
}
