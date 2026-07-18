# Integrations & Configuration

Every integration here is **optional**. The site builds and runs without any of them — features degrade honestly rather than breaking.

---

## Email provider (Resend)

**Enables:** sending replies to leads from the admin, and new-lead notification emails.

1. Create an account at [resend.com](https://resend.com) and verify your sending domain.
2. Set env vars:
   ```
   RESEND_API_KEY=re_xxx
   EMAIL_FROM="Your Business <notify@yourdomain.com>"
   LEAD_NOTIFICATION_EMAIL=owner@yourbusiness.com
   ```
3. Restart / redeploy.

**Without it:** leads are still saved, and you can still write and **save drafts**. The “Send” button is disabled. The app **never** marks an email as sent unless Resend confirms success. To use a different provider, implement `sendEmail`/`getEmailStatus` in [`src/lib/email.ts`](../src/lib/email.ts).

---

## Image storage (Vercel Blob or Cloudinary)

**Enables:** uploading real project photos from the gallery editor. Binary images are stored with the provider — **never** in Postgres (only URLs are kept).

### Option A — Vercel Blob (simplest on Vercel)
1. In Vercel: **Storage → Create → Blob**. `BLOB_READ_WRITE_TOKEN` is injected automatically.
2. Set `IMAGE_STORAGE_PROVIDER=vercel-blob`.
3. Ensure the `@vercel/blob` optional dependency is installed (it's in `optionalDependencies`).

### Option B — Cloudinary
```
IMAGE_STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
CLOUDINARY_UPLOAD_PRESET=unsigned   # create an unsigned upload preset in Cloudinary
```

**Without it:** upload controls are disabled with guidance, seeded demo images remain, and you can still add images by pasting a URL. `next.config.mjs` already allows Vercel Blob, Cloudinary, and Unsplash image hosts — add your own host there if needed.

---

## Google Search Console

**Enables:** confirming Google can crawl your site and submitting your sitemap.

1. Go to [search.google.com/search-console](https://search.google.com/search-console) and add your property.
2. Choose the **HTML tag** verification method and copy the token (the `content` value).
3. Paste it into **Admin → Local SEO Center → Global settings → Google Search Console verification** (or set `NEXT_PUBLIC_GSC_VERIFICATION`).
4. Redeploy, verify in Search Console, then submit `https://<your-domain>/sitemap.xml`.

> The admin lets you record that you completed verification, but it never claims Google verified anything it can't confirm.

---

## Analytics (GA4 / GTM)

**Enables:** understanding your traffic. Scripts load **only** when a valid ID is present.

- Set the GA4 measurement ID (`G-XXXXXXX`) in **Admin → SEO Center**, or `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
- Optionally set a GTM container ID (`GTM-XXXXXX`).
- Bing Webmaster Tools verification is also supported (`NEXT_PUBLIC_BING_VERIFICATION` or the SEO Center field).

---

## First admin (no public sign-up)

```bash
npm run admin:create
# or non-interactively:
ADMIN_EMAIL=you@ex.com ADMIN_PASSWORD='a-strong-password' ADMIN_NAME='You' npm run admin:create
```
Re-running with an existing email updates that admin's password/name.

---

## Rebranding without code

Everything customer-specific lives in the database (seeded from [`src/lib/site-config.ts`](../src/lib/site-config.ts)) and is edited from the admin:
**Settings** (identity, contact, hours, service area, branding, links, demo mode), **Content** (hero, services, About, process, FAQs, testimonials), **Gallery** (projects + images), and **SEO Center** (titles, descriptions, verification, analytics). The Setup Wizard (`/admin/onboarding`) walks through all of it.
