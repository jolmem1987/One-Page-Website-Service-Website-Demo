/**
 * Shared domain types for the Contractor Website Starter.
 *
 * These describe the shape of all customer-editable content. The demo config
 * in `site-config.ts` provides typed defaults; the database stores the live,
 * per-deployment values; and the data-access layer returns one or the other.
 */

export type BusinessCategory =
  | "RoofingContractor"
  | "HVACBusiness"
  | "Plumber"
  | "Electrician"
  | "GeneralContractor"
  | "LandscapingBusiness"
  | "HousePainter"
  | "Locksmith"
  | "HomeAndConstructionBusiness"
  | "CleaningService"
  | "LocalBusiness";

/** Maps our friendly category to the schema.org LocalBusiness subtype. */
export const BUSINESS_CATEGORY_LABELS: Record<BusinessCategory, string> = {
  RoofingContractor: "Roofing Contractor",
  HVACBusiness: "HVAC Company",
  Plumber: "Plumber",
  Electrician: "Electrician",
  GeneralContractor: "General Contractor",
  LandscapingBusiness: "Landscaper",
  HousePainter: "Painter",
  Locksmith: "Locksmith / Handyman",
  HomeAndConstructionBusiness: "Concrete / Construction",
  CleaningService: "Cleaning Company",
  LocalBusiness: "Other Local Service Business",
};

export interface BrandingSettings {
  logoUrl: string | null;
  faviconUrl: string | null;
  /** sRGB hex values, e.g. "#1f2933". Converted to CSS variables at runtime. */
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  /** Safe, widely supported font stacks selected from a fixed list. */
  headingFont: string;
  bodyFont: string;
}

export interface BusinessHours {
  /** 0 = Sunday ... 6 = Saturday */
  day: number;
  /** "09:00" 24h format, or null when closed. */
  open: string | null;
  close: string | null;
}

export interface SocialLinks {
  facebook: string | null;
  instagram: string | null;
  youtube: string | null;
  linkedin: string | null;
  x: string | null;
  googleBusinessProfile: string | null;
  googleReviewUrl: string | null;
}

export interface ServiceArea {
  primaryCity: string;
  state: string; // 2-letter code, e.g. "WI"
  zip: string;
  counties: string[];
  nearbyCities: string[];
  /** Natural, helpful service-area copy. Not a keyword list. */
  description: string;
}

export interface TrustStatement {
  id: string;
  label: string; // e.g. "Licensed & Insured"
  detail: string; // short supporting line
  /** Sample/demo claims are flagged so they are clearly disclosed. */
  isSample: boolean;
  active: boolean;
  order: number;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  icon: string; // icon key (see components/ui/ServiceIcon)
  active: boolean;
  order: number;
}

export interface ProcessStep {
  id: string;
  title: string;
  description: string;
  order: number;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  active: boolean;
  order: number;
}

export interface Testimonial {
  id: string;
  author: string;
  location: string;
  quote: string;
  /** Optional 1-5 rating. Only used for display, never for rating structured data unless verified. */
  rating: number | null;
  /** Sample testimonials are clearly disclosed and never emitted as review schema. */
  isSample: boolean;
  active: boolean;
  order: number;
}

export interface GalleryImage {
  id: string;
  url: string;
  alt: string;
  /** "before" | "after" | "standard" */
  kind: "before" | "after" | "standard";
  order: number;
}

export interface GalleryProject {
  id: string;
  title: string;
  serviceCategory: string;
  city: string;
  /** Problem or customer need. */
  problem: string;
  /** Work completed. */
  work: string;
  /** Result / outcome. */
  result: string;
  description: string; // short public description
  completedOn: string | null; // ISO date
  featured: boolean;
  active: boolean;
  order: number;
  images: GalleryImage[];
}

export interface HeroContent {
  headline: string;
  subheadline: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  imageUrl: string;
  imageAlt: string;
}

export interface AboutContent {
  story: string;
  ownerName: string;
  ownerTitle: string;
  ownerBio: string;
  experience: string;
  mission: string;
  values: { title: string; description: string }[];
  safety: string;
  community: string;
}

export interface WhyChooseUsPoint {
  id: string;
  title: string;
  description: string;
  order: number;
}

export interface PageSeo {
  title: string;
  description: string;
  socialTitle: string | null;
  socialDescription: string | null;
  socialImage: string | null;
  canonicalOverride: string | null;
  noindex: boolean;
  targetPhrase: string | null;
}

export interface SeoSettings {
  siteUrl: string;
  defaultTitlePattern: string; // e.g. "{page} | {business}"
  defaultDescription: string;
  defaultSocialImage: string | null;
  gaMeasurementId: string | null;
  gtmContainerId: string | null;
  gscVerification: string | null;
  bingVerification: string | null;
  pages: {
    home: PageSeo;
    about: PageSeo;
    gallery: PageSeo;
  };
}

export interface BusinessInfo {
  name: string;
  legalName: string;
  tagline: string;
  phone: string;
  email: string;
  addressLine: string;
  city: string;
  state: string;
  zip: string;
  /** Whether the physical address should be shown publicly (service-area businesses may hide it). */
  showAddress: boolean;
  licenseInfo: string;
  yearsExperience: number;
  foundedYear: number;
  category: BusinessCategory;
  primaryService: string;
}

export interface FooterContent {
  aboutBlurb: string;
  legalDisclaimer: string;
}

/** The complete site configuration — the single source of truth. */
export interface SiteConfig {
  business: BusinessInfo;
  branding: BrandingSettings;
  hours: BusinessHours[];
  social: SocialLinks;
  serviceArea: ServiceArea;
  hero: HeroContent;
  about: AboutContent;
  trust: TrustStatement[];
  services: Service[];
  whyChooseUs: WhyChooseUsPoint[];
  process: ProcessStep[];
  faqs: Faq[];
  testimonials: Testimonial[];
  projects: GalleryProject[];
  seo: SeoSettings;
  footer: FooterContent;
  /** When true, a tasteful demonstration disclaimer is shown site-wide. */
  isDemo: boolean;
}
