import type { SiteConfig } from "../types";
import { activeFaqs } from "../data";
import { absoluteUrl, siteUrl } from "./metadata";

/**
 * Structured data (JSON-LD) generation.
 *
 * IMPORTANT SEO SAFETY RULES enforced here:
 * - We emit LocalBusiness data using the schema.org subtype matching the
 *   selected business category.
 * - We NEVER emit review/rating/aggregateRating structured data for sample or
 *   unverified testimonials.
 * - We only emit FAQ structured data when there is real, visible FAQ content.
 */

const DAY_SCHEMA = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function localBusinessJsonLd(config: SiteConfig): Record<string, unknown> {
  const b = config.business;
  const url = siteUrl(config);

  const openingHours = config.hours
    .filter((h) => h.open && h.close)
    .map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${DAY_SCHEMA[h.day]}`,
      opens: h.open,
      closes: h.close,
    }));

  const sameAs = [
    config.social.facebook,
    config.social.instagram,
    config.social.youtube,
    config.social.linkedin,
    config.social.x,
    config.social.googleBusinessProfile,
  ].filter((v): v is string => Boolean(v));

  const areaServed = [
    config.serviceArea.primaryCity,
    ...config.serviceArea.nearbyCities,
    ...config.serviceArea.counties,
  ]
    .filter(Boolean)
    .map((name) => ({ "@type": "City", name }));

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": b.category,
    "@id": `${url}/#business`,
    name: b.name,
    legalName: b.legalName || undefined,
    url,
    telephone: b.phone,
    email: b.email,
    description: config.seo.defaultDescription,
    image: absoluteUrl(config, config.hero.imageUrl),
    priceRange: "$$",
    areaServed: areaServed.length ? areaServed : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
    openingHoursSpecification: openingHours.length ? openingHours : undefined,
  };

  // Only publish a postal address when the business chooses to show it.
  if (b.showAddress && b.addressLine) {
    data.address = {
      "@type": "PostalAddress",
      streetAddress: b.addressLine,
      addressLocality: b.city,
      addressRegion: b.state,
      postalCode: b.zip,
      addressCountry: "US",
    };
  } else {
    // Service-area business: still declare locality/region without a street address.
    data.address = {
      "@type": "PostalAddress",
      addressLocality: b.city,
      addressRegion: b.state,
      addressCountry: "US",
    };
  }

  return data;
}

export function breadcrumbJsonLd(
  config: SiteConfig,
  trail: { name: string; path: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(config, item.path),
    })),
  };
}

/**
 * FAQ structured data — only returned when there is eligible, visible FAQ
 * content (a real question and a substantive answer). Returns null otherwise.
 */
export function faqJsonLd(config: SiteConfig): Record<string, unknown> | null {
  const faqs = activeFaqs(config).filter((f) => f.question.trim() && f.answer.trim().length >= 20);
  if (faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

/** Renders a JSON-LD script string safely (escaping `<` to prevent breakout). */
export function jsonLdString(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
