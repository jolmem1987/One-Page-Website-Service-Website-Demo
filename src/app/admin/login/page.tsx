import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { isDbConfigured } from "@/lib/db";
import { loginAction } from "@/lib/admin/actions";
import { SaveForm } from "@/components/admin/SaveForm";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/admin");
  const hasDb = isDbConfigured();

  return (
    <div className="grid min-h-screen place-items-center bg-muted px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-2xl font-bold text-brand-primary">Admin Login</h1>
          <p className="mt-1 text-sm text-black/60">Contractor Website Starter</p>
        </div>

        {!hasDb && (
          <div className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            No database is connected yet. Set <code>DATABASE_URL</code>, run the migrations, and create an
            admin with <code>npm run admin:create</code> to sign in.
          </div>
        )}

        <div className="card">
          <SaveForm action={loginAction} submitLabel="Sign in" className="space-y-4">
            <div>
              <label htmlFor="email" className="field-label">
                Email
              </label>
              <input id="email" name="email" type="email" required autoComplete="username" className="field-input" />
            </div>
            <div>
              <label htmlFor="password" className="field-label">
                Password
              </label>
              <input id="password" name="password" type="password" required autoComplete="current-password" className="field-input" />
            </div>
          </SaveForm>
        </div>

        <p className="mt-4 text-center text-xs text-black/50">
          There is no public sign-up. Admins are created by the site owner.
        </p>
      </div>
    </div>
  );
}
