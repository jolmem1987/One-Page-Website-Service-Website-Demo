import { cache } from "react";
import { asc, eq } from "drizzle-orm";
import { getDb } from "./db";
import * as schema from "./db/schema";
import { defaultSiteConfig } from "./site-config";
import type {
  Faq,
  GalleryProject,
  ProcessStep,
  Service,
  SiteConfig,
  Testimonial,
} from "./types";

/**
 * Central data-access layer. Returns the full, assembled site configuration.
 *
 * - If a database is connected AND seeded, returns live content.
 * - Otherwise falls back to the demo config so the site always renders.
 *
 * Cached per request via React.cache so a single page render hits the DB once.
 */
export const getSiteConfig = cache(async (): Promise<SiteConfig> => {
  const db = getDb();
  if (!db) return defaultSiteConfig;

  try {
    const settingsRows = await db.select().from(schema.siteSettings).limit(1);
    const settings = settingsRows[0];
    if (!settings) return defaultSiteConfig;

    const [serviceRows, processRows, faqRows, testimonialRows, projectRows, imageRows] =
      await Promise.all([
        db.select().from(schema.services).orderBy(asc(schema.services.sortOrder)),
        db.select().from(schema.processSteps).orderBy(asc(schema.processSteps.sortOrder)),
        db.select().from(schema.faqs).orderBy(asc(schema.faqs.sortOrder)),
        db.select().from(schema.testimonials).orderBy(asc(schema.testimonials.sortOrder)),
        db.select().from(schema.galleryProjects).orderBy(asc(schema.galleryProjects.sortOrder)),
        db.select().from(schema.galleryImages).orderBy(asc(schema.galleryImages.sortOrder)),
      ]);

    const services: Service[] = serviceRows.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      icon: s.icon,
      active: s.active,
      order: s.sortOrder,
    }));

    const process: ProcessStep[] = processRows.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      order: p.sortOrder,
    }));

    const faqs: Faq[] = faqRows.map((f) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
      active: f.active,
      order: f.sortOrder,
    }));

    const testimonials: Testimonial[] = testimonialRows.map((t) => ({
      id: t.id,
      author: t.author,
      location: t.location,
      quote: t.quote,
      rating: t.rating,
      isSample: t.isSample,
      active: t.active,
      order: t.sortOrder,
    }));

    const projects: GalleryProject[] = projectRows.map((p) => ({
      id: p.id,
      title: p.title,
      serviceCategory: p.serviceCategory,
      city: p.city,
      problem: p.problem,
      work: p.work,
      result: p.result,
      description: p.description,
      completedOn: p.completedOn,
      featured: p.featured,
      active: p.active,
      order: p.sortOrder,
      images: imageRows
        .filter((img) => img.projectId === p.id)
        .map((img) => ({
          id: img.id,
          url: img.url,
          alt: img.alt,
          kind: (img.kind as "before" | "after" | "standard") ?? "standard",
          order: img.sortOrder,
        })),
    }));

    return {
      isDemo: settings.isDemo,
      business: settings.business,
      branding: settings.branding,
      hours: settings.hours,
      social: settings.social,
      serviceArea: settings.serviceArea,
      hero: settings.hero,
      about: settings.about,
      trust: settings.trust,
      whyChooseUs: settings.whyChooseUs,
      footer: settings.footer,
      seo: settings.seo,
      services: services.length ? services : defaultSiteConfig.services,
      process: process.length ? process : defaultSiteConfig.process,
      faqs: faqs.length ? faqs : defaultSiteConfig.faqs,
      testimonials: testimonials.length ? testimonials : defaultSiteConfig.testimonials,
      projects: projects.length ? projects : defaultSiteConfig.projects,
    };
  } catch (err) {
    // A misconfigured or unreachable DB should never take the public site down.
    console.error("[data] Falling back to demo config due to DB error:", err);
    return defaultSiteConfig;
  }
});

/** Active, ordered services for public display. */
export function activeServices(config: SiteConfig): Service[] {
  return config.services.filter((s) => s.active).sort((a, b) => a.order - b.order);
}

export function activeFaqs(config: SiteConfig): Faq[] {
  return config.faqs.filter((f) => f.active).sort((a, b) => a.order - b.order);
}

export function activeTestimonials(config: SiteConfig): Testimonial[] {
  return config.testimonials.filter((t) => t.active).sort((a, b) => a.order - b.order);
}

export function activeProjects(config: SiteConfig): GalleryProject[] {
  return config.projects.filter((p) => p.active).sort((a, b) => a.order - b.order);
}

export function featuredProjects(config: SiteConfig): GalleryProject[] {
  return activeProjects(config).filter((p) => p.featured);
}

/** True when the persisted settings row exists (used to detect "needs onboarding"). */
export async function getSettingsMeta(): Promise<{
  hasDb: boolean;
  onboardingComplete: boolean;
  onboardingStep: number;
}> {
  const db = getDb();
  if (!db) return { hasDb: false, onboardingComplete: false, onboardingStep: 0 };
  const rows = await db.select().from(schema.siteSettings).where(eq(schema.siteSettings.id, 1)).limit(1);
  const row = rows[0];
  return {
    hasDb: true,
    onboardingComplete: row?.onboardingComplete ?? false,
    onboardingStep: row?.onboardingStep ?? 0,
  };
}
