import { ResourceBrowser } from "@/components/resource-browser";
import { PageFrame, PageHeading } from "@/components/site-shell";
import { getPublishedPaths } from "@/lib/published-content";

export const metadata = { title: "Free resources", description: "Browse learning paths and educational resources." };
export default async function ResourcesPage() { const paths = await getPublishedPaths(); return <PageFrame><main className="page-main"><PageHeading eyebrow="Learning library" title="Free resources" description="Search the learning library or browse by path."/><section className="content-wrap"><ResourceBrowser paths={paths} /></section></main></PageFrame>; }
