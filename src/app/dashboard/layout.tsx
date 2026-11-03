import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoadingBlock } from "@/components/site-shell";
import { requireUser } from "@/lib/security";

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <Suspense fallback={<LoadingBlock label="Loading your private member space…"/>}><MemberShell>{children}</MemberShell></Suspense>;
}

async function MemberShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  if (!user) redirect("/login?callbackUrl=%2Fdashboard");
  return <main className="page-main"><header className="member-header"><div><p className="eyebrow">Member space</p><p className="member-greeting">{user.name ? `Hello, ${user.name}` : "Your learning space"}</p></div><nav aria-label="Member navigation"><Link href="/dashboard">Dashboard</Link><Link href="/dashboard/learning">Learning</Link><Link href="/dashboard/protocol">Pause exercise</Link><Link href="/dashboard/tracker">Tracker</Link><Link href="/dashboard/squads">Squads</Link><Link href="/dashboard/settings">Settings</Link></nav></header>{children}</main>;
}
