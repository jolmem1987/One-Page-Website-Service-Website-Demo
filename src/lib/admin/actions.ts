"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSessionUser, isOpenAdminDemo, login, logout } from "../auth";
import { loginSchema, businessInfoSchema, hexColor } from "../validation";
import { rateLimit } from "../rate-limit";
import { getSiteConfig } from "../data";
import { sendEmail, getEmailStatus } from "../email";
import { uploadImage } from "../storage";
import { leadStatusEnum, activityTypeEnum } from "../db/schema";
import * as store from "./store";
import { NoDatabaseError } from "./store";

type LeadStatus = (typeof leadStatusEnum.enumValues)[number];
type ActivityType = (typeof activityTypeEnum.enumValues)[number];
import type { ActionResult } from "./types";

/* ============================ helpers ============================ */

// Shown when a demo visitor "saves": realistic feedback, but nothing is stored.
// Not exported: this is a "use server" file, where every export must be async.
const DEMO_SAVE_MESSAGE =
  "Saved — in demo mode. This is a demonstration site, so your change wasn't stored. On your own live website you'd be the only one with access here, and every edit would save instantly and update your public pages.";

async function guard(): Promise<ActionResult | null> {
  // A real signed-in admin (the owner) always has full edit access.
  const user = await getSessionUser();
  if (user) return null;
  // On a demo deployment, let visitors "mess around": return a realistic success
  // result that short-circuits the action BEFORE any database write, so nothing
  // actually persists and the real site's content is never changed.
  if (isOpenAdminDemo()) return { ok: true, message: DEMO_SAVE_MESSAGE };
  return { ok: false, message: "Your session has expired. Please log in again." };
}

async function currentUserId(): Promise<string | undefined> {
  return (await getSessionUser())?.id;
}

function fail(err: unknown): ActionResult {
  if (err instanceof NoDatabaseError) return { ok: false, message: err.message };
  console.error("[admin action]", err);
  return { ok: false, message: "Something went wrong. Please try again." };
}

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}
function bool(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
}

function revalidatePublicAndAdmin() {
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
}

/**
 * Resolves an image field that supports either an uploaded file or a pasted URL.
 * If a file is provided it is uploaded (stored in the DB by default) and its URL
 * returned; otherwise the pasted URL is used, falling back to the existing value.
 */
async function resolveImageUrl(
  fd: FormData,
  fileField: string,
  urlValue: string,
  fallback: string,
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const file = fd.get(fileField);
  if (file instanceof File && file.size > 0) {
    const result = await uploadImage(file, file.name);
    if (!result.ok) return { ok: false, message: result.error ?? "Image upload failed." };
    return { ok: true, url: result.url ?? "" };
  }
  return { ok: true, url: urlValue || fallback };
}

/* ============================ auth ============================ */

export async function loginAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const ip = "login"; // best-effort global limiter; per-IP handled at edge/proxy
  const limit = rateLimit(`login:${str(fd, "email").toLowerCase()}:${ip}`, 8, 15 * 60 * 1000);
  if (!limit.ok) return { ok: false, message: "Too many attempts. Please wait a few minutes." };

  const parsed = loginSchema.safeParse({ email: str(fd, "email"), password: String(fd.get("password") ?? "") });
  if (!parsed.success) return { ok: false, message: "Please enter a valid email and password." };

  const result = await login(parsed.data.email, parsed.data.password);
  if (!result.ok) return { ok: false, message: result.error };
  redirect("/admin");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}

/* ============================ settings ============================ */

export async function saveBusinessAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const config = await getSiteConfig();
  const parsed = businessInfoSchema.safeParse({
    name: str(fd, "name"),
    legalName: str(fd, "legalName"),
    tagline: str(fd, "tagline"),
    phone: str(fd, "phone"),
    email: str(fd, "email"),
    addressLine: str(fd, "addressLine"),
    city: str(fd, "city"),
    state: str(fd, "state"),
    zip: str(fd, "zip"),
    showAddress: bool(fd, "showAddress"),
    licenseInfo: str(fd, "licenseInfo"),
    yearsExperience: str(fd, "yearsExperience"),
    foundedYear: str(fd, "foundedYear"),
    primaryService: str(fd, "primaryService"),
  });
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed.error.flatten().fieldErrors)) if (v?.[0]) fe[k] = v[0];
    return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: fe };
  }
  try {
    await store.saveBusiness({ ...config.business, ...parsed.data, category: config.business.category });
    revalidatePublicAndAdmin();
    return { ok: true, message: "Business information saved." };
  } catch (e) {
    return fail(e);
  }
}

export async function saveCategoryAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const config = await getSiteConfig();
  const cat = str(fd, "category") as typeof config.business.category;
  try {
    await store.saveBusiness({ ...config.business, category: cat });
    revalidatePublicAndAdmin();
    return { ok: true, message: "Business category saved." };
  } catch (e) {
    return fail(e);
  }
}

export async function saveBrandingAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const config = await getSiteConfig();
  const colors = z.object({ primaryColor: hexColor, secondaryColor: hexColor, accentColor: hexColor });
  const parsed = colors.safeParse({
    primaryColor: str(fd, "primaryColor"),
    secondaryColor: str(fd, "secondaryColor"),
    accentColor: str(fd, "accentColor"),
  });
  if (!parsed.success) return { ok: false, message: "Please enter valid 6-digit hex colors (e.g. #1f2933)." };
  const logo = await resolveImageUrl(fd, "logoFile", str(fd, "logoUrl"), config.branding.logoUrl ?? "");
  if (!logo.ok) return logo;
  try {
    await store.saveBranding({
      ...config.branding,
      ...parsed.data,
      logoUrl: logo.url || null,
      faviconUrl: str(fd, "faviconUrl") || null,
      headingFont: str(fd, "headingFont") || config.branding.headingFont,
      bodyFont: str(fd, "bodyFont") || config.branding.bodyFont,
    });
    revalidatePublicAndAdmin();
    return { ok: true, message: "Branding saved." };
  } catch (e) {
    return fail(e);
  }
}

export async function saveHoursAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  try {
    const hours = [0, 1, 2, 3, 4, 5, 6].map((day) => {
      const closed = bool(fd, `closed_${day}`);
      return { day, open: closed ? null : str(fd, `open_${day}`) || null, close: closed ? null : str(fd, `close_${day}`) || null };
    });
    await store.saveHours(hours);
    revalidatePublicAndAdmin();
    return { ok: true, message: "Business hours saved." };
  } catch (e) {
    return fail(e);
  }
}

export async function saveServiceAreaAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  try {
    await store.saveServiceArea({
      primaryCity: str(fd, "primaryCity"),
      state: str(fd, "state"),
      zip: str(fd, "zip"),
      counties: str(fd, "counties").split(",").map((s) => s.trim()).filter(Boolean),
      nearbyCities: str(fd, "nearbyCities").split(",").map((s) => s.trim()).filter(Boolean),
      description: str(fd, "description"),
    });
    revalidatePublicAndAdmin();
    return { ok: true, message: "Service area saved." };
  } catch (e) {
    return fail(e);
  }
}

export async function saveSocialAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  try {
    await store.saveSocial({
      facebook: str(fd, "facebook") || null,
      instagram: str(fd, "instagram") || null,
      youtube: str(fd, "youtube") || null,
      linkedin: str(fd, "linkedin") || null,
      x: str(fd, "x") || null,
      googleBusinessProfile: str(fd, "googleBusinessProfile") || null,
      googleReviewUrl: str(fd, "googleReviewUrl") || null,
    });
    revalidatePublicAndAdmin();
    return { ok: true, message: "Links saved." };
  } catch (e) {
    return fail(e);
  }
}

export async function setDemoAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  try {
    await store.setDemo(bool(fd, "isDemo"));
    revalidatePublicAndAdmin();
    return { ok: true, message: "Demo mode updated." };
  } catch (e) {
    return fail(e);
  }
}

/* ============================ homepage / about content ============================ */

export async function saveHeroAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const config = await getSiteConfig();
  const img = await resolveImageUrl(fd, "imageFile", str(fd, "imageUrl"), config.hero.imageUrl);
  if (!img.ok) return img;
  try {
    await store.saveHero({
      headline: str(fd, "headline"),
      subheadline: str(fd, "subheadline"),
      primaryCtaLabel: str(fd, "primaryCtaLabel") || config.hero.primaryCtaLabel,
      secondaryCtaLabel: str(fd, "secondaryCtaLabel") || config.hero.secondaryCtaLabel,
      imageUrl: img.url,
      imageAlt: str(fd, "imageAlt"),
    });
    revalidatePublicAndAdmin();
    return { ok: true, message: "Homepage hero saved." };
  } catch (e) {
    return fail(e);
  }
}

export async function saveAboutAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const config = await getSiteConfig();
  try {
    await store.saveAbout({
      ...config.about,
      story: str(fd, "story"),
      ownerName: str(fd, "ownerName"),
      ownerTitle: str(fd, "ownerTitle"),
      ownerBio: str(fd, "ownerBio"),
      experience: str(fd, "experience"),
      mission: str(fd, "mission"),
      safety: str(fd, "safety"),
      community: str(fd, "community"),
    });
    revalidatePublicAndAdmin();
    return { ok: true, message: "About content saved." };
  } catch (e) {
    return fail(e);
  }
}

/* ============================ services / faqs / testimonials / process ============================ */

export async function createServiceAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  if (!str(fd, "name")) return { ok: false, message: "Service name is required." };
  try {
    await store.createService({ name: str(fd, "name"), description: str(fd, "description"), icon: str(fd, "icon") || "wrench" });
    revalidatePublicAndAdmin();
    return { ok: true, message: "Service added." };
  } catch (e) {
    return fail(e);
  }
}
export async function updateServiceAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  try {
    await store.updateService(str(fd, "id"), {
      name: str(fd, "name"),
      description: str(fd, "description"),
      icon: str(fd, "icon") || "wrench",
      active: bool(fd, "active"),
    });
    revalidatePublicAndAdmin();
    return { ok: true, message: "Service updated." };
  } catch (e) {
    return fail(e);
  }
}
export async function deleteServiceAction(fd: FormData) {
  if (await guard()) return;
  await store.deleteService(str(fd, "id")).catch(() => {});
  revalidatePublicAndAdmin();
}

export async function createFaqAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  if (!str(fd, "question")) return { ok: false, message: "Question is required." };
  try {
    await store.createFaq({ question: str(fd, "question"), answer: str(fd, "answer") });
    revalidatePublicAndAdmin();
    return { ok: true, message: "FAQ added." };
  } catch (e) {
    return fail(e);
  }
}
export async function updateFaqAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  try {
    await store.updateFaq(str(fd, "id"), { question: str(fd, "question"), answer: str(fd, "answer"), active: bool(fd, "active") });
    revalidatePublicAndAdmin();
    return { ok: true, message: "FAQ updated." };
  } catch (e) {
    return fail(e);
  }
}
export async function deleteFaqAction(fd: FormData) {
  if (await guard()) return;
  await store.deleteFaq(str(fd, "id")).catch(() => {});
  revalidatePublicAndAdmin();
}

export async function createTestimonialAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  if (!str(fd, "quote")) return { ok: false, message: "Testimonial text is required." };
  const rating = str(fd, "rating") ? Number(str(fd, "rating")) : null;
  try {
    await store.createTestimonial({
      author: str(fd, "author") || "Customer",
      location: str(fd, "location"),
      quote: str(fd, "quote"),
      rating: rating && rating >= 1 && rating <= 5 ? rating : null,
      isSample: bool(fd, "isSample"),
    });
    revalidatePublicAndAdmin();
    return { ok: true, message: "Testimonial added." };
  } catch (e) {
    return fail(e);
  }
}
export async function updateTestimonialAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const rating = str(fd, "rating") ? Number(str(fd, "rating")) : null;
  try {
    await store.updateTestimonial(str(fd, "id"), {
      author: str(fd, "author"),
      location: str(fd, "location"),
      quote: str(fd, "quote"),
      rating: rating && rating >= 1 && rating <= 5 ? rating : null,
      isSample: bool(fd, "isSample"),
      active: bool(fd, "active"),
    });
    revalidatePublicAndAdmin();
    return { ok: true, message: "Testimonial updated." };
  } catch (e) {
    return fail(e);
  }
}
export async function deleteTestimonialAction(fd: FormData) {
  if (await guard()) return;
  await store.deleteTestimonial(str(fd, "id")).catch(() => {});
  revalidatePublicAndAdmin();
}

export async function createProcessStepAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  if (!str(fd, "title")) return { ok: false, message: "Step title is required." };
  try {
    await store.createProcessStep({ title: str(fd, "title"), description: str(fd, "description") });
    revalidatePublicAndAdmin();
    return { ok: true, message: "Step added." };
  } catch (e) {
    return fail(e);
  }
}
export async function deleteProcessStepAction(fd: FormData) {
  if (await guard()) return;
  await store.deleteProcessStep(str(fd, "id")).catch(() => {});
  revalidatePublicAndAdmin();
}

/* ============================ SEO ============================ */

export async function saveGlobalSeoAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const config = await getSiteConfig();
  try {
    await store.saveSeo({
      ...config.seo,
      siteUrl: str(fd, "siteUrl").replace(/\/$/, "") || config.seo.siteUrl,
      defaultTitlePattern: str(fd, "defaultTitlePattern") || config.seo.defaultTitlePattern,
      defaultDescription: str(fd, "defaultDescription"),
      defaultSocialImage: str(fd, "defaultSocialImage") || null,
      gaMeasurementId: str(fd, "gaMeasurementId") || null,
      gtmContainerId: str(fd, "gtmContainerId") || null,
      gscVerification: str(fd, "gscVerification") || null,
      bingVerification: str(fd, "bingVerification") || null,
    });
    revalidatePublicAndAdmin();
    return { ok: true, message: "Global SEO settings saved." };
  } catch (e) {
    return fail(e);
  }
}

export async function savePageSeoAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const config = await getSiteConfig();
  const page = str(fd, "page") as "home" | "about" | "gallery";
  if (!["home", "about", "gallery"].includes(page)) return { ok: false, message: "Unknown page." };

  const noindex = bool(fd, "noindex");
  // Prevent accidentally hiding the whole site: never allow all three noindex.
  const others = (["home", "about", "gallery"] as const).filter((p) => p !== page);
  const allOthersHidden = others.every((p) => config.seo.pages[p].noindex);
  if (noindex && allOthersHidden) {
    return {
      ok: false,
      message: "You can't hide every page from search. Leave at least one public page visible (usually the homepage).",
    };
  }

  try {
    const updated = { ...config.seo, pages: { ...config.seo.pages } };
    updated.pages[page] = {
      title: str(fd, "title"),
      description: str(fd, "description"),
      socialTitle: str(fd, "socialTitle") || null,
      socialDescription: str(fd, "socialDescription") || null,
      socialImage: str(fd, "socialImage") || null,
      canonicalOverride: str(fd, "canonicalOverride") || null,
      noindex,
      targetPhrase: str(fd, "targetPhrase") || null,
    };
    await store.saveSeo(updated);
    revalidatePublicAndAdmin();
    return { ok: true, message: "Page SEO saved." };
  } catch (e) {
    return fail(e);
  }
}

export async function toggleChecklistAction(fd: FormData) {
  if (await guard()) return;
  await store.toggleChecklistTask(str(fd, "taskKey"), bool(fd, "completed")).catch(() => {});
  revalidatePath("/admin/seo/checklist");
}

/* ============================ gallery ============================ */

export async function createProjectAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  if (!str(fd, "title")) return { ok: false, message: "Project title is required." };
  let newId: string;
  try {
    newId = await store.createProject({
      title: str(fd, "title"),
      serviceCategory: str(fd, "serviceCategory"),
      city: str(fd, "city"),
      problem: str(fd, "problem"),
      work: str(fd, "work"),
      result: str(fd, "result"),
      description: str(fd, "description"),
      completedOn: str(fd, "completedOn") || null,
      featured: bool(fd, "featured"),
    });
    revalidatePublicAndAdmin();
  } catch (e) {
    return fail(e);
  }
  // redirect() throws internally — must be OUTSIDE the try/catch so it isn't swallowed.
  redirect(`/admin/gallery/${newId}`);
}

export async function updateProjectAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  try {
    await store.updateProject(str(fd, "id"), {
      title: str(fd, "title"),
      serviceCategory: str(fd, "serviceCategory"),
      city: str(fd, "city"),
      problem: str(fd, "problem"),
      work: str(fd, "work"),
      result: str(fd, "result"),
      description: str(fd, "description"),
      completedOn: str(fd, "completedOn") || null,
      featured: bool(fd, "featured"),
      active: bool(fd, "active"),
    });
    revalidatePublicAndAdmin();
    return { ok: true, message: "Project saved." };
  } catch (e) {
    return fail(e);
  }
}
export async function deleteProjectAction(fd: FormData) {
  if (await guard()) return;
  await store.deleteProject(str(fd, "id")).catch(() => {});
  revalidatePublicAndAdmin();
  redirect("/admin/gallery");
}

export async function addImageAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const projectId = str(fd, "projectId");
  let url = str(fd, "url");
  const file = fd.get("file");

  // If a file was uploaded and storage is configured, upload it; else use URL.
  if (file instanceof File && file.size > 0) {
    const result = await uploadImage(file, str(fd, "alt") || file.name);
    if (!result.ok) return { ok: false, message: result.error ?? "Upload failed." };
    url = result.url!;
  }
  if (!url) return { ok: false, message: "Provide an image URL, or upload a file (requires storage configured)." };

  try {
    await store.addImage(projectId, { url, alt: str(fd, "alt"), kind: str(fd, "kind") || "standard" });
    revalidatePublicAndAdmin();
    return { ok: true, message: "Image added." };
  } catch (e) {
    return fail(e);
  }
}
export async function updateImageAction(fd: FormData) {
  if (await guard()) return;
  await store.updateImage(str(fd, "id"), { alt: str(fd, "alt"), kind: str(fd, "kind") }).catch(() => {});
  revalidatePublicAndAdmin();
}
export async function deleteImageAction(fd: FormData) {
  if (await guard()) return;
  await store.deleteImage(str(fd, "id")).catch(() => {});
  revalidatePublicAndAdmin();
}

/* ============================ leads ============================ */

export async function updateLeadStatusAction(fd: FormData) {
  if (await guard()) return;
  const id = str(fd, "id");
  const status = str(fd, "status") as LeadStatus;
  await store.updateLead(id, { status });
  await store.addLeadActivity(id, "STATUS_CHANGE", `Status changed to ${status}.`, await currentUserId());
  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${id}`);
}

export async function addNoteAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const id = str(fd, "id");
  const type = (str(fd, "type") || "NOTE") as ActivityType;
  const body = str(fd, "body");
  if (!body) return { ok: false, message: "Please enter something to record." };
  try {
    await store.addLeadActivity(id, type, body, await currentUserId());
    revalidatePath(`/admin/leads/${id}`);
    return { ok: true, message: "Activity recorded." };
  } catch (e) {
    return fail(e);
  }
}

export async function setFollowUpAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const id = str(fd, "id");
  const date = str(fd, "followUpDate") || null;
  try {
    await store.updateLead(id, { followUpDate: date });
    await store.addLeadActivity(id, "FOLLOW_UP_SET", date ? `Follow-up set for ${date}.` : "Follow-up cleared.", await currentUserId());
    revalidatePath(`/admin/leads/${id}`);
    return { ok: true, message: "Follow-up updated." };
  } catch (e) {
    return fail(e);
  }
}

export async function setValueAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const id = str(fd, "id");
  const dollars = Number(str(fd, "value"));
  const cents = Number.isFinite(dollars) && dollars > 0 ? Math.round(dollars * 100) : null;
  try {
    await store.updateLead(id, { estimatedValueCents: cents });
    revalidatePath(`/admin/leads/${id}`);
    return { ok: true, message: "Estimated value saved." };
  } catch (e) {
    return fail(e);
  }
}

export async function sendLeadEmailAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const id = str(fd, "id");
  const to = str(fd, "to");
  const subject = str(fd, "subject");
  const body = str(fd, "body");
  const intent = str(fd, "intent"); // "draft" | "send"
  if (!subject || !body) return { ok: false, message: "Subject and message are required." };

  try {
    const draftId = await store.saveEmailDraft(id, to, subject, body);

    if (intent === "draft") {
      await store.addLeadActivity(id, "EMAIL", `Saved email draft: "${subject}"`, await currentUserId());
      revalidatePath(`/admin/leads/${id}`);
      return { ok: true, message: "Draft saved." };
    }

    // intent === "send"
    const emailStatus = getEmailStatus();
    if (!emailStatus.configured) {
      // Honest: we do NOT mark as sent.
      return { ok: false, message: `Email is not configured, so nothing was sent. Draft saved instead. ${emailStatus.reason ?? ""}` };
    }
    const result = await sendEmail({ to, subject, body });
    if (!result.ok) {
      await store.markEmailFailed(draftId, result.error ?? "Unknown error");
      await store.addLeadActivity(id, "EMAIL", `Email send FAILED: ${result.error}`, await currentUserId());
      revalidatePath(`/admin/leads/${id}`);
      return { ok: false, message: `Sending failed: ${result.error}` };
    }
    await store.markEmailSent(draftId, result.providerId ?? "");
    await store.addLeadActivity(id, "EMAIL", `Email sent: "${subject}"`, await currentUserId());
    revalidatePath(`/admin/leads/${id}`);
    return { ok: true, message: "Email sent." };
  } catch (e) {
    return fail(e);
  }
}

/* ============================ onboarding ============================ */

export async function saveOnboardingAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const step = Number(str(fd, "step")) || 0;
  const complete = bool(fd, "complete");
  try {
    // Persist whatever settings blocks the current step submitted.
    const section = str(fd, "section");
    if (section === "identity" || section === "contact") {
      const config = await getSiteConfig();
      await store.saveBusiness({
        ...config.business,
        name: str(fd, "name") || config.business.name,
        legalName: str(fd, "legalName") || config.business.legalName,
        tagline: str(fd, "tagline") || config.business.tagline,
        phone: str(fd, "phone") || config.business.phone,
        email: str(fd, "email") || config.business.email,
        primaryService: str(fd, "primaryService") || config.business.primaryService,
      });
    }
    await store.setOnboarding(step, complete);
    revalidatePublicAndAdmin();
    return { ok: true, message: complete ? "Onboarding complete." : "Progress saved." };
  } catch (e) {
    return fail(e);
  }
}
