import type { Metadata } from "next";

/**
 * Admin pages are ALWAYS excluded from search engines. This metadata applies to
 * every route under /admin (login, dashboard, and all sections).
 */
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
