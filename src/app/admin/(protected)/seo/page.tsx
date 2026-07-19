import Link from "next/link";
import { getSiteConfig } from "@/lib/data";
import { runSeoChecks, computeScore, pageScore, recommendations } from "@/lib/seo/checks";
import { resolveTitle, resolveDescription, siteUrl } from "@/lib/seo/metadata";
import { localBusinessJsonLd, faqJsonLd } from "@/lib/seo/structured-data";
import { saveGlobalSeoAction } from "@/lib/admin/actions";
import { BUSINESS_CATEGORY_LABELS } from "@/lib/types";
import { SaveForm } from "@/components/admin/SaveForm";
import { PageSeoEditor } from "@/components/admin/PageSeoEditor";
import { PageHeader, Card, ScoreDial, StatusPill, Notice } from "@/components/admin/ui";

export default async function SeoCenterPage() {
  const config = await getSiteConfig();
  const checks = runSeoChecks(config);
  const overall = computeScore(checks);
  const recs = recommendations(checks).slice(0, 12);
  const url = siteUrl(config);
  const ld = localBusinessJsonLd(config);
  const faqEligible = Boolean(faqJsonLd(config));

  const pageMeta = (p: "home" | "about" | "gallery") => ({
    score: pageScore(checks, p).score,
    title: resolveTitle(config, p),
    desc: resolveDescription(config, p),
  });

  return (
    <>
      <PageHeader
        title="Local SEO Center"
        description="Improve how your website appears in local search. This score measures website completeness and SEO readiness — not guaranteed rankings. Rankings also depend on competition, reviews, your Google Business Profile, proximity, reputation, and time."
      />

      {/* Score overview */}
      <div className="grid gap-5 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center">
            <ScoreDial score={overall.score} label="Overall readiness" />
          </div>
        </Card>
        <Card className="lg:col-span-3">
          <h2 className="mb-3 font-semibold">Page-by-page readiness</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {(["home", "about", "gallery"] as const).map((p) => {
              const m = pageMeta(p);
              return (
                <div key={p} className="rounded-md border border-black/10 p-3 text-center">
                  <ScoreDial score={m.score} />
                  <p className="mt-1 font-medium capitalize">{p}</p>
                  <Link href={p === "home" ? "/" : `/${p}`} target="_blank" className="text-xs text-brand-accent hover:underline">
                    Preview page ↗
                  </Link>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Status summary */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(["complete", "needs-attention", "missing", "recommended", "external"] as const).map((s) => (
          <Card key={s} className="text-center">
            <p className="text-2xl font-bold text-brand-primary">{overall.counts[s]}</p>
            <div className="mt-1">
              <StatusPill status={s} />
            </div>
          </Card>
        ))}
      </div>

      {/* Prioritized recommendations */}
      <Card className="mt-6">
        <h2 className="mb-1 font-heading text-lg font-bold">Prioritized recommendations</h2>
        <p className="mb-4 text-sm text-black/55">The most impactful improvements first. Each explains what, why, how, and where.</p>
        {recs.length === 0 ? (
          <Notice tone="success">Great work — no outstanding on-site recommendations right now.</Notice>
        ) : (
          <ul className="space-y-3">
            {recs.map((c) => (
              <li key={c.id} className="rounded-md border border-black/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">{c.title}</h3>
                  <div className="flex items-center gap-2">
                    {c.automated && <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">Auto-handled</span>}
                    <StatusPill status={c.status} />
                  </div>
                </div>
                <dl className="mt-2 space-y-1 text-sm text-black/70">
                  <div><dt className="inline font-medium">What: </dt><dd className="inline">{c.what}</dd></div>
                  <div><dt className="inline font-medium">Why it matters: </dt><dd className="inline">{c.why}</dd></div>
                  <div><dt className="inline font-medium">How to fix: </dt><dd className="inline">{c.how}</dd></div>
                  <div><dt className="inline font-medium">Where: </dt><dd className="inline">{c.where}</dd></div>
                  <div><dt className="inline font-medium">Scope: </dt><dd className="inline capitalize">{c.scope === "site" ? "whole website" : `${c.scope} page`}</dd></div>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Global SEO settings */}
      <Card className="mt-6">
        <h2 className="font-heading text-lg font-bold">Global SEO settings</h2>
        <p className="mb-4 text-sm text-black/55">These apply to your whole website and feed titles, sharing images, and your business listing data.</p>
        <SaveForm action={saveGlobalSeoAction} className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="field-label">Canonical site URL</label>
            <input name="siteUrl" defaultValue={config.seo.siteUrl} className="field-input" placeholder="https://www.yourbusiness.com" />
            <p className="field-hint">Your website&apos;s official address. Used for links search engines rely on.</p>
          </div>
          <div>
            <label className="field-label">Default title pattern</label>
            <input name="defaultTitlePattern" defaultValue={config.seo.defaultTitlePattern} className="field-input" />
            <p className="field-hint">Use {"{page}"} and {"{business}"} placeholders.</p>
          </div>
          <div>
            <label className="field-label">Default social image URL</label>
            <input name="defaultSocialImage" defaultValue={config.seo.defaultSocialImage ?? ""} className="field-input" />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label">Default description</label>
            <textarea name="defaultDescription" rows={2} defaultValue={config.seo.defaultDescription} className="field-input" />
          </div>
          <div>
            <label className="field-label">Google Analytics measurement ID</label>
            <input name="gaMeasurementId" defaultValue={config.seo.gaMeasurementId ?? ""} className="field-input" placeholder="G-XXXXXXX" />
          </div>
          <div>
            <label className="field-label">Google Tag Manager ID (optional)</label>
            <input name="gtmContainerId" defaultValue={config.seo.gtmContainerId ?? ""} className="field-input" placeholder="GTM-XXXXXX" />
          </div>
          <div>
            <label className="field-label">Google Search Console verification</label>
            <input name="gscVerification" defaultValue={config.seo.gscVerification ?? ""} className="field-input" />
            <p className="field-hint">The token Google gives you to prove you own the site.</p>
          </div>
          <div>
            <label className="field-label">Bing Webmaster verification (optional)</label>
            <input name="bingVerification" defaultValue={config.seo.bingVerification ?? ""} className="field-input" />
          </div>
        </SaveForm>
      </Card>

      {/* Per-page editors */}
      {(["home", "about", "gallery"] as const).map((p) => (
        <Card key={p} className="mt-6">
          <h2 className="font-heading text-lg font-bold capitalize">{p} page — search settings</h2>
          <p className="mb-4 text-sm text-black/55">Give each page a unique, descriptive title and description. See the live preview as you type.</p>
          <PageSeoEditor
            page={p}
            seo={config.seo.pages[p]}
            fallbackTitle={resolveTitle(config, p)}
            fallbackDescription={resolveDescription(config, p)}
            siteUrl={url}
            path={p === "home" ? "/" : `/${p}`}
          />
        </Card>
      ))}

      {/* Structured data summary */}
      <Card className="mt-6">
        <h2 className="font-heading text-lg font-bold">Structured data (handled automatically)</h2>
        <p className="mb-3 text-sm text-black/55">
          This is machine-readable information about your business that search engines read. The template generates and
          keeps it in sync for you — no action needed.
        </p>
        <ul className="mb-3 space-y-1 text-sm">
          <li>✓ Business type: <span className="font-medium">{BUSINESS_CATEGORY_LABELS[config.business.category]}</span> (schema.org <code>{config.business.category}</code>)</li>
          <li>✓ LocalBusiness details (name, phone, hours, area served)</li>
          <li>✓ Breadcrumb navigation on About and Gallery</li>
          <li>{faqEligible ? "✓" : "○"} FAQ rich data {faqEligible ? "(eligible and generated)" : "(add more FAQ content to qualify)"}</li>
          <li>✓ No fake review/rating data is ever generated for sample content</li>
        </ul>
        <details className="rounded border border-black/10 p-3">
          <summary className="cursor-pointer text-sm font-medium">View generated business data (JSON-LD)</summary>
          <pre className="mt-2 max-h-72 overflow-auto rounded bg-brand-primary p-3 text-xs text-white/90">
            {JSON.stringify(ld, null, 2)}
          </pre>
        </details>
      </Card>

      <div className="mt-6">
        <Link href="/admin/seo/checklist" className="btn btn-dark">
          Open the Local SEO Action Plan (off-site tasks) →
        </Link>
      </div>
    </>
  );
}
