import { NextRequest } from "next/server";
import { requireSeller } from "@/lib/api/middleware";
import { serverError, unauthorized } from "@/lib/api/response";

export const runtime = "nodejs";

function escapeCsv(value: string | null | undefined): string {
  if (value == null) return "";
  let str = String(value);
  // CSV formula injection (CWE-1236): a cell starting with =, +, -, or @ is
  // evaluated as a formula by Excel/Sheets when opened. Leads originate
  // from the fully-anonymous inquiry endpoint with no character-class
  // restriction, so a submitted name/message could otherwise execute
  // arbitrary formulas in a seller's spreadsheet. Prefix with a single
  // quote to force literal-text interpretation — the standard mitigation.
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  const ctx = await requireSeller(req);
  if (!ctx) return unauthorized();

  // Fetch all leads for this seller (no pagination for export)
  const { data, error } = await ctx.supabase
    .from("inquiries")
    .select("name, phone, email, message, source, status, notes, created_at, property_id")
    .eq("seller_id", ctx.user.id)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    console.error("leads export error", error);
    return serverError("Failed to export leads");
  }

  const header = "Name,Phone,Email,Message,Status,Source,Notes,Created At\n";
  const rows = (data ?? []).map((lead) => {
    return [
      escapeCsv(lead.name),
      escapeCsv(lead.phone),
      escapeCsv(lead.email),
      escapeCsv(lead.message),
      escapeCsv(lead.status),
      escapeCsv(lead.source),
      escapeCsv(lead.notes),
      escapeCsv(lead.created_at),
    ].join(",");
  });

  const csv = header + rows.join("\n");
  const date = new Date().toISOString().split("T")[0];

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${date}.csv"`,
    },
  });
}
