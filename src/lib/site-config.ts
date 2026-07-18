import type { SiteConfig } from "./types";

/**
 * ============================================================================
 * SINGLE SOURCE OF TRUTH — DEMO CONTENT ("Summit Ridge Roofing", fictional)
 * ============================================================================
 *
 * This object seeds the database and is also used as a live fallback when no
 * database is connected (so the site builds and renders with zero credentials).
 *
 * To create a new customer site WITHOUT editing source code, use the admin
 * onboarding wizard — it writes to the database, which overrides these values.
 *
 * These defaults exist so the template is never blank and always demonstrates
 * a complete, professional site. All testimonials, projects, and some trust
 * claims below are clearly marked as SAMPLE demonstration content.
 */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://summitridgeroofing.example.com";

export const defaultSiteConfig: SiteConfig = {
  isDemo: true,

  business: {
    name: "Summit Ridge Roofing",
    legalName: "Summit Ridge Roofing LLC",
    tagline: "Honest roofing done right, the first time.",
    phone: "(262) 555-0147",
    email: "estimates@summitridgeroofing.example.com",
    addressLine: "1420 Birch Street",
    city: "Kenosha",
    state: "WI",
    zip: "53140",
    showAddress: true,
    licenseInfo: "WI Dwelling Contractor Cert. #DEMO-000000 (sample)",
    yearsExperience: 18,
    foundedYear: 2007,
    category: "RoofingContractor",
    primaryService: "Roof Repair & Replacement",
  },

  branding: {
    logoUrl: null,
    faviconUrl: null,
    primaryColor: "#1f2933", // deep charcoal
    secondaryColor: "#0b2545", // navy
    accentColor: "#e07a24", // warm construction orange
    headingFont: "Georgia, 'Times New Roman', serif",
    bodyFont: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  },

  hours: [
    { day: 1, open: "07:00", close: "17:00" },
    { day: 2, open: "07:00", close: "17:00" },
    { day: 3, open: "07:00", close: "17:00" },
    { day: 4, open: "07:00", close: "17:00" },
    { day: 5, open: "07:00", close: "16:00" },
    { day: 6, open: "08:00", close: "12:00" },
    { day: 0, open: null, close: null },
  ],

  social: {
    facebook: "https://facebook.com/",
    instagram: "https://instagram.com/",
    youtube: null,
    linkedin: null,
    x: null,
    googleBusinessProfile: null,
    googleReviewUrl: null,
  },

  serviceArea: {
    primaryCity: "Kenosha",
    state: "WI",
    zip: "53140",
    counties: ["Kenosha County", "Racine County"],
    nearbyCities: ["Racine", "Pleasant Prairie", "Somers", "Sturtevant", "Union Grove"],
    description:
      "We are based in Kenosha and serve homeowners across Kenosha and Racine counties. " +
      "Whether you're in Pleasant Prairie dealing with storm damage or in Racine planning a full " +
      "replacement, we handle the inspection, the paperwork, and the work with the same care we'd " +
      "give our own homes.",
  },

  hero: {
    headline: "Dependable Roof Repair & Replacement in Kenosha, WI",
    subheadline:
      "Locally owned, licensed, and insured. We show up when we say we will, explain your options " +
      "in plain language, and stand behind our work with a written warranty.",
    primaryCtaLabel: "Get a Free Estimate",
    secondaryCtaLabel: "Call Now",
    imageUrl: "/demo/hero-roof.svg",
    imageAlt: "A newly installed asphalt shingle roof on a two-story home under a clear sky.",
  },

  about: {
    story:
      "Summit Ridge Roofing started in 2007 with a single truck and a simple promise: treat every " +
      "roof like it's protecting someone's family — because it is. Over the years we've grown into a " +
      "trusted local crew, but we've kept that promise at the center of everything we do. We're not " +
      "the biggest roofer in the area, and we don't want to be. We want to be the one your neighbor " +
      "recommends.",
    ownerName: "Dave Marchetti",
    ownerTitle: "Owner & Lead Estimator",
    ownerBio:
      "Dave grew up on job sites and has spent nearly two decades on roofs across southeastern " +
      "Wisconsin. He personally walks most estimates so homeowners get straight answers from the " +
      "person accountable for the work.",
    experience:
      "Nearly two decades of hands-on roofing experience across Kenosha and Racine counties, from " +
      "small leak repairs to full tear-offs and replacements.",
    mission:
      "To give homeowners a roof they don't have to think about — installed correctly, explained " +
      "honestly, and backed by people who will still be here next year.",
    values: [
      {
        title: "Do it right, not twice",
        description:
          "We follow manufacturer specs and local code so the job holds up through Wisconsin winters.",
      },
      {
        title: "Plain-language honesty",
        description:
          "We tell you what your roof actually needs — repair or replacement — not what sells best.",
      },
      {
        title: "Respect the property",
        description:
          "We protect landscaping, clean up magnetically for nails, and leave your yard better than we found it.",
      },
    ],
    safety:
      "Every crew member is trained on fall-protection and ladder safety, and we carry general " +
      "liability and workers' compensation coverage so homeowners are never exposed to job-site risk.",
    community:
      "We live and work in the same neighborhoods we serve. You'll see our trucks at the hardware " +
      "store, our kids at the same schools, and our name on the local little-league banner.",
  },

  trust: [
    { id: "t1", label: "Licensed & Insured", detail: "General liability + workers' comp", isSample: true, active: true, order: 1 },
    { id: "t2", label: "Free Estimates", detail: "No-pressure, written quotes", isSample: false, active: true, order: 2 },
    { id: "t3", label: "Workmanship Warranty", detail: "Written warranty on labor", isSample: true, active: true, order: 3 },
    { id: "t4", label: "Locally Owned", detail: "Based in Kenosha since 2007", isSample: false, active: true, order: 4 },
    { id: "t5", label: "18+ Years Experience", detail: "Serving SE Wisconsin", isSample: false, active: true, order: 5 },
  ],

  services: [
    { id: "s1", name: "Roof Replacement", description: "Full tear-off and installation of new asphalt, architectural, or metal roofing, done to manufacturer spec.", icon: "home", active: true, order: 1 },
    { id: "s2", name: "Roof Repair", description: "Targeted fixes for leaks, missing shingles, flashing failures, and storm damage — with an honest repair-vs-replace assessment.", icon: "wrench", active: true, order: 2 },
    { id: "s3", name: "Storm & Hail Damage", description: "Inspections and documentation to help you understand damage and navigate an insurance claim.", icon: "cloud", active: true, order: 3 },
    { id: "s4", name: "Gutter Installation", description: "Seamless gutters and guards sized to move water away from your foundation.", icon: "droplet", active: true, order: 4 },
    { id: "s5", name: "Roof Inspections", description: "Detailed, photo-documented inspections for maintenance, real-estate transactions, or peace of mind.", icon: "search", active: true, order: 5 },
    { id: "s6", name: "Attic Ventilation", description: "Balanced intake and exhaust ventilation to extend roof life and improve energy efficiency.", icon: "wind", active: true, order: 6 },
  ],

  whyChooseUs: [
    { id: "w1", title: "One accountable point of contact", description: "The owner walks your estimate and stays reachable through the whole project.", order: 1 },
    { id: "w2", title: "Straight answers on repair vs. replace", description: "We'll fix what can be fixed instead of pushing a replacement you don't need.", order: 2 },
    { id: "w3", title: "Clean, respectful job sites", description: "Landscape protection and thorough magnetic nail cleanup, every time.", order: 3 },
    { id: "w4", title: "Written warranties you can hold us to", description: "Clear workmanship and manufacturer warranty details in writing before we start.", order: 4 },
  ],

  process: [
    { id: "p1", title: "Free on-site estimate", description: "We inspect your roof, take photos, and walk you through what we find — no pressure, no jargon.", order: 1 },
    { id: "p2", title: "Clear written proposal", description: "You get an itemized quote with material options and warranty details so you can decide with confidence.", order: 2 },
    { id: "p3", title: "Scheduling & prep", description: "We confirm a date, order materials, and protect your landscaping and gutters before work begins.", order: 3 },
    { id: "p4", title: "Professional installation", description: "Our trained crew completes the work to spec, usually in a day or two for most homes.", order: 4 },
    { id: "p5", title: "Cleanup & final walkthrough", description: "We clean up magnetically for nails, haul away debris, and review the finished work with you.", order: 5 },
  ],

  faqs: [
    { id: "f1", question: "How much does a new roof cost?", answer: "It depends on the size and pitch of your roof, the materials you choose, and the condition of the decking underneath. That's why we provide a free, itemized written estimate after inspecting your specific roof rather than quoting a number over the phone.", active: true, order: 1 },
    { id: "f2", question: "Do I actually need a full replacement, or can it be repaired?", answer: "Often a targeted repair is the right call. During your estimate we honestly assess whether a repair will hold up or whether a replacement is the smarter long-term investment, and we explain the reasoning either way.", active: true, order: 2 },
    { id: "f3", question: "Are you licensed and insured?", answer: "Yes. We carry general liability and workers' compensation insurance, and we work under the appropriate state credentials. We're glad to provide documentation before any work begins.", active: true, order: 3 },
    { id: "f4", question: "How long does a roof replacement take?", answer: "Most residential replacements are completed in one to two days, weather permitting. We'll give you a realistic timeline for your specific home in your written proposal.", active: true, order: 4 },
    { id: "f5", question: "Can you help with storm damage and insurance claims?", answer: "We can inspect and document damage with photos to help you understand your roof's condition. We work with your insurer's process, but we never encourage filing a claim for damage that isn't there.", active: true, order: 5 },
    { id: "f6", question: "What areas do you serve?", answer: "We're based in Kenosha and serve homeowners across Kenosha and Racine counties, including Pleasant Prairie, Somers, Racine, Sturtevant, and Union Grove.", active: true, order: 6 },
  ],

  testimonials: [
    { id: "r1", author: "Sample Homeowner", location: "Kenosha, WI", quote: "This is sample testimonial content included to demonstrate the layout. Replace it in the admin panel with a real, honest review from an actual customer.", rating: 5, isSample: true, active: true, order: 1 },
    { id: "r2", author: "Sample Homeowner", location: "Racine, WI", quote: "Sample review text. Real testimonials should describe the customer's actual experience — what the crew did, how communication went, and the result.", rating: 5, isSample: true, active: true, order: 2 },
    { id: "r3", author: "Sample Homeowner", location: "Pleasant Prairie, WI", quote: "Demonstration content only. Once you collect genuine reviews, add them here and consider linking to your Google reviews for credibility.", rating: 5, isSample: true, active: true, order: 3 },
  ],

  projects: [
    {
      id: "g1",
      title: "Full Architectural Shingle Replacement",
      serviceCategory: "Roof Replacement",
      city: "Kenosha, WI",
      problem: "A 22-year-old three-tab roof was curling and had started leaking near the chimney.",
      work: "Complete tear-off, decking inspection and repair, new synthetic underlayment, ice-and-water shield, and architectural shingles.",
      result: "A watertight, better-ventilated roof with a clean, modern look and a transferable manufacturer warranty.",
      description: "Sample project: full architectural shingle replacement on a two-story Kenosha home.",
      completedOn: "2025-09-12",
      featured: true,
      active: true,
      order: 1,
      images: [
        { id: "g1a", url: "/demo/project-1-before.svg", alt: "Aging, curling three-tab shingle roof before replacement.", kind: "before", order: 1 },
        { id: "g1b", url: "/demo/project-1-after.svg", alt: "New charcoal architectural shingle roof after replacement.", kind: "after", order: 2 },
      ],
    },
    {
      id: "g2",
      title: "Storm Damage Repair & Ridge Vent",
      serviceCategory: "Storm & Hail Damage",
      city: "Racine, WI",
      problem: "Wind lifted shingles along the ridge and damaged the old box vents after a summer storm.",
      work: "Replaced damaged shingles, installed a continuous ridge vent, and re-sealed all penetrations.",
      result: "Restored weather protection and improved attic airflow, documented with before/after photos for the homeowner's records.",
      description: "Sample project: targeted storm repair and ventilation upgrade in Racine.",
      completedOn: "2025-07-30",
      featured: true,
      active: true,
      order: 2,
      images: [
        { id: "g2a", url: "/demo/project-2-before.svg", alt: "Wind-damaged shingles along a roof ridge before repair.", kind: "before", order: 1 },
        { id: "g2b", url: "/demo/project-2-after.svg", alt: "Repaired ridge line with new continuous ridge vent installed.", kind: "after", order: 2 },
      ],
    },
    {
      id: "g3",
      title: "Seamless Gutter Installation",
      serviceCategory: "Gutter Installation",
      city: "Pleasant Prairie, WI",
      problem: "Undersized, leaking gutters were dumping water against the foundation.",
      work: "Removed old gutters and installed properly sized seamless aluminum gutters with leaf guards and correct downspout routing.",
      result: "Water now drains cleanly away from the home, protecting the foundation and landscaping.",
      description: "Sample project: seamless gutter replacement in Pleasant Prairie.",
      completedOn: "2025-06-18",
      featured: false,
      active: true,
      order: 3,
      images: [
        { id: "g3a", url: "/demo/project-3-after.svg", alt: "Newly installed seamless aluminum gutters along a home's roofline.", kind: "standard", order: 1 },
      ],
    },
    {
      id: "g4",
      title: "Metal Roof Installation",
      serviceCategory: "Roof Replacement",
      city: "Somers, WI",
      problem: "Homeowners wanted a long-lifespan, low-maintenance roof for their forever home.",
      work: "Installed a standing-seam metal roof with high-temperature underlayment and proper flashing details.",
      result: "A durable, energy-efficient roof designed to last decades with minimal upkeep.",
      description: "Sample project: standing-seam metal roof installation in Somers.",
      completedOn: "2025-05-02",
      featured: false,
      active: true,
      order: 4,
      images: [
        { id: "g4a", url: "/demo/project-4-after.svg", alt: "Standing-seam metal roof installed on a rural home.", kind: "standard", order: 1 },
      ],
    },
  ],

  seo: {
    siteUrl: SITE_URL,
    defaultTitlePattern: "{page} | {business}",
    defaultDescription:
      "Locally owned roof repair and replacement in Kenosha, WI. Licensed, insured, and honest. " +
      "Free written estimates across Kenosha and Racine counties.",
    defaultSocialImage: "/demo/og-default.svg",
    gaMeasurementId: null,
    gtmContainerId: null,
    gscVerification: null,
    bingVerification: null,
    pages: {
      home: {
        title: "Roof Repair & Replacement in Kenosha, WI | Summit Ridge Roofing",
        description:
          "Trusted local roofers in Kenosha, WI. Roof repair, replacement, and storm damage help across " +
          "Kenosha & Racine counties. Licensed, insured, free estimates.",
        socialTitle: null,
        socialDescription: null,
        socialImage: null,
        canonicalOverride: null,
        noindex: false,
        targetPhrase: "roof repair Kenosha WI",
      },
      about: {
        title: "About Summit Ridge Roofing | Local Kenosha Roofers",
        description:
          "Meet the family-owned roofing crew serving Kenosha and Racine counties since 2007. Honest " +
          "assessments, clean job sites, and written warranties.",
        socialTitle: null,
        socialDescription: null,
        socialImage: null,
        canonicalOverride: null,
        noindex: false,
        targetPhrase: "Kenosha roofing company",
      },
      gallery: {
        title: "Roofing Project Gallery | Summit Ridge Roofing, Kenosha WI",
        description:
          "Browse recent roof replacement, repair, and gutter projects across Kenosha and Racine counties " +
          "by Summit Ridge Roofing.",
        socialTitle: null,
        socialDescription: null,
        socialImage: null,
        canonicalOverride: null,
        noindex: false,
        targetPhrase: "roofing projects Kenosha",
      },
    },
  },

  footer: {
    aboutBlurb:
      "Summit Ridge Roofing is a locally owned roofing company serving Kenosha and Racine counties " +
      "with honest repair and replacement work backed by written warranties.",
    legalDisclaimer:
      "Summit Ridge Roofing is a fictional demonstration business. Testimonials, projects, license " +
      "numbers, and some claims shown here are sample content used to demonstrate the Contractor " +
      "Website Starter template.",
  },
};

export type { SiteConfig } from "./types";
