import Link from "next/link";
import { getSiteConfig, getSettingsMeta } from "@/lib/data";
import { isDbConfigured } from "@/lib/db";
import { getEmailStatus } from "@/lib/email";
import { getStorageStatus } from "@/lib/storage";
import { leadStats } from "@/lib/admin/store";
import { runSeoChecks, computeScore } from "@/lib/seo/checks";
import { PageHeader, Card, Notice, ScoreDial } from "@/components/admin/ui";

export default async function AdminDashboard() {
  const config = await getSiteConfig();
  const meta = await getSettingsMeta();
  const hasDb = isDbConfigured();
  const email = getEmailStatus();
  const storage = getStorageStatus();
  const seo = computeScore(runSeoChecks(config));

  let stats: { status: string; count: number }[] = [];
  if (hasDb) {
    try {
      stats = await leadStats();
    } catch {
      stats = [];
    }
  }
  const totalLeads = stats.reduce((s, r) => s + r.count, 0);
  const newLeads = stats.find((s) => s.status === "NEW")?.count ?? 0;
  const won = stats.find((s) => s.status === "WON")?.count ?? 0;

  return (
    <>
      <PageHeader title="Dashboard" description={`Welcome back. Here's an overview of ${config.business.name}.`} />

      {!hasDb && (
        <div className="mb-6">
          <Notice tone="warn">
            No database is connected. You&apos;re viewing demo content. Set <code>DATABASE_URL</code>, run{" "}
            <code>npm run db:migrate</code> and <code>npm run db:seed</code> to start saving real data.
          </Notice>
        </div>
      )}

      {hasDb && !meta.onboardingComplete && (
        <div className="mb-6">
          <Notice tone="info">
            Finish setting up this site with the{" "}
            <Link href="/admin/onboarding" className="font-semibold underline">
              Setup Wizard
            </Link>{" "}
            — it turns the demo into your business without touching code.
          </Notice>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total leads" value={totalLeads} href="/admin/leads" />
        <Stat label="New leads" value={newLeads} href="/admin/leads?status=NEW" highlight={newLeads > 0} />
        <Stat label="Won" value={won} href="/admin/leads?status=WON" />
        <Card>
          <div className="flex items-center gap-3">
            <ScoreDial score={seo.score} />
            <div>
              <p className="text-sm font-medium">SEO readiness</p>
              <Link href="/admin/seo" className="text-xs text-brand-accent hover:underline">
                Open SEO Center →
              </Link>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Quick actions</h2>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
            {[
              ["/admin/leads", "View leads"],
              ["/admin/content", "Edit content"],
              ["/admin/gallery", "Manage gallery"],
              ["/admin/seo", "Improve SEO"],
              ["/admin/settings", "Business settings"],
              ["/admin/onboarding", "Setup wizard"],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="rounded border border-black/10 px-3 py-2 hover:bg-muted">
                {label}
              </Link>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="font-semibold">System status</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <StatusRow label="Database" ok={hasDb} okText="Connected" offText="Not connected" />
            <StatusRow label="Email sending" ok={email.configured} okText={`Enabled (${email.provider})`} offText="Disabled — drafts only" />
            <StatusRow label="Image uploads" ok={storage.configured} okText={`Enabled (${storage.provider})`} offText="Disabled — using URLs/demo" />
            <StatusRow label="Analytics" ok={Boolean(config.seo.gaMeasurementId)} okText="Configured" offText="Not configured" />
          </ul>
          <p className="mt-3 text-xs text-black/50">
            Optional features degrade gracefully — the site works without them.
          </p>
        </Card>
      </div>
    </>
  );
}

function Stat({ label, value, href, highlight }: { label: string; value: number; href: string; highlight?: boolean }) {
  return (
    <Link href={href}>
      <Card className={highlight ? "ring-2 ring-brand-accent" : ""}>
        <p className="text-sm text-black/60">{label}</p>
        <p className="mt-1 font-heading text-3xl font-bold text-brand-primary">{value}</p>
      </Card>
    </Link>
  );
}

function StatusRow({ label, ok, okText, offText }: { label: string; ok: boolean; okText: string; offText: string }) {
  return (
    <li className="flex items-center justify-between">
      <span>{label}</span>
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${ok ? "text-green-700" : "text-amber-700"}`}>
        <span className={`h-2 w-2 rounded-full ${ok ? "bg-green-500" : "bg-amber-500"}`} />
        {ok ? okText : offText}
      </span>
    </li>
  );
}
