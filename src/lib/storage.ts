import "server-only";

import { getDb } from "./db";
import { media } from "./db/schema";

/**
 * Image storage abstraction.
 *
 * DEFAULT (no configuration): uploads are stored directly in the Postgres
 * database and served by the /api/media/[id] route — a self-contained,
 * WordPress-style media library that needs no external object store.
 *
 * Optionally supports Vercel Blob or Cloudinary if IMAGE_STORAGE_PROVIDER is
 * set to one of those (and the matching credentials are provided).
 */

export type StorageProvider = "vercel-blob" | "cloudinary" | "database" | "none";

/** Uploads larger than this are rejected to stay within DB/query limits. */
const MAX_UPLOAD_BYTES = 4.5 * 1024 * 1024;

export interface StorageStatus {
  configured: boolean;
  provider: StorageProvider;
  reason?: string;
}

export function getStorageStatus(): StorageStatus {
  const provider = (process.env.IMAGE_STORAGE_PROVIDER ?? "").trim() as StorageProvider;

  if (provider === "vercel-blob") {
    if (process.env.BLOB_READ_WRITE_TOKEN) return { configured: true, provider };
    return {
      configured: false,
      provider,
      reason: "Add Blob storage in Vercel and set BLOB_READ_WRITE_TOKEN to enable uploads.",
    };
  }

  if (provider === "cloudinary") {
    if (
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ) {
      return { configured: true, provider };
    }
    return {
      configured: false,
      provider,
      reason: "Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to enable uploads.",
    };
  }

  // Default: store uploads directly in the database. Always available as long
  // as a database is connected — no external store or extra config required.
  if (getDb()) return { configured: true, provider: "database" };
  return {
    configured: false,
    provider: "none",
    reason: "Connect a database (DATABASE_URL) to enable image uploads.",
  };
}

export interface UploadResult {
  ok: boolean;
  url?: string;
  error?: string;
}

export async function uploadImage(file: File, keyHint: string): Promise<UploadResult> {
  const status = getStorageStatus();
  if (!status.configured) return { ok: false, error: status.reason };

  try {
    if (status.provider === "database") return uploadToDatabase(file);

    if (status.provider === "vercel-blob") {
      const mod = await import("@vercel/blob").catch(() => null);
      if (!mod) return { ok: false, error: "Install @vercel/blob to enable uploads." };
      const safeName = keyHint.replace(/[^a-z0-9-_.]/gi, "-").toLowerCase();
      const blob = await mod.put(`gallery/${Date.now()}-${safeName}`, file, {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      return { ok: true, url: blob.url };
    }

    if (status.provider === "cloudinary") {
      // Cloudinary unsigned/basic upload via REST to avoid an extra dependency.
      const cloud = process.env.CLOUDINARY_CLOUD_NAME as string;
      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", process.env.CLOUDINARY_UPLOAD_PRESET ?? "unsigned");
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) return { ok: false, error: `Cloudinary upload failed (${res.status}).` };
      const json = (await res.json()) as { secure_url?: string };
      if (!json.secure_url) return { ok: false, error: "Cloudinary did not return an image URL." };
      return { ok: true, url: json.secure_url };
    }

    return { ok: false, error: "No storage provider configured." };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Upload failed." };
  }
}

/**
 * Stores an uploaded image directly in Postgres (base64) and returns a stable
 * same-origin URL served by /api/media/[id]. No external object store needed.
 */
async function uploadToDatabase(file: File): Promise<UploadResult> {
  const db = getDb();
  if (!db) return { ok: false, error: "No database connected." };
  if (file.size === 0) return { ok: false, error: "The selected file is empty." };
  if (file.size > MAX_UPLOAD_BYTES) {
    const mb = Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024));
    return { ok: false, error: `Image is too large (max ${mb} MB). Please resize it and try again.` };
  }
  const contentType = file.type || "application/octet-stream";
  if (!contentType.startsWith("image/")) {
    return { ok: false, error: "Only image files can be uploaded." };
  }

  const data = Buffer.from(await file.arrayBuffer()).toString("base64");
  const rows = await db
    .insert(media)
    .values({ data, contentType, filename: file.name })
    .returning({ id: media.id });
  const id = rows[0]?.id;
  if (!id) return { ok: false, error: "Failed to save the image." };
  return { ok: true, url: `/api/media/${id}` };
}
