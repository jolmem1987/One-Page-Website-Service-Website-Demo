"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitLeadAction } from "@/app/(public)/actions";
import type { LeadFormState } from "@/app/(public)/lead-form-state";

const initial: LeadFormState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary w-full text-base" disabled={pending}>
      {pending ? "Sending…" : "Request My Free Estimate"}
    </button>
  );
}

export function EstimateForm({ services }: { services: string[] }) {
  const [state, action] = useActionState(submitLeadAction, initial);
  const err = state.fieldErrors ?? {};

  if (state.status === "success" || state.status === "success-nodb") {
    return (
      <div className="card border-brand-accent/40 bg-white text-center" role="status">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-brand-accent/15 text-brand-accent">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="font-heading text-xl font-bold">Request received</h3>
        <p className="mt-2 text-sm text-black/70">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="card space-y-4" noValidate>
      {state.status === "error" && state.message && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {state.message}
        </p>
      )}

      {/* Honeypot: hidden from humans, tempting to bots. Must stay empty. */}
      <div className="hidden" aria-hidden="true">
        <label>
          Company website
          <input type="text" name="company_website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" name="name" error={err.name} required autoComplete="name" />
        <Field label="Phone" name="phone" type="tel" error={err.phone} required autoComplete="tel" />
      </div>
      <Field label="Email" name="email" type="email" error={err.email} required autoComplete="email" />
      <Field label="Address or city" name="location" error={err.location} autoComplete="address-level2" />

      <div>
        <label htmlFor="serviceRequested" className="field-label">
          Service requested
        </label>
        <select id="serviceRequested" name="serviceRequested" className="field-input">
          <option value="">Select a service…</option>
          {services.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
          <option value="Other">Other / Not sure</option>
        </select>
      </div>

      <div>
        <span className="field-label">Preferred contact method</span>
        <div className="flex gap-4 text-sm">
          {(["PHONE", "EMAIL", "TEXT"] as const).map((m, i) => (
            <label key={m} className="inline-flex items-center gap-2">
              <input type="radio" name="preferredContact" value={m} defaultChecked={i === 0} />
              {m.charAt(0) + m.slice(1).toLowerCase()}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="message" className="field-label">
          Project description
        </label>
        <textarea id="message" name="message" rows={4} className="field-input" placeholder="Tell us what's going on with your project…" />
        {err.message && <p className="field-hint text-red-600">{err.message}</p>}
      </div>

      <label className="flex items-start gap-2 text-sm text-black/75">
        <input type="checkbox" name="consent" value="on" className="mt-1" required />
        <span>
          I agree to be contacted about my request by phone, text, or email. {err.consent && (
            <span className="text-red-600">{err.consent}</span>
          )}
        </span>
      </label>

      <SubmitButton />
      <p className="text-center text-xs text-black/50">
        No spam. Your information is used only to respond to your request.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  error,
  required,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  error?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="field-label">
        {label} {required && <span className="text-brand-accent">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="field-input"
        aria-invalid={error ? "true" : undefined}
      />
      {error && <p className="field-hint text-red-600">{error}</p>}
    </div>
  );
}
