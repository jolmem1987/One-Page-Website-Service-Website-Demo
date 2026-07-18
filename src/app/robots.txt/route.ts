import { getSiteConfig } from "@/lib/data";
import { siteUrl } from "@/lib/seo/metadata";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Serves /robots.txt as an explicit route handler.
 *
 * (We intentionally avoid Next's `robots.ts` metadata convention because it
 * triggers an EISDIR/readlink error on Windows when the project path contains
 * spaces. This handler produces the same output reliably.)
 *
 * Admin, login, and API routes are always disallowed; the sitemap is advertised.
 */
export async function GET() {
  const config = await getSiteConfig();
  const base = siteUrl(config);

  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /admin/",
    "Disallow: /api/",
    "",
    `Sitemap: ${base}/sitemap.xml`,
    `Host: ${base}`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
