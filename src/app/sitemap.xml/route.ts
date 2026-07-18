import { getSiteConfig } from "@/lib/data";
import { absoluteUrl } from "@/lib/seo/metadata";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Serves /sitemap.xml as an explicit route handler.
 *
 * (We avoid Next's `sitemap.ts` metadata convention because it triggers an
 * EISDIR/readlink error on Windows when the project path contains spaces.)
 *
 * Only lists public pages that are indexable (respecting each page's
 * "hide from search" toggle). Admin pages are never listed.
 */
export async function GET() {
  const config = await getSiteConfig();
  const now = new Date().toISOString();

  const pages: Array<["home" | "about" | "gallery", string, number]> = [
    ["home", "/", 1],
    ["about", "/about", 0.7],
    ["gallery", "/gallery", 0.8],
  ];

  const urls = pages
    .filter(([key]) => !config.seo.pages[key].noindex)
    .map(
      ([, path, priority]) =>
        `  <url>\n` +
        `    <loc>${absoluteUrl(config, path)}</loc>\n` +
        `    <lastmod>${now}</lastmod>\n` +
        `    <changefreq>weekly</changefreq>\n` +
        `    <priority>${priority}</priority>\n` +
        `  </url>`,
    )
    .join("\n");

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${urls}\n` +
    `</urlset>\n`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
