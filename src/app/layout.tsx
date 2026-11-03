import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Coaching Platform | Practical learning, at your pace", template: "%s | Coaching Platform" },
  description: "Explore practical educational resources and supportive next steps at your own pace.",
  robots: { index: process.env.NEXT_PUBLIC_INDEXING_ENABLED === "true" && Boolean(process.env.NEXT_PUBLIC_SITE_URL), follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
