"use client";

import { useActionState, useState } from "react";
import { sendLeadEmailAction } from "@/lib/admin/actions";
import type { ActionResult } from "@/lib/admin/types";
import { Notice } from "@/components/admin/ui";

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
}

const initial: ActionResult = { ok: false };

/** Compose, save-as-draft, and (if configured) send an email to a lead. */
export function EmailComposer({
  leadId,
  toEmail,
  templates,
  emailConfigured,
  emailReason,
  vars,
}: {
  leadId: string;
  toEmail: string;
  templates: Template[];
  emailConfigured: boolean;
  emailReason?: string;
  vars: Record<string, string>;
}) {
  const [state, action] = useActionState(sendLeadEmailAction, initial);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const fill = (text: string) =>
    text.replace(/\{\{(\w+)\}\}/g, (_, k: string) => vars[k] ?? `{{${k}}}`);

  const applyTemplate = (id: string) => {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setSubject(fill(t.subject));
    setBody(fill(t.body));
  };

  return (
    <div>
      {!emailConfigured && (
        <div className="mb-3">
          <Notice tone="warn">
            Email sending is not configured, so “Send” is disabled. You can still write and save drafts.{" "}
            {emailReason}
          </Notice>
        </div>
      )}

      {templates.length > 0 && (
        <div className="mb-3">
          <label className="field-label">Start from a template</label>
          <select className="field-input" defaultValue="" onChange={(e) => applyTemplate(e.target.value)}>
            <option value="">Choose a template…</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <form action={action} className="space-y-3">
        <input type="hidden" name="id" value={leadId} />
        <input type="hidden" name="to" value={toEmail} />
        <div>
          <label className="field-label">To</label>
          <input className="field-input bg-muted" value={toEmail} readOnly />
        </div>
        <div>
          <label className="field-label">Subject</label>
          <input
            name="subject"
            className="field-input"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="field-label">Message</label>
          <textarea
            name="body"
            rows={8}
            className="field-input"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
        </div>

        <div className="flex items-center gap-2">
          <button type="submit" name="intent" value="draft" className="btn btn-outline text-sm">
            Save draft
          </button>
          <button
            type="submit"
            name="intent"
            value="send"
            className="btn btn-primary text-sm"
            disabled={!emailConfigured}
            title={emailConfigured ? "Send email" : "Email sending is not configured"}
          >
            Send email
          </button>
          {state.message && (
            <span className={"text-sm " + (state.ok ? "text-green-700" : "text-red-600")}>{state.message}</span>
          )}
        </div>
      </form>
    </div>
  );
}
