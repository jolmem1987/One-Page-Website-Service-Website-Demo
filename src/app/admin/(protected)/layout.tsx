import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getSiteConfig } from "@/lib/data";
import { AdminNav } from "@/components/admin/AdminNav";

/**
 * Protected admin shell. Every route in this group requires a valid session;
 * unauthenticated users are redirected to the login page. This is server-side
 * authorization — pages and actions each re-check as well.
 */
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  const config = await getSiteConfig();

  return (
    <div className="min-h-screen bg-muted lg:flex">
      <AdminNav businessName={config.business.name} userName={user.name} />
      <div className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</div>
      </div>
    </div>
  );
}
