/**
 * Turns the live SiteConfig into the assistant's knowledge base.
 *
 * This is what "grounded to the site" means here: the bot's entire vocabulary
 * of facts is built from the same config that renders the pages — services,
 * FAQs, process, projects, service area, hours, and business details. Edit the
 * content in the admin panel (or in `site-config.ts`) and the bot's answers
 * change on the next request. There is no crawl step and no separate index
 * file to keep in sync.
 *
 * Each chunk carries two pieces of text:
 *   - `text`   — what we match against (title + body + a few plain-language
 *                synonyms a visitor might actually type)
 *   - `answer` — the site's own words, which the bot may repeat verbatim
 */
import { activeFaqs, activeProjects, activeServices, activeTestimonials } from "../data";
import type { SiteConfig } from "../types";
import { dayName, formatTime, telHref } from "../utils";
import { buildBm25 } from "./bm25";
import type { BotPersona, KnowledgeBase, KnowledgeChunk } from "./types";

const HOME = "/";
const SERVICES_HREF = "/#services";
const ESTIMATE_HREF = "/#estimate";
const ABOUT_HREF = "/about";
const GALLERY_HREF = "/gallery";

export function buildKnowledgeBase(config: SiteConfig): KnowledgeBase {
  const chunks = buildChunks(config);
  const byId: Record<string, KnowledgeChunk> = {};
  for (const c of chunks) byId[c.id] = c;

  return {
    byId,
    bm25: buildBm25(chunks.map((c) => ({ id: c.id, text: c.text }))),
    persona: buildPersona(config),
  };
}

function buildPersona(config: SiteConfig): BotPersona {
  const b = config.business;
  return {
    businessName: b.name,
    greeting:
      `Hi! I'm the ${b.name} assistant. I can answer questions about our ` +
      `services, service area, and how estimates work — what can I help with?`,
    phone: b.phone,
    telHref: telHref(b.phone),
    email: b.email,
    estimateHref: ESTIMATE_HREF,
    galleryHref: GALLERY_HREF,
    servicesHref: SERVICES_HREF,
    primaryCity: config.serviceArea.primaryCity,
    state: config.serviceArea.state,
    serviceNames: activeServices(config).map((s) => s.name),
    faqQuestions: activeFaqs(config).map((f) => f.question),
    isDemo: config.isDemo,
  };
}

/* --------------------------------------------------------------------------
 * Chunk construction — one section of the site at a time.
 * ----------------------------------------------------------------------- */

function buildChunks(config: SiteConfig): KnowledgeChunk[] {
  return [
    overviewChunk(config),
    ...serviceChunks(config),
    ...faqChunks(config),
    ...processChunks(config),
    ...projectChunks(config),
    ...aboutChunks(config),
    areaChunk(config),
    hoursChunk(config),
    contactChunk(config),
    trustChunk(config),
    reviewsChunk(config),
  ].filter((c): c is KnowledgeChunk => c !== null);
}

function overviewChunk(config: SiteConfig): KnowledgeChunk {
  const b = config.business;
  const answer =
    `${b.name} — ${b.tagline} ${config.hero.subheadline} ` +
    `We've been ${b.primaryService.toLowerCase()} specialists in ${b.city}, ${b.state} since ${b.foundedYear}.`;
  return {
    id: "overview",
    kind: "overview",
    title: b.name,
    text: [
      b.name,
      b.legalName,
      b.tagline,
      b.primaryService,
      config.hero.headline,
      config.hero.subheadline,
      config.seo.defaultDescription,
      "what do you do, who are you, tell me about the company, overview",
    ].join(" "),
    answer: collapse(answer),
    href: HOME,
  };
}

function serviceChunks(config: SiteConfig): KnowledgeChunk[] {
  return activeServices(config).map((s) => ({
    id: `service:${s.id}`,
    kind: "service" as const,
    title: s.name,
    text: [
      s.name,
      s.description,
      "service offering work job do you do can you fix install replace",
    ].join(" "),
    answer: `${s.name} — ${s.description}`,
    href: SERVICES_HREF,
  }));
}

function faqChunks(config: SiteConfig): KnowledgeChunk[] {
  return activeFaqs(config).map((f) => ({
    id: `faq:${f.id}`,
    kind: "faq" as const,
    title: f.question,
    // The question text carries most of the matching signal — visitors phrase
    // their questions much like the FAQ does.
    text: `${f.question} ${f.question} ${f.answer}`,
    answer: f.answer,
    href: HOME,
  }));
}

function processChunks(config: SiteConfig): KnowledgeChunk[] {
  const steps = [...config.process].sort((a, b) => a.order - b.order);
  if (!steps.length) return [];

  const combined: KnowledgeChunk = {
    id: "process:all",
    kind: "process",
    title: "How the project works",
    text: [
      "process steps what happens next how does it work what to expect first step getting started",
      ...steps.map((s) => `${s.title} ${s.description}`),
    ].join(" "),
    answer:
      "Here's how a project runs with us:\n" +
      steps.map((s, i) => `${i + 1}. ${s.title} — ${s.description}`).join("\n"),
    href: HOME,
  };

  return [combined, ...steps.map((s) => ({
    id: `process:${s.id}`,
    kind: "process" as const,
    title: s.title,
    text: `${s.title} ${s.description}`,
    answer: `${s.title} — ${s.description}`,
    href: HOME,
  }))];
}

function projectChunks(config: SiteConfig): KnowledgeChunk[] {
  const projects = activeProjects(config);
  if (!projects.length) return [];

  const index: KnowledgeChunk = {
    id: "project:index",
    kind: "project",
    title: "Recent projects",
    text: [
      "projects gallery photos pictures examples past work portfolio before after case study",
      ...projects.map((p) => `${p.title} ${p.serviceCategory} ${p.city}`),
    ].join(" "),
    answer:
      "Recent projects you can see in the gallery:\n" +
      projects.slice(0, 5).map((p) => `• ${p.title} — ${p.serviceCategory}, ${p.city}`).join("\n"),
    href: GALLERY_HREF,
  };

  return [index, ...projects.map((p) => ({
    id: `project:${p.id}`,
    kind: "project" as const,
    title: p.title,
    text: [p.title, p.serviceCategory, p.city, p.problem, p.work, p.result, p.description].join(" "),
    answer: `${p.title} (${p.city}) — ${p.problem} ${p.work} ${p.result}`,
    href: GALLERY_HREF,
  }))];
}

function aboutChunks(config: SiteConfig): KnowledgeChunk[] {
  const a = config.about;
  const b = config.business;

  const chunks: KnowledgeChunk[] = [
    {
      id: "about:story",
      kind: "about",
      title: `About ${b.name}`,
      text: [
        a.story,
        a.mission,
        a.experience,
        `${b.yearsExperience} years experience founded ${b.foundedYear}`,
        "history how long in business family owned local",
      ].join(" "),
      answer: a.story,
      href: ABOUT_HREF,
    },
    {
      id: "about:owner",
      kind: "about",
      title: `${a.ownerName}, ${a.ownerTitle}`,
      text: [a.ownerName, a.ownerTitle, a.ownerBio, "owner boss who runs the company manager"].join(" "),
      answer: `${a.ownerName} is our ${a.ownerTitle.toLowerCase()}. ${a.ownerBio}`,
      href: ABOUT_HREF,
    },
    {
      id: "about:safety",
      kind: "about",
      title: "Safety & coverage",
      text: [a.safety, "safety insurance liability workers comp crew training risk"].join(" "),
      answer: a.safety,
      href: ABOUT_HREF,
    },
    {
      id: "about:community",
      kind: "about",
      title: "Local & community",
      text: [a.community, "community local neighborhood give back"].join(" "),
      answer: a.community,
      href: ABOUT_HREF,
    },
  ];

  for (const [i, v] of a.values.entries()) {
    chunks.push({
      id: `about:value:${i}`,
      kind: "about",
      title: v.title,
      text: `${v.title} ${v.description} values approach standards how we work`,
      answer: `${v.title} — ${v.description}`,
      href: ABOUT_HREF,
    });
  }

  for (const w of config.whyChooseUs) {
    chunks.push({
      id: `about:why:${w.id}`,
      kind: "about",
      title: w.title,
      text: `${w.title} ${w.description} why choose you different better than competitors`,
      answer: `${w.title} — ${w.description}`,
      href: HOME,
    });
  }

  return chunks;
}

function areaChunk(config: SiteConfig): KnowledgeChunk {
  const a = config.serviceArea;
  const places = [...a.nearbyCities, ...a.counties];
  return {
    id: "area",
    kind: "area",
    title: "Service area",
    text: [
      "service area do you serve cover come out travel located near me location city town county zip",
      a.primaryCity,
      a.state,
      a.zip,
      ...places,
      a.description,
    ].join(" "),
    answer:
      `${a.description} ` +
      `Nearby communities we cover include ${listPhrase(a.nearbyCities)}.`,
    href: HOME,
  };
}

function hoursChunk(config: SiteConfig): KnowledgeChunk {
  const lines = [...config.hours]
    .sort((x, y) => ((x.day + 6) % 7) - ((y.day + 6) % 7)) // Monday first
    .map((h) =>
      h.open && h.close
        ? `${dayName(h.day)}: ${formatTime(h.open)}–${formatTime(h.close)}`
        : `${dayName(h.day)}: Closed`,
    );

  return {
    id: "hours",
    kind: "hours",
    title: "Business hours",
    text: `hours open close when are you open weekend saturday sunday early late schedule office ${lines.join(" ")}`,
    answer: `Our hours are:\n${lines.map((l) => `• ${l}`).join("\n")}`,
    href: HOME,
  };
}

function contactChunk(config: SiteConfig): KnowledgeChunk {
  const b = config.business;
  const address = b.showAddress ? `${b.addressLine}, ${b.city}, ${b.state} ${b.zip}` : "";
  return {
    id: "contact",
    kind: "contact",
    title: "Contact us",
    text: [
      "contact phone number call email reach talk to someone human speak address office where are you located",
      b.phone,
      b.email,
      address,
    ].join(" "),
    answer: collapse(
      `You can call us at ${b.phone} or email ${b.email}. ` +
        (address ? `We're at ${address}. ` : "") +
        `You can also request a free estimate right on this page and we'll get back to you.`,
    ),
    href: ESTIMATE_HREF,
  };
}

function trustChunk(config: SiteConfig): KnowledgeChunk {
  const items = config.trust.filter((t) => t.active).sort((a, b) => a.order - b.order);
  const b = config.business;

  return {
    id: "trust",
    kind: "trust",
    title: "Licensing, insurance & warranty",
    text: [
      "licensed insured bonded license insurance liability workers comp warranty guarantee credentials certified qualifications",
      b.licenseInfo,
      `${b.yearsExperience} years experience`,
      ...items.map((t) => `${t.label} ${t.detail}`),
    ].join(" "),
    answer:
      items.map((t) => `• ${t.label} — ${t.detail}`).join("\n") +
      (b.licenseInfo ? `\n• Credential: ${b.licenseInfo}` : ""),
    href: HOME,
  };
}

function reviewsChunk(config: SiteConfig): KnowledgeChunk | null {
  const reviews = activeTestimonials(config);
  if (!reviews.length) return null;

  const allSample = reviews.every((r) => r.isSample);
  const body = reviews
    .slice(0, 3)
    .map((r) => `“${r.quote}” — ${r.author}, ${r.location}`)
    .join("\n\n");

  return {
    id: "reviews",
    kind: "review",
    title: "What customers say",
    text: [
      "reviews testimonials ratings references what do customers say happy satisfied stars feedback",
      ...reviews.map((r) => `${r.author} ${r.location} ${r.quote}`),
    ].join(" "),
    // Sample content is disclosed rather than passed off as real feedback.
    answer: allSample
      ? `Reviews are shown on the home page. Note that the ones currently published are sample content for this demonstration site:\n\n${body}`
      : body,
    href: HOME,
  };
}

/* ------------------------------- helpers -------------------------------- */

function listPhrase(items: string[]): string {
  if (items.length === 0) return "the surrounding area";
  if (items.length === 1) return items[0]!;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function collapse(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}
