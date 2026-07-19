import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type {
  AboutContent,
  BrandingSettings,
  BusinessHours,
  BusinessInfo,
  FooterContent,
  HeroContent,
  SeoSettings,
  ServiceArea,
  SocialLinks,
  TrustStatement,
  WhyChooseUsPoint,
} from "../types";

/* ============================ ENUMS ============================ */

export const leadStatusEnum = pgEnum("lead_status", [
  "NEW",
  "CONTACTED",
  "FOLLOW_UP",
  "ESTIMATE_SCHEDULED",
  "ESTIMATE_SENT",
  "WON",
  "LOST",
  "SPAM",
  "ARCHIVED",
]);

export const contactMethodEnum = pgEnum("contact_method", ["PHONE", "EMAIL", "TEXT"]);

export const activityTypeEnum = pgEnum("activity_type", [
  "NOTE",
  "CALL",
  "EMAIL",
  "ESTIMATE",
  "STATUS_CHANGE",
  "FOLLOW_UP_SET",
  "SYSTEM",
]);

export const emailStatusEnum = pgEnum("email_status", ["DRAFT", "SENT", "FAILED"]);

/* ============================ MEDIA ============================ */

/**
 * Uploaded images stored directly in Postgres, so the admin can upload photos
 * with no external object store (WordPress-style, self-contained). Bytes are
 * base64-encoded in `data` and served by the /api/media/[id] route. Keep
 * uploads reasonably sized (a few MB max) to stay within DB limits.
 */
export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  data: text("data").notNull(),
  contentType: text("content_type").notNull(),
  filename: text("filename"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ============================ AUTH ============================ */

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull().default("Administrator"),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Server-side sessions. The cookie stores an opaque token; only its hash lives here. */
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("sessions_user_idx").on(t.userId),
    expiresIdx: index("sessions_expires_idx").on(t.expiresAt),
  }),
);

/* ============================ LEADS ============================ */

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    location: text("location"), // address or city
    serviceRequested: text("service_requested"),
    preferredContact: contactMethodEnum("preferred_contact").notNull().default("PHONE"),
    message: text("message"),
    consent: boolean("consent").notNull().default(false),
    status: leadStatusEnum("status").notNull().default("NEW"),
    estimatedValueCents: integer("estimated_value_cents"),
    followUpDate: date("follow_up_date"),
    source: text("source").notNull().default("website"),
    ipHash: text("ip_hash"), // hashed, for rate-limiting/spam signal only
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index("leads_status_idx").on(t.status),
    createdIdx: index("leads_created_idx").on(t.createdAt),
    followUpIdx: index("leads_follow_up_idx").on(t.followUpDate),
  }),
);

export const leadActivities = pgTable(
  "lead_activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    type: activityTypeEnum("type").notNull().default("NOTE"),
    body: text("body").notNull(),
    createdBy: uuid("created_by").references(() => adminUsers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    leadIdx: index("lead_activities_lead_idx").on(t.leadId),
  }),
);

export const emailMessages = pgTable(
  "email_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    toEmail: text("to_email").notNull(),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    status: emailStatusEnum("status").notNull().default("DRAFT"),
    providerId: text("provider_id"), // id returned by the email provider on success
    error: text("error"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    leadIdx: index("email_messages_lead_idx").on(t.leadId),
  }),
);

export const emailTemplates = pgTable("email_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ==================== SITE SETTINGS (single row) ==================== */

/**
 * The large, structured configuration blocks are stored as typed JSONB on a
 * single settings row. Collections that benefit from ordering and indexing
 * (services, FAQs, projects, etc.) are normalized into their own tables below.
 * Together they form one source of truth for the whole deployment.
 */
export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().default(1), // always a single row (id = 1)
  isDemo: boolean("is_demo").notNull().default(true),
  business: jsonb("business").$type<BusinessInfo>().notNull(),
  branding: jsonb("branding").$type<BrandingSettings>().notNull(),
  hours: jsonb("hours").$type<BusinessHours[]>().notNull(),
  social: jsonb("social").$type<SocialLinks>().notNull(),
  serviceArea: jsonb("service_area").$type<ServiceArea>().notNull(),
  hero: jsonb("hero").$type<HeroContent>().notNull(),
  about: jsonb("about").$type<AboutContent>().notNull(),
  trust: jsonb("trust").$type<TrustStatement[]>().notNull(),
  whyChooseUs: jsonb("why_choose_us").$type<WhyChooseUsPoint[]>().notNull(),
  footer: jsonb("footer").$type<FooterContent>().notNull(),
  seo: jsonb("seo").$type<SeoSettings>().notNull(),
  onboardingStep: integer("onboarding_step").notNull().default(0),
  onboardingComplete: boolean("onboarding_complete").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ==================== CONTENT COLLECTIONS ==================== */

export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    icon: text("icon").notNull().default("wrench"),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ orderIdx: index("services_order_idx").on(t.sortOrder) }),
);

export const processSteps = pgTable(
  "process_steps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ orderIdx: index("process_steps_order_idx").on(t.sortOrder) }),
);

export const faqs = pgTable(
  "faqs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    question: text("question").notNull(),
    answer: text("answer").notNull().default(""),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ orderIdx: index("faqs_order_idx").on(t.sortOrder) }),
);

export const testimonials = pgTable(
  "testimonials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    author: text("author").notNull(),
    location: text("location").notNull().default(""),
    quote: text("quote").notNull(),
    rating: integer("rating"),
    isSample: boolean("is_sample").notNull().default(false),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ orderIdx: index("testimonials_order_idx").on(t.sortOrder) }),
);

export const galleryProjects = pgTable(
  "gallery_projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    serviceCategory: text("service_category").notNull().default(""),
    city: text("city").notNull().default(""),
    problem: text("problem").notNull().default(""),
    work: text("work").notNull().default(""),
    result: text("result").notNull().default(""),
    description: text("description").notNull().default(""),
    completedOn: date("completed_on"),
    featured: boolean("featured").notNull().default(false),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    orderIdx: index("gallery_projects_order_idx").on(t.sortOrder),
    featuredIdx: index("gallery_projects_featured_idx").on(t.featured),
  }),
);

export const galleryImages = pgTable(
  "gallery_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => galleryProjects.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    alt: text("alt").notNull().default(""),
    kind: text("kind").notNull().default("standard"), // before | after | standard
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => ({ projectIdx: index("gallery_images_project_idx").on(t.projectId) }),
);

/* ==================== EXTERNAL SEO CHECKLIST ==================== */

/** Off-site tasks the owner completes (Google Business Profile, Search Console, etc.). */
export const seoChecklistProgress = pgTable("seo_checklist_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskKey: text("task_key").notNull().unique(),
  completed: boolean("completed").notNull().default(false),
  notes: text("notes"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ============================ RELATIONS ============================ */

export const leadsRelations = relations(leads, ({ many }) => ({
  activities: many(leadActivities),
  emails: many(emailMessages),
}));

export const leadActivitiesRelations = relations(leadActivities, ({ one }) => ({
  lead: one(leads, { fields: [leadActivities.leadId], references: [leads.id] }),
}));

export const galleryProjectsRelations = relations(galleryProjects, ({ many }) => ({
  images: many(galleryImages),
}));

export const galleryImagesRelations = relations(galleryImages, ({ one }) => ({
  project: one(galleryProjects, {
    fields: [galleryImages.projectId],
    references: [galleryProjects.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(adminUsers, { fields: [sessions.userId], references: [adminUsers.id] }),
}));

// Convenience type exports for the app layer.
export type LeadRow = typeof leads.$inferSelect;
export type LeadActivityRow = typeof leadActivities.$inferSelect;
export type EmailMessageRow = typeof emailMessages.$inferSelect;
export type SiteSettingsRow = typeof siteSettings.$inferSelect;
export type AdminUserRow = typeof adminUsers.$inferSelect;
