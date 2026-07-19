import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getSiteConfig, activeServices, activeFaqs, activeTestimonials, featuredProjects } from "@/lib/data";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { faqJsonLd } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/JsonLd";
import { EstimateForm } from "@/components/site/EstimateForm";
import { ServiceIcon } from "@/components/ui/ServiceIcon";
import { telHref } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  return buildPageMetadata(config, "home");
}

export default async function HomePage() {
  const config = await getSiteConfig();
  const b = config.business;
  const services = activeServices(config);
  const faqs = activeFaqs(config);
  const testimonials = activeTestimonials(config);
  const featured = featuredProjects(config).slice(0, 3);
  const trust = config.trust.filter((t) => t.active).sort((a, b) => a.order - b.order);
  const faqLd = faqJsonLd(config);

  return (
    <>
      {faqLd && <JsonLd data={faqLd} />}

      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden bg-brand-primary text-white">
        <div className="container-page grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-up">
            <p className="eyebrow">
              {b.primaryService} · {config.serviceArea.primaryCity}, {config.serviceArea.state}
            </p>
            <h1 className="mt-3 font-heading text-4xl font-bold leading-tight sm:text-5xl">
              {config.hero.headline}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/80">{config.hero.subheadline}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#estimate" className="btn btn-primary text-base">
                {config.hero.primaryCtaLabel}
              </Link>
              <a href={telHref(b.phone)} className="btn btn-outline border-white text-white text-base">
                <ServiceIcon name="phone" className="h-5 w-5" /> {config.hero.secondaryCtaLabel}: {b.phone}
              </a>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl shadow-2xl">
            <Image
              src={config.hero.imageUrl}
              alt={config.hero.imageAlt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* ---------------- TRUST INDICATORS ---------------- */}
      {trust.length > 0 && (
        <section className="border-b border-black/10 bg-muted">
          <div className="container-page grid grid-cols-2 gap-4 py-8 md:grid-cols-5">
            {trust.map((t) => (
              <div key={t.id} className="text-center">
                <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-white text-brand-accent shadow-sm">
                  <ServiceIcon name="check" className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-ink">{t.label}</p>
                <p className="text-xs text-black/55">{t.detail}</p>
                {t.isSample && <p className="mt-0.5 text-[10px] uppercase tracking-wide text-black/40">Sample claim</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------------- SERVICES ---------------- */}
      <section id="services" className="section">
        <div className="container-page">
          <SectionHeading eyebrow="What we do" title={`Our ${b.primaryService} Services`} />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <div key={s.id} className="card">
                <div className="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-brand-primary/5 text-brand-primary">
                  <ServiceIcon name={s.icon} className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">{s.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-black/70">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- WHY CHOOSE US ---------------- */}
      {config.whyChooseUs.length > 0 && (
        <section className="section bg-muted">
          <div className="container-page grid gap-10 lg:grid-cols-2">
            <div>
              <SectionHeading eyebrow="Why choose us" title="A roofer your neighbors actually recommend" align="left" />
              <p className="mt-4 max-w-lg text-black/70">{config.about.mission}</p>
            </div>
            <ul className="grid gap-5 sm:grid-cols-2">
              {config.whyChooseUs
                .sort((a, c) => a.order - c.order)
                .map((w) => (
                  <li key={w.id} className="flex gap-3">
                    <ServiceIcon name="shield" className="mt-0.5 h-6 w-6 shrink-0 text-brand-accent" />
                    <div>
                      <h3 className="font-semibold">{w.title}</h3>
                      <p className="mt-1 text-sm text-black/70">{w.description}</p>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </section>
      )}

      {/* ---------------- PROCESS ---------------- */}
      {config.process.length > 0 && (
        <section className="section">
          <div className="container-page">
            <SectionHeading eyebrow="How it works" title="A simple, honest process" />
            <ol className="mt-10 grid gap-6 md:grid-cols-3 lg:grid-cols-5">
              {config.process
                .sort((a, c) => a.order - c.order)
                .map((p, i) => (
                  <li key={p.id} className="relative">
                    <div className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-brand-accent font-heading text-lg font-bold text-white">
                      {i + 1}
                    </div>
                    <h3 className="font-semibold">{p.title}</h3>
                    <p className="mt-1 text-sm text-black/70">{p.description}</p>
                  </li>
                ))}
            </ol>
          </div>
        </section>
      )}

      {/* ---------------- FEATURED GALLERY ---------------- */}
      {featured.length > 0 && (
        <section className="section bg-muted">
          <div className="container-page">
            <div className="flex items-end justify-between gap-4">
              <SectionHeading eyebrow="Recent work" title="Featured projects" align="left" />
              <Link href="/gallery" className="hidden text-sm font-semibold text-brand-accent hover:underline sm:inline">
                View full gallery →
              </Link>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {featured.map((p) => {
                const cover = p.images.find((i) => i.kind !== "before") ?? p.images[0];
                return (
                  <Link key={p.id} href="/gallery" className="group card overflow-hidden p-0">
                    {cover && (
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <Image
                          src={cover.url}
                          alt={cover.alt}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent">{p.serviceCategory}</p>
                      <h3 className="mt-1 font-semibold">{p.title}</h3>
                      <p className="mt-1 text-sm text-black/60">{p.city}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
            <Link href="/gallery" className="mt-6 inline-block text-sm font-semibold text-brand-accent hover:underline sm:hidden">
              View full gallery →
            </Link>
          </div>
        </section>
      )}

      {/* ---------------- TESTIMONIALS ---------------- */}
      {testimonials.length > 0 && (
        <section className="section">
          <div className="container-page">
            <SectionHeading eyebrow="What customers say" title="Testimonials" />
            {testimonials.some((t) => t.isSample) && (
              <p className="mt-2 text-center text-xs text-black/50">
                Reviews marked “sample” are demonstration content. Replace them with real customer reviews in the admin panel.
              </p>
            )}
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {testimonials.slice(0, 3).map((t) => (
                <figure key={t.id} className="card">
                  {t.rating != null && (
                    <div className="mb-2 flex text-brand-accent" aria-label={`${t.rating} out of 5`}>
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <ServiceIcon key={i} name="star" className="h-4 w-4" />
                      ))}
                    </div>
                  )}
                  <blockquote className="text-sm leading-relaxed text-black/80">“{t.quote}”</blockquote>
                  <figcaption className="mt-4 text-sm font-semibold">
                    {t.author} <span className="font-normal text-black/55">· {t.location}</span>
                    {t.isSample && <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-black/50">Sample</span>}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------------- SERVICE AREA ---------------- */}
      <section className="section bg-brand-secondary text-white">
        <div className="container-page grid gap-8 lg:grid-cols-2">
          <div>
            <p className="eyebrow text-brand-accent">Service area</p>
            <h2 className="mt-2 font-heading text-3xl font-bold">
              Proudly serving {config.serviceArea.primaryCity} & nearby communities
            </h2>
            <p className="mt-4 max-w-xl text-white/80">{config.serviceArea.description}</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-white/70">Cities we serve</h3>
              <ul className="mt-2 space-y-1 text-white/85">
                <li>{config.serviceArea.primaryCity} (home base)</li>
                {config.serviceArea.nearbyCities.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-white/70">Counties</h3>
              <ul className="mt-2 space-y-1 text-white/85">
                {config.serviceArea.counties.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      {faqs.length > 0 && (
        <section className="section">
          <div className="container-page max-w-3xl">
            <SectionHeading eyebrow="Questions" title="Frequently asked questions" />
            <div className="mt-8 divide-y divide-black/10">
              {faqs.map((f) => (
                <details key={f.id} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                    {f.question}
                    <span className="text-brand-accent transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-black/70">{f.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------------- ESTIMATE FORM ---------------- */}
      <section id="estimate" className="section bg-muted scroll-mt-20">
        <div className="container-page grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Free estimate" title="Get your free, no-pressure estimate" align="left" />
            <p className="mt-4 max-w-lg text-black/70">
              Tell us about your project and we&apos;ll get back to you to schedule a free on-site estimate.
              Prefer to talk now? Call{" "}
              <a href={telHref(b.phone)} className="font-semibold text-brand-accent hover:underline">
                {b.phone}
              </a>
              .
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {["Free, written estimates", "Straight answers — repair or replace", "Licensed & insured crew"].map((x) => (
                <li key={x} className="flex items-center gap-2">
                  <ServiceIcon name="check" className="h-5 w-5 text-brand-accent" /> {x}
                </li>
              ))}
            </ul>
          </div>
          <EstimateForm services={services.map((s) => s.name)} />
        </div>
      </section>
    </>
  );
}

function SectionHeading({
  eyebrow,
  title,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "text-center" : ""}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-2 font-heading text-3xl font-bold sm:text-4xl">{title}</h2>
    </div>
  );
}
