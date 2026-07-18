import type { Metadata } from "next";
import type { PageSeo, SiteConfig } from "../types";
import { fillTemplate } from "../utils";

/** Which public page we're generating metadata for. */
export type PageKey = "home" | "about" | "gallery";

const PAGE_PATHS: Record<PageKey, string> = {
  home: "/",
  about: "/about",
  gallery: "/gallery",
};

const PAGE_LABELS: Record<PageKey, string> = {
  home: "Home",
  about: "About",
  gallery: "Gallery",
};

export function siteUrl(config: SiteConfig): string {
  return (config.seo.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

export function absoluteUrl(config: SiteConfig, path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return siteUrl(config) + (path.startsWith("/") ? path : `/${path}`);
}

function pageSeo(config: SiteConfig, page: PageKey): PageSeo {
  return config.seo.pages[page];
}

/** Resolves the effective title for a page, applying the default pattern if needed. */
export function resolveTitle(config: SiteConfig, page: PageKey): string {
  const p = pageSeo(config, page);
  if (p.title.trim()) return p.title;
  return fillTemplate(config.seo.defaultTitlePattern, {
    page: PAGE_LABELS[page],
    business: config.business.name,
  });
}

export function resolveDescription(config: SiteConfig, page: PageKey): string {
  const p = pageSeo(config, page);
  return p.description.trim() || config.seo.defaultDescription;
}

/**
 * Builds a complete Next.js Metadata object for a public page, including
 * canonical URL, Open Graph, Twitter cards, and search-console verification.
 * Every page gets a unique title/description (never duplicated).
 */
export function buildPageMetadata(config: SiteConfig, page: PageKey): Metadata {
  const p = pageSeo(config, page);
  const title = resolveTitle(config, page);
  const description = resolveDescription(config, page);
  const path = PAGE_PATHS[page];
  const canonical = p.canonicalOverride?.trim() || absoluteUrl(config, path);
  const ogImage =
    p.socialImage || config.seo.defaultSocialImage || config.hero.imageUrl || "/demo/og-default.svg";
  const ogTitle = p.socialTitle?.trim() || title;
  const ogDescription = p.socialDescription?.trim() || description;

  const verification: Metadata["verification"] = {};
  if (config.seo.gscVerification) verification.google = config.seo.gscVerification;
  if (config.seo.bingVerification) {
    verification.other = { "msvalidate.01": config.seo.bingVerification };
  }

  return {
    metadataBase: new URL(siteUrl(config)),
    // `absolute` bypasses the root layout's title template so the page title is
    // used exactly as written (it already includes the business name).
    title: { absolute: title },
    description,
    applicationName: config.business.name,
    alternates: { canonical },
    robots: p.noindex
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: config.business.name,
      title: ogTitle,
      description: ogDescription,
      images: [{ url: absoluteUrl(config, ogImage), alt: `${config.business.name}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [absoluteUrl(config, ogImage)],
    },
    verification: Object.keys(verification).length ? verification : undefined,
    icons: config.branding.faviconUrl ? { icon: config.branding.faviconUrl } : undefined,
  };
}

/** Metadata for the site root layout — a sensible default; pages override title/description. */
export function buildRootMetadata(config: SiteConfig): Metadata {
  return {
    metadataBase: new URL(siteUrl(config)),
    title: {
      default: resolveTitle(config, "home"),
      template: `%s | ${config.business.name}`,
    },
    description: config.seo.defaultDescription,
  };
}
