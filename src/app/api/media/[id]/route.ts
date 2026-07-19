import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { media } from "@/lib/db/schema";

export const runtime = "nodejs";

/**
 * Serves an uploaded image stored in the database. Images are content-addressed
 * by an immutable id, so they can be cached aggressively by browsers and CDNs.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  if (!db) return new NextResponse("Not found", { status: 404 });

  const rows = await db
    .select({ data: media.data, contentType: media.contentType })
    .from(media)
    .where(eq(media.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) return new NextResponse("Not found", { status: 404 });

  const bytes = Buffer.from(row.data, "base64");
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": row.contentType,
      "Content-Length": String(bytes.length),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
