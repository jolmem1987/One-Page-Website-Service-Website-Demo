"use client";

import { SaveForm } from "@/components/admin/SaveForm";
import type { ActionResult } from "@/lib/admin/types";
import type { BusinessInfo } from "@/lib/types";

/**
 * Business identity & contact form.
 *
 * This lives in a Client Component because it uses SaveForm's render-prop
 * (a function child) to surface per-field validation errors. Functions cannot
 * be passed from a Server Component to a Client Component, so the render-prop
 * has to be created on the client side.
 */
export function BusinessIdentityForm({
  business: b,
  action,
}: {
  business: BusinessInfo;
  action: (prev: ActionResult, fd: FormData) => Promise<ActionResult>;
}) {
  return (
    <SaveForm action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
      {(errors) => (
        <>
          <F name="name" label="Business name" value={b.name} err={errors.name} />
          <F name="legalName" label="Legal business name" value={b.legalName} />
          <F name="tagline" label="Tagline" value={b.tagline} />
          <F name="primaryService" label="Primary service" value={b.primaryService} />
          <F name="phone" label="Phone" value={b.phone} err={errors.phone} />
          <F name="email" label="Email" value={b.email} err={errors.email} />
          <div className="sm:col-span-2">
            <F name="addressLine" label="Street address" value={b.addressLine} />
          </div>
          <F name="city" label="City" value={b.city} />
          <F name="state" label="State (2-letter)" value={b.state} />
          <F name="zip" label="ZIP" value={b.zip} />
          <F name="licenseInfo" label="License info" value={b.licenseInfo} />
          <F name="yearsExperience" label="Years of experience" value={String(b.yearsExperience)} type="number" />
          <F name="foundedYear" label="Founded year" value={String(b.foundedYear)} type="number" />
          <label className="flex items-center gap-2 self-end text-sm sm:col-span-2">
            <input type="checkbox" name="showAddress" defaultChecked={b.showAddress} /> Show my street address publicly
            <span className="text-xs text-black/50">(Turn off if you work from home / are a service-area business.)</span>
          </label>
        </>
      )}
    </SaveForm>
  );
}

function F({
  name,
  label,
  value,
  type = "text",
  err,
}: {
  name: string;
  label: string;
  value: string;
  type?: string;
  err?: string;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <input name={name} type={type} defaultValue={value} className="field-input" />
      {err && <p className="field-hint text-red-600">{err}</p>}
    </div>
  );
}
