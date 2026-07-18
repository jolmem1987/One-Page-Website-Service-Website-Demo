import type { Metadata } from "next";
import Link from "next/link";
import { getSiteConfig } from "@/lib/data";
import { buildPageMetadata, resolveTitle } from "@/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/JsonLd";
import { ServiceIcon } from "@/components/ui/ServiceIcon";
import { telHref } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  return buildPageMetadata(config, "about");
}

export default async function AboutPage() {
  const config = await getSiteConfig();
  const b = config.business;
  const a = config.about;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(config, [
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />

      <section className="bg-brand-primary py-16 text-white">
        <div className="container-page">
          <p className="eyebrow">About us</p>
          <h1 className="mt-2 max-w-3xl font-heading text-4xl font-bold sm:text-5xl">
            {b.name}: {b.tagline}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80">{a.experience}</p>
        </div>
      </section>

      <section className="section">
        <div className="container-page grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="font-heading text-2xl font-bold">Our story</h2>
            <p className="mt-4 whitespace-pre-line leading-relaxed text-black/75">{a.story}</p>

            <h2 className="mt-10 font-heading text-2xl font-bold">Our mission</h2>
            <p className="mt-4 leading-relaxed text-black/75">{a.mission}</p>

            <h2 className="mt-10 font-heading text-2xl font-bold">Safety & workmanship</h2>
            <p className="mt-4 leading-relaxed text-black/75">{a.safety}</p>

            <h2 className="mt-10 font-heading text-2xl font-bold">Part of the community</h2>
            <p className="mt-4 leading-relaxed text-black/75">{a.community}</p>
          </div>

          <aside className="space-y-6">
            <div className="card">
              <h3 className="font-heading text-lg font-bold">{a.ownerName}</h3>
              <p className="text-sm font-medium text-brand-accent">{a.ownerTitle}</p>
              <p className="mt-3 text-sm leading-relaxed text-black/70">{a.ownerBio}</p>
            </div>
            <div className="card bg-muted">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-black/60">Established</dt>
                  <dd className="font-semibold">{b.foundedYear}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-black/60">Experience</dt>
                  <dd className="font-semibold">{b.yearsExperience}+ years</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-black/60">Serving</dt>
                  <dd className="font-semibold text-right">
                    {config.serviceArea.primaryCity}, {config.serviceArea.state}
                  </dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </section>

      {/* Values */}
      {a.values.length > 0 && (
        <section className="section bg-muted">
          <div className="container-page">
            <h2 className="text-center font-heading text-3xl font-bold">What we value</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {a.values.map((v) => (
                <div key={v.title} className="card">
                  <ServiceIcon name="shield" className="h-7 w-7 text-brand-accent" />
                  <h3 className="mt-3 font-semibold">{v.title}</h3>
                  <p className="mt-2 text-sm text-black/70">{v.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="section">
        <div className="container-page rounded-2xl bg-brand-primary px-8 py-12 text-center text-white">
          <h2 className="font-heading text-3xl font-bold">Ready to get started?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">
            Get a free, no-pressure estimate, or browse our recent work to see the quality for yourself.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/#estimate" className="btn btn-primary text-base">
              Get a Free Estimate
            </Link>
            <Link href="/gallery" className="btn btn-outline border-white text-white text-base">
              View Our Gallery
            </Link>
            <a href={telHref(b.phone)} className="btn btn-outline border-white text-white text-base">
              <ServiceIcon name="phone" className="h-5 w-5" /> {b.phone}
            </a>
          </div>
          <p className="sr-only">{resolveTitle(config, "about")}</p>
        </div>
      </section>
    </>
  );
}
