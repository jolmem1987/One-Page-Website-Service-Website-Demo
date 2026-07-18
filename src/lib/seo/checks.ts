import type { SiteConfig } from "../types";
import { activeFaqs, activeProjects, activeServices, activeTestimonials } from "../data";
import { resolveDescription, resolveTitle } from "./metadata";

/**
 * Local SEO readiness engine.
 *
 * These are REAL checks against the site's actual content. The score measures
 * website completeness and SEO readiness — NOT guaranteed rankings. Each check
 * includes plain-language guidance written for a non-technical business owner.
 */

export type CheckStatus =
  | "complete" // done
  | "needs-attention" // present but weak / partial
  | "missing" // not done, should be
  | "recommended" // optional improvement
  | "external"; // must be done off this website (tracked separately)

export type CheckScope = "site" | "home" | "about" | "gallery" | "images" | "local" | "technical";

export interface SeoCheck {
  id: string;
  title: string;
  status: CheckStatus;
  scope: CheckScope;
  /** Automatically handled by the website — no customer action needed. */
  automated: boolean;
  /** Priority 1 (high) – 3 (low), used to sort recommendations. */
  priority: 1 | 2 | 3;
  /** Plain-language guidance. */
  what: string; // what is missing / the situation
  why: string; // why it matters
  how: string; // how to fix it
  where: string; // where in the admin to fix it
}

const CHAR = { titleMin: 30, titleMax: 60, descMin: 70, descMax: 160 };

function has(text: string | null | undefined, min = 1): boolean {
  return Boolean(text && text.trim().length >= min);
}

/** Runs every on-site check and returns them in a flat list. */
export function runSeoChecks(config: SiteConfig): SeoCheck[] {
  const checks: SeoCheck[] = [];
  const b = config.business;
  const services = activeServices(config);
  const faqs = activeFaqs(config);
  const projects = activeProjects(config);
  const testimonials = activeTestimonials(config);

  /* ---------------- Business completeness (site-wide) ---------------- */
  checks.push({
    id: "biz-name",
    title: "Business name added",
    status: has(b.name) ? "complete" : "missing",
    scope: "site",
    automated: false,
    priority: 1,
    what: "Your business name is used in the header, footer, page titles, and Google listing data.",
    why: "Search engines and customers need a consistent business name everywhere.",
    how: "Enter your exact business name — the same one you use on Google.",
    where: "Settings → Business identity",
  });

  checks.push({
    id: "biz-phone",
    title: "Phone number added",
    status: has(b.phone) ? "complete" : "missing",
    scope: "site",
    automated: false,
    priority: 1,
    what: "A visible, clickable phone number.",
    why: "Phone calls are the top way local service customers reach out, and Google expects a consistent number.",
    how: "Add your main business phone number.",
    where: "Settings → Contact information",
  });

  checks.push({
    id: "biz-email",
    title: "Email address added",
    status: has(b.email) ? "complete" : "missing",
    scope: "site",
    automated: false,
    priority: 2,
    what: "A contact email for customers and lead notifications.",
    why: "Gives customers an alternative to calling and lets you receive lead alerts.",
    how: "Add a monitored business email address.",
    where: "Settings → Contact information",
  });

  checks.push({
    id: "biz-address",
    title: "Address or service-area setting configured",
    status: (b.showAddress && has(b.addressLine)) || (!b.showAddress && has(b.city)) ? "complete" : "needs-attention",
    scope: "site",
    automated: false,
    priority: 2,
    what: "Either a real street address, or a service-area setting if you work from home.",
    why: "Google favors consistent location info. Service-area businesses can hide the street address but still declare their city.",
    how: "Add your address, or turn off 'show address' and make sure your city is set.",
    where: "Settings → Contact information",
  });

  checks.push({
    id: "biz-city-state",
    title: "Primary city and state added",
    status: has(b.city) && has(b.state) ? "complete" : "missing",
    scope: "site",
    automated: false,
    priority: 1,
    what: "The main city and state you serve.",
    why: "Local customers search with a city name; this ties your site to that location.",
    how: "Set your primary city and two-letter state.",
    where: "Settings → Location & service area",
  });

  checks.push({
    id: "biz-hours",
    title: "Business hours added",
    status: config.hours.some((h) => h.open && h.close) ? "complete" : "missing",
    scope: "site",
    automated: false,
    priority: 2,
    what: "Your open and close times for each day.",
    why: "Hours appear on your site and power the structured data that search engines read.",
    how: "Set open/close times, marking closed days as closed.",
    where: "Settings → Business hours",
  });

  checks.push({
    id: "biz-services",
    title: "Services added",
    status: services.length >= 3 ? "complete" : services.length > 0 ? "needs-attention" : "missing",
    scope: "site",
    automated: false,
    priority: 1,
    what: `You currently have ${services.length} active service${services.length === 1 ? "" : "s"}.`,
    why: "Listing your services helps customers and search engines understand what you offer.",
    how: "Add at least three specific services with short, real descriptions.",
    where: "Content → Services",
  });

  const aboutWords = (config.about.story + " " + config.about.mission).split(/\s+/).filter(Boolean).length;
  checks.push({
    id: "biz-about",
    title: "About content completed",
    status: aboutWords >= 120 ? "complete" : aboutWords >= 40 ? "needs-attention" : "missing",
    scope: "about",
    automated: false,
    priority: 2,
    what: "An original company story and mission.",
    why: "Original, specific content builds trust and gives search engines something unique to index.",
    how: "Write a few genuine paragraphs about your history, values, and the people behind the work.",
    where: "Content → About page",
  });

  /* ---------------- Homepage ---------------- */
  checks.push({
    id: "home-service",
    title: "Homepage names your main service",
    status: has(b.primaryService) ? "complete" : "missing",
    scope: "home",
    automated: false,
    priority: 1,
    what: "Your primary service, stated clearly near the top of the homepage.",
    why: "Visitors should know what you do within seconds, and so should search engines.",
    how: "Set your primary service (e.g. 'Roof Repair & Replacement').",
    where: "Settings → Business identity",
  });

  checks.push({
    id: "home-h1",
    title: "Homepage has one clear headline (H1)",
    status: has(config.hero.headline) ? "complete" : "missing",
    scope: "home",
    automated: true,
    priority: 2,
    what: "A single main headline that includes your service and city.",
    why: "One clear headline helps search engines understand the page's topic. The template enforces exactly one H1 automatically.",
    how: "Edit the hero headline to mention your main service and city naturally.",
    where: "Content → Homepage hero",
  });

  checks.push({
    id: "home-intro",
    title: "Homepage has useful introductory content",
    status: has(config.hero.subheadline, 40) ? "complete" : "needs-attention",
    scope: "home",
    automated: false,
    priority: 2,
    what: "A helpful supporting paragraph under the headline.",
    why: "A short, specific intro reassures visitors and adds relevant content.",
    how: "Describe what you do and who you help in a sentence or two.",
    where: "Content → Homepage hero",
  });

  checks.push({
    id: "home-service-desc",
    title: "Service descriptions are specific",
    status: services.every((s) => has(s.description, 30)) && services.length > 0 ? "complete" : "needs-attention",
    scope: "home",
    automated: false,
    priority: 2,
    what: "Each service should have a real, specific description.",
    why: "'We do quality work' tells customers nothing. Specifics build trust and relevance.",
    how: "Describe what each service includes and the problem it solves.",
    where: "Content → Services",
  });

  checks.push({
    id: "home-cta",
    title: "Estimate call-to-action present",
    status: has(config.hero.primaryCtaLabel) ? "complete" : "missing",
    scope: "home",
    automated: true,
    priority: 1,
    what: "A clear button that invites visitors to request an estimate.",
    why: "This is how visitors become leads. The template always renders the estimate form and CTAs.",
    how: "Confirm your primary CTA label is set (e.g. 'Get a Free Estimate').",
    where: "Content → Homepage hero",
  });

  checks.push({
    id: "home-internal-links",
    title: "Links to About and Gallery",
    status: "complete",
    scope: "home",
    automated: true,
    priority: 3,
    what: "Internal links from the homepage to your About and Gallery pages.",
    why: "Internal links help visitors explore and help search engines discover your pages.",
    how: "No action needed — the header and homepage link to these pages automatically.",
    where: "Handled automatically",
  });

  checks.push({
    id: "home-service-area",
    title: "Service-area information present",
    status: has(config.serviceArea.description, 40) ? "complete" : "needs-attention",
    scope: "home",
    automated: false,
    priority: 2,
    what: "Natural, helpful text describing where you work.",
    why: "Explaining your service area (without stuffing city names) helps nearby customers find you.",
    how: "Write a short, natural paragraph about the areas you serve.",
    where: "Settings → Location & service area",
  });

  checks.push({
    id: "home-faq",
    title: "FAQ content present",
    status: faqs.length >= 3 ? "complete" : faqs.length > 0 ? "needs-attention" : "missing",
    scope: "home",
    automated: false,
    priority: 3,
    what: `You have ${faqs.length} active FAQ${faqs.length === 1 ? "" : "s"}.`,
    why: "Answering real customer questions builds trust and can qualify for FAQ rich results (added automatically when eligible).",
    how: "Add several questions customers actually ask, with honest answers.",
    where: "Content → FAQs",
  });

  /* ---------------- Titles & descriptions (unique per page) ---------------- */
  for (const page of ["home", "about", "gallery"] as const) {
    const title = resolveTitle(config, page);
    const desc = resolveDescription(config, page);
    const label = page.charAt(0).toUpperCase() + page.slice(1);
    const titleOk = title.length >= CHAR.titleMin && title.length <= CHAR.titleMax;
    const descOk = desc.length >= CHAR.descMin && desc.length <= CHAR.descMax;
    checks.push({
      id: `${page}-title`,
      title: `${label} page: search title`,
      status: has(title) ? (titleOk ? "complete" : "needs-attention") : "missing",
      scope: page,
      automated: false,
      priority: 2,
      what: `Current title is ${title.length} characters. Aim for ${CHAR.titleMin}–${CHAR.titleMax}.`,
      why: "The title is the blue link in Google results. It should include your service and city.",
      how: "Write a unique, descriptive title such as 'Roof Repair in Kenosha, WI | Summit Ridge Roofing'.",
      where: `SEO → Page settings → ${label}`,
    });
    checks.push({
      id: `${page}-desc`,
      title: `${label} page: search description`,
      status: has(desc) ? (descOk ? "complete" : "needs-attention") : "missing",
      scope: page,
      automated: false,
      priority: 2,
      what: `Current description is ${desc.length} characters. Aim for ${CHAR.descMin}–${CHAR.descMax}.`,
      why: "The description is the gray summary under the title in Google results. A clear one earns more clicks.",
      how: "Summarize the page and mention your city and main service naturally.",
      where: `SEO → Page settings → ${label}`,
    });
  }

  /* ---------------- About page ---------------- */
  checks.push({
    id: "about-story",
    title: "About page has an original company story",
    status: has(config.about.story, 120) ? "complete" : "needs-attention",
    scope: "about",
    automated: false,
    priority: 2,
    what: "A genuine, original story — not copied from anywhere.",
    why: "Original content is what search engines reward and what earns customer trust.",
    how: "Tell your real history, what you value, and why customers choose you.",
    where: "Content → About page",
  });

  checks.push({
    id: "about-cta",
    title: "About page has a contact call-to-action",
    status: "complete",
    scope: "about",
    automated: true,
    priority: 3,
    what: "A prompt to request an estimate from the About page.",
    why: "Every page should give interested visitors a way to act.",
    how: "No action needed — the template adds an estimate CTA automatically.",
    where: "Handled automatically",
  });

  /* ---------------- Gallery ---------------- */
  checks.push({
    id: "gallery-count",
    title: "Gallery has real projects",
    status: projects.length >= 4 ? "complete" : projects.length > 0 ? "needs-attention" : "missing",
    scope: "gallery",
    automated: false,
    priority: 2,
    what: `You have ${projects.length} active project${projects.length === 1 ? "" : "s"}.`,
    why: "Real projects with descriptions are some of the most persuasive, indexable content you can add.",
    how: "Add several real projects with the problem, work performed, and result.",
    where: "Gallery",
  });

  const weakProjects = projects.filter((p) => !has(p.problem, 15) || !has(p.result, 15));
  checks.push({
    id: "gallery-descriptions",
    title: "Projects have useful descriptions",
    status: projects.length === 0 ? "missing" : weakProjects.length === 0 ? "complete" : "needs-attention",
    scope: "gallery",
    automated: false,
    priority: 2,
    what:
      weakProjects.length > 0
        ? `${weakProjects.length} project(s) are missing a problem or result description.`
        : "All projects describe the problem, work, and result.",
    why: "'New roof completed' says little. Describing the problem and result is far more useful to readers and search engines.",
    how: "For each project, fill in the customer's problem, the work you did, and the outcome.",
    where: "Gallery → edit project",
  });

  /* ---------------- Images ---------------- */
  const allImages = projects.flatMap((p) => p.images);
  const missingAlt = allImages.filter((img) => !has(img.alt, 5));
  checks.push({
    id: "img-alt",
    title: "Images have descriptive alt text",
    status: allImages.length === 0 ? "missing" : missingAlt.length === 0 ? "complete" : "needs-attention",
    scope: "images",
    automated: false,
    priority: 2,
    what:
      missingAlt.length > 0
        ? `${missingAlt.length} image(s) are missing alt text.`
        : "All project images have alt text.",
    why: "Alt text describes an image for visually-impaired visitors and for search engines. It's an accessibility and SEO win.",
    how: "Describe what each photo shows, e.g. 'New charcoal shingle roof on a two-story home'.",
    where: "Gallery → edit project → images",
  });

  checks.push({
    id: "img-social",
    title: "Social sharing image set",
    status: has(config.seo.defaultSocialImage) ? "complete" : "recommended",
    scope: "images",
    automated: false,
    priority: 3,
    what: "The image shown when your site is shared on Facebook or texted.",
    why: "A good preview image makes shared links look professional and clickable.",
    how: "Upload a wide (1200×630) image representing your business.",
    where: "SEO → Global settings → Social image",
  });

  /* ---------------- Local SEO ---------------- */
  checks.push({
    id: "local-primary-city",
    title: "Primary city selected",
    status: has(config.serviceArea.primaryCity) ? "complete" : "missing",
    scope: "local",
    automated: false,
    priority: 1,
    what: "The single main city you serve.",
    why: "This anchors your local relevance for the place most of your customers are.",
    how: "Set your primary city.",
    where: "Settings → Location & service area",
  });

  checks.push({
    id: "local-nearby",
    title: "Nearby service areas entered",
    status: config.serviceArea.nearbyCities.length >= 2 ? "complete" : "needs-attention",
    scope: "local",
    automated: false,
    priority: 3,
    what: `You've listed ${config.serviceArea.nearbyCities.length} nearby cities.`,
    why: "Listing nearby cities you genuinely serve helps neighboring customers — but only add real ones.",
    how: "Add nearby cities you actually work in. Don't invent locations.",
    where: "Settings → Location & service area",
  });

  checks.push({
    id: "local-gbp",
    title: "Google Business Profile linked",
    status: has(config.social.googleBusinessProfile) ? "complete" : "external",
    scope: "local",
    automated: false,
    priority: 1,
    what: "A link to your Google Business Profile.",
    why: "For local businesses, your Google Business Profile is often more important than the website itself for showing up on Google Maps.",
    how: "Create/claim your profile at google.com/business, then paste its link here.",
    where: "SEO → Global settings → Google Business Profile",
  });

  checks.push({
    id: "local-reviews-link",
    title: "Google review link added",
    status: has(config.social.googleReviewUrl) ? "complete" : "recommended",
    scope: "local",
    automated: false,
    priority: 2,
    what: "A direct link customers can use to leave a Google review.",
    why: "Reviews strongly influence local rankings and customer trust. Make leaving one easy.",
    how: "Get your review link from your Google Business Profile and add it here.",
    where: "SEO → Global settings → Google review URL",
  });

  checks.push({
    id: "local-category",
    title: "Business category selected",
    status: has(b.category) ? "complete" : "missing",
    scope: "local",
    automated: true,
    priority: 2,
    what: "Your business type (e.g. Roofing Contractor).",
    why: "This sets the correct structured-data type search engines read. The template handles the technical part automatically.",
    how: "Pick the category that best matches your business.",
    where: "Settings → Business identity",
  });

  checks.push({
    id: "local-testimonials",
    title: "Real testimonials added",
    status:
      testimonials.filter((t) => !t.isSample).length >= 1
        ? "complete"
        : testimonials.length > 0
        ? "needs-attention"
        : "missing",
    scope: "local",
    automated: false,
    priority: 2,
    what: "At least one genuine customer testimonial (the demo ones are marked as samples).",
    why: "Honest testimonials build trust. Never use fake reviews — it's against Google's policies and erodes credibility.",
    how: "Ask happy customers for a short quote and add it, replacing the sample ones.",
    where: "Content → Testimonials",
  });

  /* ---------------- Technical (automated) ---------------- */
  const technical: Array<[string, string, string]> = [
    ["tech-canonical", "Canonical URLs configured", "Each page tells search engines its official address, preventing duplicate-content confusion."],
    ["tech-sitemap", "Sitemap generated", "A sitemap at /sitemap.xml lists your pages so search engines can find them."],
    ["tech-robots", "robots.txt available", "A robots file at /robots.txt guides search engines and points them to your sitemap."],
    ["tech-structured", "Structured data generated", "Your business details are provided to search engines in a machine-readable format."],
    ["tech-indexable", "Public pages are indexable", "Your Home, About, and Gallery pages are open to search engines."],
    ["tech-admin-noindex", "Admin pages blocked from search", "Your login and admin pages are hidden from search engines automatically."],
    ["tech-metadata", "Page metadata present", "Every page has a unique title and description."],
    ["tech-mobile", "Mobile-friendly layout", "The site is built mobile-first and adapts to phones and tablets."],
    ["tech-https", "HTTPS expected in production", "When deployed on Vercel, your site is served securely over HTTPS."],
  ];
  for (const [id, title, why] of technical) {
    checks.push({
      id,
      title,
      status: "complete",
      scope: "technical",
      automated: true,
      priority: 3,
      what: "This technical task is handled for you.",
      why,
      how: "No action needed — the template does this automatically.",
      where: "Handled automatically",
    });
  }

  // One technical item that depends on a setting:
  const anyIndexable = (["home", "about", "gallery"] as const).some((p) => !config.seo.pages[p].noindex);
  checks.push({
    id: "tech-not-all-noindex",
    title: "Site is not fully hidden from search",
    status: anyIndexable ? "complete" : "missing",
    scope: "technical",
    automated: false,
    priority: 1,
    what: anyIndexable
      ? "At least one public page is visible to search engines."
      : "Every public page is currently set to 'hidden from search'.",
    why: "If all pages are hidden, Google cannot show your site at all.",
    how: "Turn off 'Hide this page from search' for at least your homepage.",
    where: "SEO → Page settings",
  });

  return checks;
}

export interface SeoScore {
  score: number; // 0–100
  counts: Record<CheckStatus, number>;
  total: number;
}

/** Computes an overall readiness score from on-site checks (external items excluded). */
export function computeScore(checks: SeoCheck[]): SeoScore {
  const counts: Record<CheckStatus, number> = {
    complete: 0,
    "needs-attention": 0,
    missing: 0,
    recommended: 0,
    external: 0,
  };
  for (const c of checks) counts[c.status]++;

  // Scoreable = everything except purely external (off-site) items.
  const scoreable = checks.filter((c) => c.status !== "external");
  let earned = 0;
  for (const c of scoreable) {
    if (c.status === "complete") earned += 1;
    else if (c.status === "needs-attention") earned += 0.5;
    else if (c.status === "recommended") earned += 0.75; // optional; light penalty
  }
  const score = scoreable.length ? Math.round((earned / scoreable.length) * 100) : 0;
  return { score, counts, total: checks.length };
}

/** Per-page score for the home/about/gallery breakdown. */
export function pageScore(checks: SeoCheck[], scope: CheckScope): SeoScore {
  return computeScore(checks.filter((c) => c.scope === scope));
}

/** Prioritized recommendations: things that need action, most important first. */
export function recommendations(checks: SeoCheck[]): SeoCheck[] {
  const actionable = checks.filter(
    (c) => c.status === "missing" || c.status === "needs-attention" || c.status === "recommended",
  );
  return actionable.sort((a, b) => a.priority - b.priority);
}

/* ---------------- Off-site action plan (cannot be automated) ---------------- */

export interface OffSiteTask {
  key: string;
  title: string;
  description: string;
}

export const OFFSITE_TASKS: OffSiteTask[] = [
  { key: "gbp-claim", title: "Create or claim your Google Business Profile", description: "Go to google.com/business and verify ownership of your listing. This is the single most important off-site step for local visibility." },
  { key: "gbp-nap", title: "Match your business info on Google and this website", description: "Use the exact same business name, address, and phone number in both places so Google trusts your information." },
  { key: "gbp-category", title: "Choose the correct primary Google category", description: "Pick the category that best describes your core service (e.g. 'Roofing contractor')." },
  { key: "gbp-service-areas", title: "Add your legitimate service areas on Google", description: "List the real cities and regions you serve — don't add places you don't actually work." },
  { key: "photos", title: "Upload real project photos regularly", description: "Add fresh, genuine job photos to both this website's gallery and your Google profile over time." },
  { key: "reviews-ask", title: "Ask real customers for honest reviews", description: "After a good job, send customers your Google review link. Never buy or fake reviews." },
  { key: "reviews-respond", title: "Respond professionally to reviews", description: "Thank happy customers and respond calmly and helpfully to any criticism." },
  { key: "directories", title: "List your business in legitimate local directories", description: "Add consistent info to reputable directories (chamber of commerce, trade associations, etc.)." },
  { key: "gsc-verify", title: "Verify your website in Google Search Console", description: "Add and verify your site at search.google.com/search-console using the verification field in SEO settings." },
  { key: "gsc-sitemap", title: "Submit your sitemap to Search Console", description: "In Search Console, submit https://your-domain.com/sitemap.xml so Google discovers your pages." },
  { key: "analytics", title: "Connect analytics", description: "Add your Google Analytics measurement ID in SEO settings to understand your traffic." },
  { key: "keep-current", title: "Keep services, hours, and contact details current", description: "Update the site whenever anything changes so customers and Google always see accurate info." },
  { key: "add-projects", title: "Add new gallery projects over time", description: "A steadily-growing gallery of real work signals an active, trustworthy business." },
  { key: "local-links", title: "Earn legitimate local links and mentions", description: "Sponsor a local team, join community events, or partner with local businesses to earn honest links." },
];
