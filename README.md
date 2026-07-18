# Contractor Website Starter

A production-ready, **rebrandable three-page local-service website template** with an admin panel, lead management, and a plain-language Local SEO center. Duplicate it, rebrand it from the admin (no code edits), and deploy one instance per customer.

Built for roofers, HVAC companies, plumbers, electricians, landscapers, painters, concrete contractors, handymen, cleaners, and other local service businesses. The seeded demo is a **fictional** roofing company, **Summit Ridge Roofing**.

> **Single business per deployment.** This is intentionally *not* a multi-tenant SaaS. No accounts, billing, or tenant switching. Each customer gets their own copy + database.

---

## What's included

- **Public site (3 pages):** Home (`/`), About (`/about`), Gallery (`/gallery`) — hero, trust indicators, services, why-choose-us, process, featured projects, testimonials, service area, FAQ, estimate form, footer.
- **Admin panel (`/admin`):** dashboard, leads + detail, content editor, gallery manager, Local SEO Center, off-site SEO action plan, settings, and a guided onboarding wizard.
- **Lead management:** validated estimate form (honeypot + rate limiting), statuses, notes, activities, follow-ups, estimated value, CSV export, and email drafts/templates.
- **SEO automation:** metadata, canonical URLs, Open Graph/Twitter cards, `sitemap.xml`, `robots.txt`, LocalBusiness JSON-LD (correct subtype per category), breadcrumbs, and FAQ structured data (only when eligible). Admin pages are always `noindex`.
- **Graceful degradation:** builds and renders demo content with **no credentials**. Database, email, and image storage are each optional and fail safe.

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS (brand colors via CSS variables) |
| Database | Neon Postgres + Drizzle ORM (`@neondatabase/serverless`) |
| Validation | Zod |
| Auth | Custom DB-session auth (bcrypt, HttpOnly cookies) |
| Email (optional) | Resend |
| Image storage (optional) | Vercel Blob or Cloudinary |
| Hosting | Vercel |

---

## Quick start (local)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
#    Edit .env.local — at minimum set DATABASE_URL, AUTH_SECRET, NEXT_PUBLIC_SITE_URL.
#    (You can even skip DATABASE_URL to preview the demo with no database.)

# 3. Create the database schema
npm run db:migrate      # applies drizzle/0000_init.sql to your Neon database
#    (alternative: npm run db:push to sync the schema directly)

# 4. Seed demo content (safe & non-destructive — only inserts if empty)
npm run db:seed

# 5. Create your first admin (no public sign-up exists)
npm run admin:create    # interactive, or set ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME

# 6. Run
npm run dev             # http://localhost:3000  (admin at /admin/login)
```

### Environment variables

See [`.env.example`](.env.example) for the full, commented list. Summary:

| Variable | Required? | Purpose |
|---|---|---|
| `DATABASE_URL` | Prod | Neon Postgres pooled connection string |
| `AUTH_SECRET` | Prod | Signs/salts session data (`openssl rand -base64 48`) |
| `NEXT_PUBLIC_SITE_URL` | Prod | Canonical site URL (no trailing slash) |
| `RESEND_API_KEY`, `EMAIL_FROM`, `LEAD_NOTIFICATION_EMAIL` | Optional | Enable email sending + lead alerts |
| `IMAGE_STORAGE_PROVIDER` + provider keys | Optional | Enable image uploads (`vercel-blob` or `cloudinary`) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `…GTM…`, `…GSC…`, `…BING…` | Optional | Analytics + search-console verification (also editable in admin) |

---

## Database

Neon Postgres via Drizzle ORM. The schema lives in [`src/lib/db/schema.ts`](src/lib/db/schema.ts).

```bash
npm run db:generate   # regenerate migrations after editing schema.ts
npm run db:migrate    # apply migrations (safe, additive)
npm run db:push       # push schema directly (handy in dev)
npm run db:seed       # insert demo content if tables are empty
```

Tables: `admin_users`, `sessions`, `leads`, `lead_activities`, `email_messages`, `email_templates`, `site_settings` (structured JSONB blocks = one source of truth), `services`, `process_steps`, `faqs`, `testimonials`, `gallery_projects`, `gallery_images`, `seo_checklist_progress`.

> **Safety:** seed and migrate scripts never drop data. `db:seed` only inserts into empty tables, so it won't overwrite a customer's real content.

### Neon setup

1. Create a project at [neon.tech](https://neon.tech).
2. Copy the **Pooled** connection string into `DATABASE_URL`.
3. Run `npm run db:migrate` then `npm run db:seed`.

---

## Authentication & admin

- **No public registration.** Admins are created only with `npm run admin:create`.
- Passwords are bcrypt-hashed; sessions are opaque tokens stored hashed in the DB; cookies are HttpOnly, SameSite=Lax, and Secure in production.
- Every admin page, server action, and API route re-checks authorization server-side. `/admin/**` is always `noindex`.

---

## Deploying to Vercel

1. Push this repo to GitHub.
2. In Vercel, **New Project → Import** the repo.
3. Add environment variables (from `.env.example`) in **Project Settings → Environment Variables**.
4. (Optional) Add **Vercel Blob** storage and set `IMAGE_STORAGE_PROVIDER=vercel-blob` — `BLOB_READ_WRITE_TOKEN` is injected automatically.
5. Deploy. After the first deploy, run migrations/seed against your Neon DB (locally with the production `DATABASE_URL`, or via a one-off script), then `admin:create`.
6. Point your custom domain at the Vercel project and set `NEXT_PUBLIC_SITE_URL` to match.

---

## Optional integrations

### Email (Resend)
Set `RESEND_API_KEY`, `EMAIL_FROM` (a verified domain), and `LEAD_NOTIFICATION_EMAIL`. Without these, **leads are still saved and drafts still work** — only sending is disabled, and the app never claims an email was sent unless the provider confirms it. See the provider abstraction in [`src/lib/email.ts`](src/lib/email.ts).

### Image storage (Vercel Blob or Cloudinary)
Set `IMAGE_STORAGE_PROVIDER` and the matching keys. Without storage, upload controls are disabled with guidance, and you can still add images by URL. Binary images are **never** stored in Postgres — only URLs. See [`src/lib/storage.ts`](src/lib/storage.ts).

### Search Console & Analytics
Add your **GSC verification token**, **GA4 measurement ID**, optional **GTM container ID**, and **Bing verification** in **Admin → Local SEO Center**, or via env vars. Tracking scripts load **only** when a valid ID is present. The admin never claims Google "verified" anything it can't confirm.

---

## SEO: automatic vs. your action

**Handled automatically (no customer action):** page metadata, canonical URLs, Open Graph + Twitter cards, `sitemap.xml`, `robots.txt`, LocalBusiness JSON-LD with the correct subtype, breadcrumbs, eligible FAQ structured data, admin `noindex`, semantic headings, mobile-friendly rendering, and one consistent source of truth for business info.

**Requires you (off-site — see Admin → SEO Action Plan):** create/claim your Google Business Profile, keep name/address/phone consistent, gather **real** reviews, upload real photos over time, verify Search Console + submit the sitemap, connect analytics, and earn legitimate local links.

We never generate fake reviews, fake locations, keyword-stuffed pages, hidden text, or rating structured data for unverified/sample testimonials — and we make no ranking guarantees. Rankings depend on competition, reviews, your Google Business Profile activity, proximity, reputation, and time.

---

## Duplicating for a new customer

See **[docs/NEW_CUSTOMER_LAUNCH_CHECKLIST.md](docs/NEW_CUSTOMER_LAUNCH_CHECKLIST.md)** for the exact, repeatable workflow. In short: duplicate the repo → new Neon DB → env vars → migrate + seed → `admin:create` → connect domain → complete the **Setup Wizard** at `/admin/onboarding` → replace demo content → upload real photos → configure email → review SEO → verify Search Console → submit sitemap → connect analytics → test → **turn off demo mode** → launch.

The Setup Wizard turns the roofing demo into any local service business without touching source code.

---

## Verification

```bash
npm run lint        # ESLint (next/core-web-vitals)
npm run typecheck   # tsc --noEmit
npm run build       # production build
```

The app is designed to build **without** optional email or image-storage credentials, and even without a database (rendering demo content).

## Project structure

```
src/
  app/
    (public)/            Home, About, Gallery, lead server action
    admin/               login + (protected) dashboard, leads, content, gallery, seo, settings, onboarding
    api/leads/           JSON/form lead endpoint
    sitemap.ts, robots.ts
  components/            site/, admin/, ui/ + Theme/JsonLd/Analytics
  lib/
    db/                  schema, client, migrate, seed
    seo/                 metadata, structured-data, checks, project-score
    admin/               store (all DB writes), actions (auth-guarded), types
    site-config.ts       ← single source of truth (demo content)
    auth.ts, data.ts, leads.ts, email.ts, storage.ts, theme.ts, validation.ts, rate-limit.ts, utils.ts
drizzle/                 SQL migration + journal
public/demo/             seeded placeholder images
```

## Scope (intentionally excluded)

No customer accounts/portal, payments, e-commerce, scheduling automation, blog, AI estimates, multi-tenant orgs, subscription billing, individual service pages, auto-generated location pages, or drag-and-drop page builder. The value is professional presentation, lead management, structured content editing, local SEO guidance, technical SEO automation, and easy reuse.
