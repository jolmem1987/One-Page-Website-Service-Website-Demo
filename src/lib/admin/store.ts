import "server-only";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { getDb } from "../db";
import * as schema from "../db/schema";
import { defaultSiteConfig } from "../site-config";
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

/**
 * Centralized data-store for admin mutations. All database writes go through
 * here so behavior is consistent. Every function tolerates a missing database
 * by throwing a friendly error the actions layer converts into UI feedback.
 */

export class NoDatabaseError extends Error {
  constructor() {
    super("No database is connected. Set DATABASE_URL to save changes.");
    this.name = "NoDatabaseError";
  }
}

function db() {
  const d = getDb();
  if (!d) throw new NoDatabaseError();
  return d;
}

/** Ensures the single settings row exists, seeding it from the demo config. */
export async function ensureSettings() {
  const d = db();
  const rows = await d.select().from(schema.siteSettings).where(eq(schema.siteSettings.id, 1)).limit(1);
  if (rows[0]) return rows[0];
  const c = defaultSiteConfig;
  const [row] = await d
    .insert(schema.siteSettings)
    .values({
      id: 1,
      isDemo: c.isDemo,
      business: c.business,
      branding: c.branding,
      hours: c.hours,
      social: c.social,
      serviceArea: c.serviceArea,
      hero: c.hero,
      about: c.about,
      trust: c.trust,
      whyChooseUs: c.whyChooseUs,
      footer: c.footer,
      seo: c.seo,
    })
    .returning();
  return row;
}

async function patch(values: Partial<typeof schema.siteSettings.$inferInsert>) {
  const d = db();
  await ensureSettings();
  await d
    .update(schema.siteSettings)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(schema.siteSettings.id, 1));
}

/* ---------- Settings block updaters ---------- */
export const saveBusiness = (v: BusinessInfo) => patch({ business: v });
export const saveBranding = (v: BrandingSettings) => patch({ branding: v });
export const saveHours = (v: BusinessHours[]) => patch({ hours: v });
export const saveSocial = (v: SocialLinks) => patch({ social: v });
export const saveServiceArea = (v: ServiceArea) => patch({ serviceArea: v });
export const saveHero = (v: HeroContent) => patch({ hero: v });
export const saveAbout = (v: AboutContent) => patch({ about: v });
export const saveTrust = (v: TrustStatement[]) => patch({ trust: v });
export const saveWhyChooseUs = (v: WhyChooseUsPoint[]) => patch({ whyChooseUs: v });
export const saveFooter = (v: FooterContent) => patch({ footer: v });
export const saveSeo = (v: SeoSettings) => patch({ seo: v });
export const setDemo = (isDemo: boolean) => patch({ isDemo });
export const setOnboarding = (step: number, complete: boolean) =>
  patch({ onboardingStep: step, onboardingComplete: complete });

/* ---------- Services ---------- */
export async function createService(v: { name: string; description: string; icon: string }) {
  const d = db();
  const max = await d.select({ m: sql<number>`coalesce(max(${schema.services.sortOrder}),0)` }).from(schema.services);
  await d.insert(schema.services).values({ ...v, sortOrder: (max[0]?.m ?? 0) + 1 });
}
export async function updateService(id: string, v: Partial<{ name: string; description: string; icon: string; active: boolean; sortOrder: number }>) {
  await db().update(schema.services).set({ ...v, updatedAt: new Date() }).where(eq(schema.services.id, id));
}
export async function deleteService(id: string) {
  await db().delete(schema.services).where(eq(schema.services.id, id));
}

/* ---------- FAQs ---------- */
export async function createFaq(v: { question: string; answer: string }) {
  const d = db();
  const max = await d.select({ m: sql<number>`coalesce(max(${schema.faqs.sortOrder}),0)` }).from(schema.faqs);
  await d.insert(schema.faqs).values({ ...v, sortOrder: (max[0]?.m ?? 0) + 1 });
}
export async function updateFaq(id: string, v: Partial<{ question: string; answer: string; active: boolean; sortOrder: number }>) {
  await db().update(schema.faqs).set({ ...v, updatedAt: new Date() }).where(eq(schema.faqs.id, id));
}
export async function deleteFaq(id: string) {
  await db().delete(schema.faqs).where(eq(schema.faqs.id, id));
}

/* ---------- Testimonials ---------- */
export async function createTestimonial(v: { author: string; location: string; quote: string; rating: number | null; isSample: boolean }) {
  const d = db();
  const max = await d.select({ m: sql<number>`coalesce(max(${schema.testimonials.sortOrder}),0)` }).from(schema.testimonials);
  await d.insert(schema.testimonials).values({ ...v, sortOrder: (max[0]?.m ?? 0) + 1 });
}
export async function updateTestimonial(id: string, v: Partial<{ author: string; location: string; quote: string; rating: number | null; isSample: boolean; active: boolean }>) {
  await db().update(schema.testimonials).set({ ...v, updatedAt: new Date() }).where(eq(schema.testimonials.id, id));
}
export async function deleteTestimonial(id: string) {
  await db().delete(schema.testimonials).where(eq(schema.testimonials.id, id));
}

/* ---------- Process steps ---------- */
export async function createProcessStep(v: { title: string; description: string }) {
  const d = db();
  const max = await d.select({ m: sql<number>`coalesce(max(${schema.processSteps.sortOrder}),0)` }).from(schema.processSteps);
  await d.insert(schema.processSteps).values({ ...v, sortOrder: (max[0]?.m ?? 0) + 1 });
}
export async function updateProcessStep(id: string, v: Partial<{ title: string; description: string; sortOrder: number }>) {
  await db().update(schema.processSteps).set({ ...v, updatedAt: new Date() }).where(eq(schema.processSteps.id, id));
}
export async function deleteProcessStep(id: string) {
  await db().delete(schema.processSteps).where(eq(schema.processSteps.id, id));
}

/* ---------- Gallery ---------- */
export async function createProject(v: {
  title: string; serviceCategory: string; city: string; problem: string; work: string; result: string; description: string; completedOn: string | null; featured: boolean;
}) {
  const d = db();
  const max = await d.select({ m: sql<number>`coalesce(max(${schema.galleryProjects.sortOrder}),0)` }).from(schema.galleryProjects);
  const [row] = await d.insert(schema.galleryProjects).values({ ...v, sortOrder: (max[0]?.m ?? 0) + 1 }).returning({ id: schema.galleryProjects.id });
  return row.id;
}
export async function updateProject(id: string, v: Partial<{ title: string; serviceCategory: string; city: string; problem: string; work: string; result: string; description: string; completedOn: string | null; featured: boolean; active: boolean }>) {
  await db().update(schema.galleryProjects).set({ ...v, updatedAt: new Date() }).where(eq(schema.galleryProjects.id, id));
}
export async function deleteProject(id: string) {
  await db().delete(schema.galleryProjects).where(eq(schema.galleryProjects.id, id));
}
export async function addImage(projectId: string, v: { url: string; alt: string; kind: string }) {
  const d = db();
  const max = await d.select({ m: sql<number>`coalesce(max(${schema.galleryImages.sortOrder}),0)` }).from(schema.galleryImages).where(eq(schema.galleryImages.projectId, projectId));
  await d.insert(schema.galleryImages).values({ projectId, ...v, sortOrder: (max[0]?.m ?? 0) + 1 });
}
export async function updateImage(id: string, v: Partial<{ alt: string; kind: string }>) {
  await db().update(schema.galleryImages).set(v).where(eq(schema.galleryImages.id, id));
}
export async function deleteImage(id: string) {
  await db().delete(schema.galleryImages).where(eq(schema.galleryImages.id, id));
}
export async function getProjectWithImages(id: string) {
  const d = db();
  const [project] = await d.select().from(schema.galleryProjects).where(eq(schema.galleryProjects.id, id)).limit(1);
  if (!project) return null;
  const images = await d.select().from(schema.galleryImages).where(eq(schema.galleryImages.projectId, id)).orderBy(asc(schema.galleryImages.sortOrder));
  return { project, images };
}
export async function listProjects() {
  return db().select().from(schema.galleryProjects).orderBy(asc(schema.galleryProjects.sortOrder));
}

/* ---------- Leads ---------- */
export interface LeadFilter {
  status?: string;
  query?: string;
}
export async function listLeads(filter: LeadFilter = {}) {
  const d = db();
  const conditions = [];
  if (filter.status && filter.status !== "ALL") {
    conditions.push(eq(schema.leads.status, filter.status as (typeof schema.leadStatusEnum.enumValues)[number]));
  }
  if (filter.query) {
    const q = `%${filter.query}%`;
    conditions.push(or(ilike(schema.leads.name, q), ilike(schema.leads.email, q), ilike(schema.leads.phone, q)));
  }
  const where = conditions.length ? and(...conditions) : undefined;
  return d.select().from(schema.leads).where(where).orderBy(desc(schema.leads.createdAt)).limit(500);
}
export async function getLead(id: string) {
  const d = db();
  const [lead] = await d.select().from(schema.leads).where(eq(schema.leads.id, id)).limit(1);
  if (!lead) return null;
  const [activities, emails] = await Promise.all([
    d.select().from(schema.leadActivities).where(eq(schema.leadActivities.leadId, id)).orderBy(desc(schema.leadActivities.createdAt)),
    d.select().from(schema.emailMessages).where(eq(schema.emailMessages.leadId, id)).orderBy(desc(schema.emailMessages.createdAt)),
  ]);
  return { lead, activities, emails };
}
export async function updateLead(id: string, v: Partial<{ status: (typeof schema.leadStatusEnum.enumValues)[number]; estimatedValueCents: number | null; followUpDate: string | null }>) {
  await db().update(schema.leads).set({ ...v, updatedAt: new Date() }).where(eq(schema.leads.id, id));
}
export async function addLeadActivity(leadId: string, type: (typeof schema.activityTypeEnum.enumValues)[number], body: string, userId?: string) {
  await db().insert(schema.leadActivities).values({ leadId, type, body, createdBy: userId ?? null });
}
export async function leadStats() {
  const d = db();
  const rows = await d
    .select({ status: schema.leads.status, count: sql<number>`count(*)::int` })
    .from(schema.leads)
    .groupBy(schema.leads.status);
  return rows;
}

/* ---------- Email drafts / templates ---------- */
export async function saveEmailDraft(leadId: string, toEmail: string, subject: string, body: string) {
  const [row] = await db().insert(schema.emailMessages).values({ leadId, toEmail, subject, body, status: "DRAFT" }).returning({ id: schema.emailMessages.id });
  return row.id;
}
export async function markEmailSent(id: string, providerId: string) {
  await db().update(schema.emailMessages).set({ status: "SENT", providerId, sentAt: new Date() }).where(eq(schema.emailMessages.id, id));
}
export async function markEmailFailed(id: string, error: string) {
  await db().update(schema.emailMessages).set({ status: "FAILED", error }).where(eq(schema.emailMessages.id, id));
}
export async function listTemplates() {
  return db().select().from(schema.emailTemplates).orderBy(asc(schema.emailTemplates.name));
}
export async function upsertTemplate(id: string | null, v: { name: string; subject: string; body: string }) {
  const d = db();
  if (id) await d.update(schema.emailTemplates).set({ ...v, updatedAt: new Date() }).where(eq(schema.emailTemplates.id, id));
  else await d.insert(schema.emailTemplates).values(v);
}
export async function deleteTemplate(id: string) {
  await db().delete(schema.emailTemplates).where(eq(schema.emailTemplates.id, id));
}

/* ---------- SEO checklist progress ---------- */
export async function getChecklistProgress() {
  return db().select().from(schema.seoChecklistProgress);
}
export async function toggleChecklistTask(taskKey: string, completed: boolean) {
  const d = db();
  const existing = await d.select().from(schema.seoChecklistProgress).where(eq(schema.seoChecklistProgress.taskKey, taskKey)).limit(1);
  if (existing[0]) {
    await d.update(schema.seoChecklistProgress).set({ completed, updatedAt: new Date() }).where(eq(schema.seoChecklistProgress.taskKey, taskKey));
  } else {
    await d.insert(schema.seoChecklistProgress).values({ taskKey, completed });
  }
}
