import Link from "next/link";
import { getSiteConfig, getSettingsMeta } from "@/lib/data";
import { saveOnboardingAction } from "@/lib/admin/actions";
import { SaveForm } from "@/components/admin/SaveForm";
import { PageHeader, Card, Notice } from "@/components/admin/ui";

interface Step {
  key: string;
  title: string;
  guidance: string[];
  link?: { href: string; label: string };
}

const STEPS: Step[] = [
  { key: "identity", title: "Business identity", guidance: ["Enter the exact business name you use on Google.", "Add a short tagline and your primary service."], link: { href: "/admin/settings", label: "Open business settings" } },
  { key: "contact", title: "Contact information", guidance: ["Add the phone and email customers should use.", "Set your address, or turn off 'show address' if you work from home."], link: { href: "/admin/settings", label: "Open contact settings" } },
  { key: "services", title: "Main services", guidance: ["List the services you offer with specific, honest descriptions.", "Aim for at least 3–6 services."], link: { href: "/admin/content", label: "Edit services" } },
  { key: "location", title: "Location & service area", guidance: ["Set your primary city and state.", "Add only the nearby cities you genuinely serve."], link: { href: "/admin/settings", label: "Edit service area" } },
  { key: "hours", title: "Business hours", guidance: ["Set open/close times for each day.", "Mark days you're closed."], link: { href: "/admin/settings", label: "Edit hours" } },
  { key: "branding", title: "Branding", guidance: ["Choose your colors and fonts.", "We'll warn you if a color has poor contrast."], link: { href: "/admin/settings", label: "Edit branding" } },
  { key: "homepage", title: "Homepage content", guidance: ["Write a headline that names your service and city.", "Add supporting copy and a real hero image."], link: { href: "/admin/content", label: "Edit homepage" } },
  { key: "about", title: "About information", guidance: ["Tell your genuine company story.", "Add owner info, mission, and community involvement."], link: { href: "/admin/content", label: "Edit About page" } },
  { key: "gallery", title: "Initial gallery projects", guidance: ["Add a few real projects with problem → work → result.", "Include descriptive alt text for each photo."], link: { href: "/admin/gallery", label: "Add projects" } },
  { key: "localseo", title: "Local SEO setup", guidance: ["Set your canonical site URL and unique page titles.", "Add your Google Business Profile and review links."], link: { href: "/admin/seo", label: "Open SEO Center" } },
  { key: "notifications", title: "Lead notifications", guidance: ["Set LEAD_NOTIFICATION_EMAIL and email credentials so you're alerted to new leads.", "Test the estimate form to confirm leads arrive."], link: { href: "/admin/leads", label: "View leads" } },
  { key: "launch", title: "Final preview & launch", guidance: ["Review each public page.", "Turn off demo mode when this is a real customer's site.", "Work through the off-site SEO action plan."], link: { href: "/admin/seo/checklist", label: "Open action plan" } },
];

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ step?: string }> }) {
  const params = await searchParams;
  const config = await getSiteConfig();
  const meta = await getSettingsMeta();
  const current = Math.min(Math.max(Number(params.step ?? "1") || 1, 1), STEPS.length);
  const step = STEPS[current - 1];
  const isLast = current === STEPS.length;

  return (
    <>
      <PageHeader
        title="Setup Wizard"
        description="Turn the demo into your business — no code required. Save your progress and continue anytime."
      />

      {!meta.hasDb && <Notice tone="warn">Connect a database first so your setup can be saved.</Notice>}

      {/* Stepper */}
      <div className="mb-6 flex flex-wrap gap-1.5">
        {STEPS.map((s, i) => (
          <Link
            key={s.key}
            href={`/admin/onboarding?step=${i + 1}`}
            className={
              "rounded px-2.5 py-1 text-xs font-medium " +
              (i + 1 === current ? "bg-brand-primary text-white" : i + 1 < current ? "bg-green-100 text-green-800" : "bg-white text-black/60 hover:bg-muted")
            }
          >
            {i + 1}. {s.title}
          </Link>
        ))}
      </div>

      <Card>
        <p className="text-sm font-semibold text-brand-accent">
          Step {current} of {STEPS.length}
        </p>
        <h2 className="mt-1 font-heading text-2xl font-bold">{step.title}</h2>
        <ul className="mt-4 space-y-2 text-sm text-black/70">
          {step.guidance.map((g) => (
            <li key={g} className="flex gap-2">
              <span className="text-brand-accent">•</span> {g}
            </li>
          ))}
        </ul>

        {/* Inline quick-edit for the first two steps */}
        {(step.key === "identity" || step.key === "contact") && (
          <div className="mt-5 rounded-md bg-muted p-4">
            <SaveForm
              action={saveOnboardingAction}
              submitLabel="Save & keep going"
              hidden={{ step: String(current), section: step.key, complete: "false" }}
              className="grid gap-3 sm:grid-cols-2"
            >
              {step.key === "identity" ? (
                <>
                  <QuickField name="name" label="Business name" value={config.business.name} />
                  <QuickField name="tagline" label="Tagline" value={config.business.tagline} />
                  <QuickField name="primaryService" label="Primary service" value={config.business.primaryService} />
                  <QuickField name="legalName" label="Legal name" value={config.business.legalName} />
                </>
              ) : (
                <>
                  <QuickField name="phone" label="Phone" value={config.business.phone} />
                  <QuickField name="email" label="Email" value={config.business.email} />
                </>
              )}
            </SaveForm>
          </div>
        )}

        {step.link && (
          <Link href={step.link.href} className="btn btn-dark mt-5 text-sm">
            {step.link.label} →
          </Link>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-black/10 pt-4">
          {current > 1 ? (
            <Link href={`/admin/onboarding?step=${current - 1}`} className="btn btn-outline text-sm">
              ← Previous
            </Link>
          ) : (
            <span />
          )}

          {isLast ? (
            <SaveForm action={saveOnboardingAction} submitLabel="Finish setup ✓" hidden={{ step: String(current), complete: "true" }}>
              <p className="text-sm text-black/60">Mark onboarding complete when you&apos;re ready to launch.</p>
            </SaveForm>
          ) : (
            <Link href={`/admin/onboarding?step=${current + 1}`} className="btn btn-primary text-sm">
              Next →
            </Link>
          )}
        </div>
      </Card>

      {meta.onboardingComplete && (
        <div className="mt-4">
          <Notice tone="success">Onboarding is marked complete. You can revisit any step anytime.</Notice>
        </div>
      )}
    </>
  );
}

function QuickField({ name, label, value }: { name: string; label: string; value: string }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <input name={name} defaultValue={value} className="field-input" />
    </div>
  );
}
