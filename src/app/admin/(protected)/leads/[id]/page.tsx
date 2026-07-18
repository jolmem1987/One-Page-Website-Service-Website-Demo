import Link from "next/link";
import { notFound } from "next/navigation";
import { getSiteConfig } from "@/lib/data";
import { isDbConfigured } from "@/lib/db";
import { getEmailStatus } from "@/lib/email";
import { getLead, listTemplates } from "@/lib/admin/store";
import { leadStatusEnum, activityTypeEnum } from "@/lib/db/schema";
import {
  updateLeadStatusAction,
  addNoteAction,
  setFollowUpAction,
  setValueAction,
} from "@/lib/admin/actions";
import { PageHeader, Card, Notice } from "@/components/admin/ui";
import { SaveForm } from "@/components/admin/SaveForm";
import { EmailComposer } from "@/components/admin/EmailComposer";
import { formatCurrencyFromCents, formatDate } from "@/lib/utils";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isDbConfigured()) {
    return <Notice tone="warn">Connect a database to view lead details.</Notice>;
  }

  const data = await getLead(id);
  if (!data) notFound();
  const { lead, activities, emails } = data;
  const config = await getSiteConfig();
  const templates = await listTemplates().catch(() => []);
  const email = getEmailStatus();

  return (
    <>
      <div className="mb-4">
        <Link href="/admin/leads" className="text-sm text-brand-accent hover:underline">
          ← Back to leads
        </Link>
      </div>
      <PageHeader title={lead.name} description={`Received ${formatDate(lead.createdAt.toISOString().slice(0, 10))}`} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: details + actions */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="mb-3 font-semibold">Contact details</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Detail label="Phone" value={<a className="text-brand-accent" href={`tel:${lead.phone}`}>{lead.phone}</a>} />
              <Detail label="Email" value={<a className="text-brand-accent" href={`mailto:${lead.email}`}>{lead.email}</a>} />
              <Detail label="Location" value={lead.location ?? "—"} />
              <Detail label="Service" value={lead.serviceRequested ?? "—"} />
              <Detail label="Preferred contact" value={lead.preferredContact} />
              <Detail label="Consent" value={lead.consent ? "Given" : "Not given"} />
            </dl>
            {lead.message && (
              <div className="mt-4">
                <p className="text-xs uppercase text-black/50">Project description</p>
                <p className="mt-1 whitespace-pre-line text-sm text-black/80">{lead.message}</p>
              </div>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold">Send a response</h2>
            <EmailComposer
              leadId={lead.id}
              toEmail={lead.email}
              templates={templates}
              emailConfigured={email.configured}
              emailReason={email.reason}
              vars={{
                name: lead.name,
                business: config.business.name,
                phone: config.business.phone,
                service: lead.serviceRequested ?? "your project",
              }}
            />
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold">Record an activity</h2>
            <SaveForm action={addNoteAction} submitLabel="Add" hidden={{ id: lead.id }} className="space-y-3">
              <div className="flex gap-2">
                <select name="type" className="field-input max-w-[10rem]">
                  {activityTypeEnum.enumValues
                    .filter((t) => !["STATUS_CHANGE", "FOLLOW_UP_SET", "SYSTEM"].includes(t))
                    .map((t) => (
                      <option key={t} value={t}>
                        {t.charAt(0) + t.slice(1).toLowerCase()}
                      </option>
                    ))}
                </select>
                <input name="body" placeholder="What happened? (e.g. Called, left voicemail)" className="field-input" />
              </div>
            </SaveForm>
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold">Activity timeline</h2>
            <ol className="space-y-3">
              {[...activities, ...emails.map((e) => ({
                id: `email-${e.id}`,
                type: "EMAIL" as const,
                body: `${e.status === "SENT" ? "Sent" : e.status === "FAILED" ? "Failed" : "Draft"} email: "${e.subject}"`,
                createdAt: e.createdAt,
              }))]
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                .map((a) => (
                  <li key={a.id} className="flex gap-3 text-sm">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-accent" />
                    <div>
                      <p className="text-black/80">
                        <span className="font-medium">{a.type}</span> — {a.body}
                      </p>
                      <p className="text-xs text-black/45">{a.createdAt.toLocaleString()}</p>
                    </div>
                  </li>
                ))}
              {activities.length === 0 && emails.length === 0 && (
                <li className="text-sm text-black/50">No activity yet.</li>
              )}
            </ol>
          </Card>
        </div>

        {/* Right: status / follow-up / value */}
        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 font-semibold">Status</h2>
            <form action={updateLeadStatusAction} className="space-y-2">
              <input type="hidden" name="id" value={lead.id} />
              <select name="status" defaultValue={lead.status} className="field-input">
                {leadStatusEnum.enumValues.map((s) => (
                  <option key={s} value={s}>
                    {s.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
              <button className="btn btn-dark w-full text-sm">Update status</button>
            </form>
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold">Follow-up date</h2>
            <SaveForm action={setFollowUpAction} submitLabel="Save" hidden={{ id: lead.id }}>
              <input type="date" name="followUpDate" defaultValue={lead.followUpDate ?? ""} className="field-input" />
            </SaveForm>
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold">Estimated value</h2>
            <p className="mb-2 text-2xl font-bold text-brand-primary">{formatCurrencyFromCents(lead.estimatedValueCents)}</p>
            <SaveForm action={setValueAction} submitLabel="Save" hidden={{ id: lead.id }}>
              <div className="flex items-center gap-1">
                <span className="text-sm">$</span>
                <input
                  name="value"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={lead.estimatedValueCents ? lead.estimatedValueCents / 100 : ""}
                  className="field-input"
                  placeholder="Project value"
                />
              </div>
            </SaveForm>
          </Card>

          <Card>
            <h2 className="mb-2 font-semibold">Quick status</h2>
            <div className="grid grid-cols-2 gap-2">
              {(["SPAM", "ARCHIVED", "WON", "LOST"] as const).map((s) => (
                <form key={s} action={updateLeadStatusAction}>
                  <input type="hidden" name="id" value={lead.id} />
                  <input type="hidden" name="status" value={s} />
                  <button className="w-full rounded border border-black/15 px-2 py-1.5 text-xs hover:bg-muted">
                    Mark {s.toLowerCase()}
                  </button>
                </form>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase text-black/45">{label}</dt>
      <dd className="mt-0.5 text-black/80">{value}</dd>
    </div>
  );
}
