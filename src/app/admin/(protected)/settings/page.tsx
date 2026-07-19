import { getSiteConfig } from "@/lib/data";
import {
  saveBusinessAction,
  saveCategoryAction,
  saveHoursAction,
  saveServiceAreaAction,
  saveSocialAction,
  setDemoAction,
} from "@/lib/admin/actions";
import { BUSINESS_CATEGORY_LABELS } from "@/lib/types";
import { SaveForm } from "@/components/admin/SaveForm";
import { BusinessIdentityForm } from "@/components/admin/BusinessIdentityForm";
import { BrandingEditor } from "@/components/admin/BrandingEditor";
import { PageHeader, Card, Notice } from "@/components/admin/ui";
import { dayName } from "@/lib/utils";

export default async function SettingsPage() {
  const config = await getSiteConfig();
  const b = config.business;
  const sa = config.serviceArea;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Your business details in one place. These feed the header, footer, contact sections, page metadata, and your business listing data — so everything stays consistent."
      />

      <div className="space-y-8">
        {/* Business identity + contact */}
        <Card>
          <h2 className="font-heading text-lg font-bold">Business identity & contact</h2>
          <BusinessIdentityForm business={b} action={saveBusinessAction} />
        </Card>

        {/* Category */}
        <Card>
          <h2 className="font-heading text-lg font-bold">Business category</h2>
          <p className="mb-3 text-sm text-black/55">Sets the correct business type for search engines automatically.</p>
          <SaveForm action={saveCategoryAction} submitLabel="Save category">
            <select name="category" defaultValue={b.category} className="field-input sm:max-w-sm">
              {Object.entries(BUSINESS_CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </SaveForm>
        </Card>

        {/* Hours */}
        <Card>
          <h2 className="font-heading text-lg font-bold">Business hours</h2>
          <SaveForm action={saveHoursAction} className="mt-4 space-y-2">
            {[1, 2, 3, 4, 5, 6, 0].map((day) => {
              const h = config.hours.find((x) => x.day === day);
              const closed = !h?.open;
              return (
                <div key={day} className="flex flex-wrap items-center gap-3">
                  <span className="w-24 text-sm font-medium">{dayName(day)}</span>
                  <input type="time" name={`open_${day}`} defaultValue={h?.open ?? "08:00"} className="field-input w-32" />
                  <span className="text-sm">to</span>
                  <input type="time" name={`close_${day}`} defaultValue={h?.close ?? "17:00"} className="field-input w-32" />
                  <label className="flex items-center gap-1.5 text-sm">
                    <input type="checkbox" name={`closed_${day}`} defaultChecked={closed} /> Closed
                  </label>
                </div>
              );
            })}
          </SaveForm>
        </Card>

        {/* Service area */}
        <Card>
          <h2 className="font-heading text-lg font-bold">Location & service area</h2>
          <SaveForm action={saveServiceAreaAction} className="mt-4 grid gap-3 sm:grid-cols-2">
            <F name="primaryCity" label="Primary city" value={sa.primaryCity} />
            <F name="state" label="State" value={sa.state} />
            <F name="zip" label="ZIP" value={sa.zip} />
            <div className="sm:col-span-2">
              <label className="field-label">Nearby cities you actually serve (comma-separated)</label>
              <input name="nearbyCities" defaultValue={sa.nearbyCities.join(", ")} className="field-input" />
              <p className="field-hint">Only list places you genuinely work — never invent locations.</p>
            </div>
            <div className="sm:col-span-2">
              <label className="field-label">Counties / regions (comma-separated)</label>
              <input name="counties" defaultValue={sa.counties.join(", ")} className="field-input" />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label">Service-area description</label>
              <textarea name="description" rows={3} defaultValue={sa.description} className="field-input" />
              <p className="field-hint">Write naturally about where you work. Avoid stuffing city names.</p>
            </div>
          </SaveForm>
        </Card>

        {/* Branding */}
        <Card>
          <h2 className="font-heading text-lg font-bold">Branding</h2>
          <p className="mb-4 text-sm text-black/55">Change colors and fonts without breaking readability — we warn you if contrast is too low.</p>
          <BrandingEditor branding={config.branding} />
        </Card>

        {/* Social / profiles */}
        <Card>
          <h2 className="font-heading text-lg font-bold">Links & profiles</h2>
          <SaveForm action={saveSocialAction} className="mt-4 grid gap-3 sm:grid-cols-2">
            <F name="googleBusinessProfile" label="Google Business Profile URL" value={config.social.googleBusinessProfile ?? ""} />
            <F name="googleReviewUrl" label="Google review link" value={config.social.googleReviewUrl ?? ""} />
            <F name="facebook" label="Facebook" value={config.social.facebook ?? ""} />
            <F name="instagram" label="Instagram" value={config.social.instagram ?? ""} />
            <F name="youtube" label="YouTube" value={config.social.youtube ?? ""} />
            <F name="linkedin" label="LinkedIn" value={config.social.linkedin ?? ""} />
            <F name="x" label="X / Twitter" value={config.social.x ?? ""} />
          </SaveForm>
        </Card>

        {/* Demo mode */}
        <Card>
          <h2 className="font-heading text-lg font-bold">Demonstration mode</h2>
          {config.isDemo ? (
            <Notice tone="warn">
              Demo mode is ON. A “demonstration site” disclaimer shows on the public site. Turn it off when this becomes a
              real customer&apos;s live website.
            </Notice>
          ) : (
            <Notice tone="success">Demo mode is OFF. No demonstration disclaimer is shown.</Notice>
          )}
          <SaveForm action={setDemoAction} submitLabel="Save" className="mt-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isDemo" defaultChecked={config.isDemo} /> Show the demonstration disclaimer
            </label>
          </SaveForm>
        </Card>
      </div>
    </>
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
