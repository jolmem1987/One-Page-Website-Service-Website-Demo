# New Customer Launch Checklist

The exact, repeatable workflow for turning this template into a live site for a paying customer. Each deployment serves **one** business.

---

## 1. Duplicate the repository
- Create a new GitHub repo for the customer (e.g. `acme-plumbing-website`).
- Copy this template into it (use it as a GitHub **template repository**, or `git clone` + push to the new remote).
- Do **not** reuse another customer's repo, database, or environment variables.

## 2. Create the customer's Neon database
- New project in [neon.tech](https://neon.tech) named for the customer.
- Copy the **Pooled** connection string.

## 3. Configure environment variables
- Locally: `cp .env.example .env.local` and fill in values.
- In Vercel: add the same variables under **Project Settings → Environment Variables**.
- Required: `DATABASE_URL`, `AUTH_SECRET` (`openssl rand -base64 48`), `NEXT_PUBLIC_SITE_URL`.

## 4. Run migrations
```bash
npm install
npm run db:migrate
```

## 5. Seed the starter content
```bash
npm run db:seed          # inserts the demo content as a starting point
```

## 6. Provision the administrator
```bash
npm run admin:create     # give the owner (or yourself) a login
```
There is no public sign-up — this is the only way to create an admin.

## 7. Connect the domain
- Add the customer's domain in Vercel and update DNS.
- Set `NEXT_PUBLIC_SITE_URL` to the final `https://` domain (no trailing slash).

## 8. Enter business information
- Log in at `/admin/login` → open the **Setup Wizard** (`/admin/onboarding`).
- Fill in identity, contact, services, location/service area, hours, and branding.

## 9. Replace demonstration content
- **Content:** rewrite the hero, About story, services, process steps, and FAQs in the customer's real voice.
- **Testimonials:** delete the sample testimonials and add only **genuine** ones. (Never use fake reviews.)

## 10. Upload real images
- Configure image storage (Vercel Blob or Cloudinary) if the customer will upload photos.
- Replace the demo hero and gallery images with real project photos + descriptive alt text.

## 11. Configure email
- Set `RESEND_API_KEY`, `EMAIL_FROM` (verified domain), and `LEAD_NOTIFICATION_EMAIL`.
- Submit a test lead and confirm the notification arrives.

## 12. Review SEO recommendations
- Open **Admin → Local SEO Center**. Work down the prioritized recommendations until the score is healthy.
- Give each page a unique, descriptive title and description (watch the live preview).

## 13. Add Search Console verification
- Verify the site at [search.google.com/search-console](https://search.google.com/search-console).
- Paste the verification token into **SEO Center → Global settings**.

## 14. Submit the sitemap
- In Search Console, submit `https://<domain>/sitemap.xml`.

## 15. Connect analytics
- Add the GA4 measurement ID (and optional GTM ID) in the SEO Center.

## 16. Test forms and admin access
- Submit the public estimate form; confirm the lead appears in **Admin → Leads**.
- Confirm `/admin` requires login and that `/admin` pages are `noindex` (view source).
- Test the mobile menu, gallery filters + lightbox, and content editing.

## 17. Remove/disable the demo disclaimer
- **Admin → Settings → Demonstration mode:** turn OFF "show the demonstration disclaimer".
- Update the footer legal text to the real business.

## 18. Launch 🎉
- Final production build passes (`npm run build`).
- Announce the site and begin the off-site **SEO Action Plan** (`/admin/seo/checklist`).

---

### Handoff notes for the owner
- New leads appear under **Leads**; change status, add notes, set follow-ups, record value, and reply by email.
- Keep services, hours, and contact info current.
- Add new gallery projects regularly and ask happy customers for honest Google reviews.
