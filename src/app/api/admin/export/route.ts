import { NextResponse, type NextRequest } from "next/server";
import { db, hasDb } from "@/lib/db";
import { rangeStart } from "@/lib/admin-data";

const COLUMNS = [
  "created_at", "status", "name", "email", "phone", "brand", "website", "ad_spend", "challenge",
  "amount", "paid_at", "razorpay_order_id", "razorpay_payment_id", "utm_source", "utm_medium",
  "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid", "landing_url",
] as const;

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  let s = v instanceof Date ? v.toISOString() : String(v);
  // Stop spreadsheet apps from treating user input as a formula.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: NextRequest) {
  if (!hasDb()) return NextResponse.json({ error: "no database" }, { status: 503 });
  const sql = await db();
  const since = rangeStart(req.nextUrl.searchParams.get("range"));
  const rows = await sql`
    SELECT ${sql(COLUMNS as unknown as string[])} FROM audit_leads WHERE created_at >= ${since} ORDER BY created_at DESC`;
  const lines = [COLUMNS.join(",")];
  for (const r of rows) lines.push(COLUMNS.map((c) => csvCell(c === "amount" ? Number(r[c]) / 100 : r[c])).join(","));
  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
