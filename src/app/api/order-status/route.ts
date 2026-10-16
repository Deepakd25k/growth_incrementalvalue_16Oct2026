import { NextResponse, type NextRequest } from "next/server";
import { db, hasDb } from "@/lib/db";
import { purchaseEventId, UUID_RE } from "@/lib/leads";

// The thank-you page asks this before firing the browser Purchase event, so visiting
// /thank-you directly never creates a fake conversion.
export async function GET(req: NextRequest) {
  const lid = req.nextUrl.searchParams.get("lid") || "";
  if (!UUID_RE.test(lid) || !hasDb()) return NextResponse.json({ paid: false });
  const sql = await db();
  const rows = await sql<{ status: string; amount: number; currency: string; name: string; email: string; razorpay_payment_id: string | null }[]>`
    SELECT status, amount, currency, name, email, razorpay_payment_id FROM leads WHERE id = ${lid}`;
  const lead = rows[0];
  if (!lead || lead.status !== "paid") return NextResponse.json({ paid: false });
  return NextResponse.json({
    paid: true,
    value: lead.amount / 100,
    currency: lead.currency,
    eventId: purchaseEventId(lid),
    transactionId: lead.razorpay_payment_id,
    firstName: lead.name.split(/\s+/)[0],
    name: lead.name,
    email: lead.email,
  });
}
