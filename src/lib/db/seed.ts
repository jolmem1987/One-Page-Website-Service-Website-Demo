import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { defaultSiteConfig } from "../site-config";
import * as schema from "./schema";

/**
 * Seeds the database with the demo "Summit Ridge Roofing" content from
 * site-config.ts. Run with:  npm run db:seed
 *
 * SAFETY: This is idempotent-ish and NON-DESTRUCTIVE. It only inserts the
 * settings row / content if the tables are empty, so it will not overwrite a
 * customer's real edited content. To force a reseed, clear the tables first.
 */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("\n[seed] DATABASE_URL is not set. Add it to .env.local first.\n");
    process.exit(1);
  }

  const sql = neon(url);
  const db = drizzle(sql, { schema });
  const c = defaultSiteConfig;

  // --- Site settings (single row) ---
  const existingSettings = await db.select().from(schema.siteSettings).limit(1);
  if (existingSettings.length === 0) {
    console.log("[seed] Inserting site settings...");
    await db.insert(schema.siteSettings).values({
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
      onboardingStep: 0,
      onboardingComplete: false,
    });
  } else {
    console.log("[seed] Site settings already present — skipping.");
  }

  // --- Services ---
  if ((await db.select().from(schema.services).limit(1)).length === 0) {
    console.log("[seed] Inserting services...");
    await db.insert(schema.services).values(
      c.services.map((s) => ({
        name: s.name,
        description: s.description,
        icon: s.icon,
        active: s.active,
        sortOrder: s.order,
      })),
    );
  }

  // --- Process steps ---
  if ((await db.select().from(schema.processSteps).limit(1)).length === 0) {
    console.log("[seed] Inserting process steps...");
    await db.insert(schema.processSteps).values(
      c.process.map((p) => ({ title: p.title, description: p.description, sortOrder: p.order })),
    );
  }

  // --- FAQs ---
  if ((await db.select().from(schema.faqs).limit(1)).length === 0) {
    console.log("[seed] Inserting FAQs...");
    await db.insert(schema.faqs).values(
      c.faqs.map((f) => ({
        question: f.question,
        answer: f.answer,
        active: f.active,
        sortOrder: f.order,
      })),
    );
  }

  // --- Testimonials ---
  if ((await db.select().from(schema.testimonials).limit(1)).length === 0) {
    console.log("[seed] Inserting testimonials (sample content)...");
    await db.insert(schema.testimonials).values(
      c.testimonials.map((t) => ({
        author: t.author,
        location: t.location,
        quote: t.quote,
        rating: t.rating,
        isSample: t.isSample,
        active: t.active,
        sortOrder: t.order,
      })),
    );
  }

  // --- Gallery projects + images ---
  if ((await db.select().from(schema.galleryProjects).limit(1)).length === 0) {
    console.log("[seed] Inserting gallery projects and images...");
    for (const p of c.projects) {
      const [project] = await db
        .insert(schema.galleryProjects)
        .values({
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
          sortOrder: p.order,
        })
        .returning({ id: schema.galleryProjects.id });

      if (p.images.length > 0) {
        await db.insert(schema.galleryImages).values(
          p.images.map((img) => ({
            projectId: project.id,
            url: img.url,
            alt: img.alt,
            kind: img.kind,
            sortOrder: img.order,
          })),
        );
      }
    }
  }

  // --- Default email templates ---
  if ((await db.select().from(schema.emailTemplates).limit(1)).length === 0) {
    console.log("[seed] Inserting default email templates...");
    await db.insert(schema.emailTemplates).values([
      {
        name: "Initial reply",
        subject: "Thanks for reaching out to {{business}}",
        body:
          "Hi {{name}},\n\nThanks for contacting {{business}} about your {{service}} project. " +
          "We received your request and will follow up shortly to schedule your free estimate.\n\n" +
          "If it's easier, you're welcome to call us directly at {{phone}}.\n\nBest,\n{{business}}",
      },
      {
        name: "Estimate follow-up",
        subject: "Following up on your estimate",
        body:
          "Hi {{name}},\n\nI wanted to follow up on the estimate we discussed. Please let me know if " +
          "you have any questions or would like to move forward.\n\nThanks,\n{{business}}",
      },
    ]);
  }

  console.log("[seed] Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
