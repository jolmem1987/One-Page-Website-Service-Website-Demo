import Link from "next/link";
import { isDbConfigured } from "@/lib/db";
import { listLeads } from "@/lib/admin/store";
import { leadStatusEnum } from "@/lib/db/schema";
import { PageHeader, Card, Notice } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  ALL: "All",
  NEW: "New",
  CONTACTED: "Contacted",
  FOLLOW_UP: "Follow-up",
  ESTIMATE_SCHEDULED: "Est. scheduled",
  ESTIMATE_SENT: "Est. sent",
  WON: "Won",
  LOST: "Lost",
  SPAM: "Spam",
  ARCHIVED: "Archived",
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? "ALL";
  const query = params.q ?? "";

  if (!isDbConfigured()) {
    return (
      <>
        <PageHeader title="Leads" description="Manage estimate requests from your website." />
        <Notice tone="warn">Connect a database to capture and manage leads.</Notice>
      </>
    );
  }

  let leads: Awaited<ReturnType<typeof listLeads>> = [];
  try {
    leads = await listLeads({ status, query });
  } catch {
    leads = [];
  }

  const exportHref = `/admin/leads/export?${new URLSearchParams({ status, q: query }).toString()}`;

  return (
    <>
      <PageHeader
        title="Leads"
        description="Search, filter, and manage estimate requests."
        action={
          <a href={exportHref} className="btn btn-dark text-sm">
            Export CSV
          </a>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {["ALL", ...leadStatusEnum.enumValues].map((s) => (
          <Link
            key={s}
            href={`/admin/leads?${new URLSearchParams({ status: s, ...(query ? { q: query } : {}) }).toString()}`}
            className={
              "rounded-full px-3 py-1 text-xs font-medium " +
              (status === s ? "bg-brand-primary text-white" : "bg-white text-ink hover:bg-muted")
            }
          >
            {STATUS_LABELS[s] ?? s}
          </Link>
        ))}
      </div>

      <form className="mb-4 flex gap-2" action="/admin/leads">
        <input type="hidden" name="status" value={status} />
        <input
          name="q"
          defaultValue={query}
          placeholder="Search name, email, or phone…"
          className="field-input max-w-sm"
        />
        <button className="btn btn-dark text-sm">Search</button>
        {query && (
          <Link href={`/admin/leads?status=${status}`} className="btn btn-outline text-sm">
            Clear
          </Link>
        )}
      </form>

      <Card className="overflow-x-auto p-0">
        {leads.length === 0 ? (
          <p className="p-8 text-center text-sm text-black/60">No leads found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-black/10 bg-muted text-left text-xs uppercase text-black/55">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {leads.map((l) => (
                <tr key={l.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/leads/${l.id}`} className="font-medium text-brand-primary hover:underline">
                      {l.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-black/70">
                    <div>{l.phone}</div>
                    <div className="text-xs text-black/50">{l.email}</div>
                  </td>
                  <td className="px-4 py-3 text-black/70">{l.serviceRequested ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">{STATUS_LABELS[l.status]}</span>
                  </td>
                  <td className="px-4 py-3 text-black/60">{formatDate(l.createdAt.toISOString().slice(0, 10))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <p className="mt-3 text-xs text-black/50">Showing up to 500 leads. Use search to narrow results.</p>
    </>
  );
}
