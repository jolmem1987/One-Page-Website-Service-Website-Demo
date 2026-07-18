import "server-only";

/**
 * Image storage abstraction.
 *
 * Supports Vercel Blob or Cloudinary. If no provider is configured, uploads are
 * disabled (the admin UI shows configuration guidance and keeps upload controls
 * off) while the site continues to build and use seeded demo images.
 *
 * Binary images are NEVER stored in Postgres — only their public URLs.
 */

export type StorageProvider = "vercel-blob" | "cloudinary" | "none";

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

  return {
    configured: false,
    provider: "none",
    reason:
      "Image uploads are disabled. Set IMAGE_STORAGE_PROVIDER to 'vercel-blob' or 'cloudinary' " +
      "(and the matching credentials) to enable uploading real project photos.",
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
