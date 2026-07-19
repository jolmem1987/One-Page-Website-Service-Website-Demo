import { redirect } from "next/navigation";
import { getSessionUser, isOpenAdminDemo } from "@/lib/auth";
import { getSiteConfig } from "@/lib/data";
import { AdminNav } from "@/components/admin/AdminNav";

/**
 * Protected admin shell. In normal operation every route in this group requires
 * a valid session; unauthenticated users are redirected to the login page. This
 * is server-side authorization — pages and actions each re-check as well.
 *
 * On a demo deployment (DEMO_OPEN_ADMIN="true") the panel is open to every
 * visitor for viewing, edits are disabled, and the banner below explains that a
 * real customer site is private and fully editable by the owner only.
 */
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const demo = isOpenAdminDemo();
  // Require login to view — unless this is a demo deployment, where visitors may
  // browse the panel without an account (edits are still blocked for them).
  if (!user && !demo) redirect("/admin/login");
  const config = await getSiteConfig();
  const isDemoVisitor = demo && !user;

  return (
    <div className="min-h-screen bg-muted lg:flex">
      <AdminNav businessName={config.business.name} userName={user?.name ?? "Demo Visitor"} />
      <div className="flex-1">
        {isDemoVisitor && (
          <div className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:px-6 lg:px-10">
            <p className="mx-auto max-w-5xl">
              <span className="font-semibold">Demonstration admin panel — viewing only.</span>{" "}
              This is a live preview of the control panel that comes with your website. Editing is
              turned off for visitors so the demo stays clean. On <span className="font-semibold">your</span> real
              site, this panel is private — you would be the only person with access, with full control to
              update your business details, content, gallery, leads, and SEO whenever you like.
            </p>
          </div>
        )}
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</div>
      </div>
    </div>
  );
}
