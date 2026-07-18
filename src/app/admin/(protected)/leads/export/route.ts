import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { listLeads } from "@/lib/admin/store";
import { csvCell, formatCurrencyFromCents } from "@/lib/utils";

export const runtime = "nodejs";

/** Exports the current (filtered) lead list as a CSV download. Admin only. */
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const status = req.nextUrl.searchParams.get("status") ?? "ALL";
  const q = req.nextUrl.searchParams.get("q") ?? "";

  let leads: Awaited<ReturnType<typeof listLeads>> = [];
  try {
    leads = await listLeads({ status, query: q });
  } catch {
    return new NextResponse("Database error", { status: 500 });
  }

  const headers = [
    "Name",
    "Email",
    "Phone",
    "Location",
    "Service",
    "Preferred contact",
    "Status",
    "Estimated value",
    "Follow-up",
    "Message",
    "Received",
  ];
  const rows = leads.map((l) =>
    [
      l.name,
      l.email,
      l.phone,
      l.location ?? "",
      l.serviceRequested ?? "",
      l.preferredContact,
      l.status,
      formatCurrencyFromCents(l.estimatedValueCents),
      l.followUpDate ?? "",
      l.message ?? "",
      l.createdAt.toISOString(),
    ]
      .map(csvCell)
      .join(","),
  );
  const csv = [headers.join(","), ...rows].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${status.toLowerCase()}.csv"`,
    },
  });
}
