import { z } from "zod";

/** Public estimate/lead form. Includes a honeypot field that must be empty. */
export const leadSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(120),
  email: z.string().trim().email("Please enter a valid email address.").max(200),
  phone: z
    .string()
    .trim()
    .min(7, "Please enter a valid phone number.")
    .max(30)
    .regex(/^[0-9()+\-.\s]+$/, "Please enter a valid phone number."),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  serviceRequested: z.string().trim().max(200).optional().or(z.literal("")),
  preferredContact: z.enum(["PHONE", "EMAIL", "TEXT"]).default("PHONE"),
  message: z.string().trim().max(3000).optional().or(z.literal("")),
  consent: z
    .union([z.literal("on"), z.literal("true"), z.boolean()])
    .refine((v) => v === "on" || v === "true" || v === true, {
      message: "Please confirm you agree to be contacted.",
    }),
  // Honeypot: bots fill hidden fields. Humans leave it blank.
  company_website: z.string().max(0, "Spam detected.").optional().or(z.literal("")),
});

export type LeadInput = z.infer<typeof leadSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(200),
});

export const leadStatusSchema = z.enum([
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

/** A permissive hex-color validator used by branding settings. */
export const hexColor = z
  .string()
  .trim()
  .regex(/^#([0-9a-fA-F]{6})$/, "Use a 6-digit hex color like #1f2933.");

export const businessInfoSchema = z.object({
  name: z.string().trim().min(1).max(120),
  legalName: z.string().trim().max(160),
  tagline: z.string().trim().max(200),
  phone: z.string().trim().min(7).max(30),
  email: z.string().trim().email().max(200),
  addressLine: z.string().trim().max(200),
  city: z.string().trim().max(120),
  state: z.string().trim().max(20),
  zip: z.string().trim().max(20),
  showAddress: z.boolean(),
  licenseInfo: z.string().trim().max(300),
  yearsExperience: z.coerce.number().int().min(0).max(200),
  foundedYear: z.coerce.number().int().min(1900).max(2100),
  primaryService: z.string().trim().max(160),
});
