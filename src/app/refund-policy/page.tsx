import { PageFrame, PageHeading } from "@/components/site-shell";

export const metadata = { title: "Refund policy", description: "Refund terms are pending owner approval." };
export default function RefundPage() { return <PageFrame><main className="page-main"><PageHeading eyebrow="Refunds and cancellations" title="Policy details are pending." description="No prices, paid products, or bookings are active on this site."/><section className="content-wrap"><div className="info-card" style={{maxWidth:720}}><h2>Owner review required</h2><p>Refund eligibility, cancellation windows, subscription expiry, failed payments, and booking rescheduling rules have not been decided. These terms will be published before any paid service is offered.</p></div></section></main></PageFrame>; }
