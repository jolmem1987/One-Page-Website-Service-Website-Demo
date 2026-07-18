import "server-only";

/**
 * Email provider abstraction.
 *
 * Default provider: Resend. If no API key is configured (or the `resend`
 * package isn't installed), email SENDING is disabled — but leads are still
 * saved and drafts still work. We NEVER report an email as sent unless the
 * provider confirms success.
 */

export interface EmailStatus {
  configured: boolean;
  provider: "resend" | "none";
  reason?: string;
}

export function getEmailStatus(): EmailStatus {
  if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
    return { configured: true, provider: "resend" };
  }
  return {
    configured: false,
    provider: "none",
    reason:
      "Set RESEND_API_KEY and EMAIL_FROM to enable sending. Until then, you can write and save " +
      "drafts, but the site will not send email.",
  };
}

export interface SendResult {
  ok: boolean;
  providerId?: string;
  error?: string;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  body: string;
  replyTo?: string;
}): Promise<SendResult> {
  const status = getEmailStatus();
  if (!status.configured) {
    return { ok: false, error: status.reason ?? "Email provider is not configured." };
  }

  try {
    // Dynamic import so a missing optional dependency never breaks the build.
    const mod = await import("resend").catch(() => null);
    if (!mod) {
      return { ok: false, error: "The 'resend' package is not installed. Run: npm install resend" };
    }
    const { Resend } = mod;
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM as string,
      to: params.to,
      subject: params.subject,
      text: params.body,
      replyTo: params.replyTo,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, providerId: data?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown email error." };
  }
}

/** Sends the internal new-lead notification to the business owner, if configured. */
export async function notifyNewLead(summary: {
  name: string;
  email: string;
  phone: string;
  service?: string | null;
  message?: string | null;
}): Promise<SendResult> {
  const to = process.env.LEAD_NOTIFICATION_EMAIL;
  if (!to) return { ok: false, error: "LEAD_NOTIFICATION_EMAIL not set." };
  return sendEmail({
    to,
    subject: `New estimate request from ${summary.name}`,
    replyTo: summary.email,
    body:
      `You have a new lead from your website:\n\n` +
      `Name: ${summary.name}\n` +
      `Email: ${summary.email}\n` +
      `Phone: ${summary.phone}\n` +
      `Service: ${summary.service ?? "—"}\n\n` +
      `Message:\n${summary.message ?? "—"}\n`,
  });
}
