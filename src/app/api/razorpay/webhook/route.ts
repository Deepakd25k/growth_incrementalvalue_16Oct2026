import { NextResponse, type NextRequest } from "next/server";
import { markPaid, UUID_RE } from "@/lib/leads";
import { recordEvent } from "@/lib/events";
import { verifyWebhookSignature } from "@/lib/razorpay";

type Payment = { id?: string; order_id?: string; notes?: Record<string, string> };

// Backup path: if the buyer closes the tab before the browser callback, Razorpay still tells us.
// Subscribe to payment.captured, order.paid and payment.failed in the Razorpay dashboard.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";
  if (!verifyWebhookSignature(raw, signature)) return NextResponse.json({ error: "invalid signature" }, { status: 401 });

  let evt: { event?: string; payload?: { payment?: { entity?: Payment } } };
  try {
    evt = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad body" }, { status: 400 });
  }
  const payment = evt.payload?.payment?.entity;
  if (!payment?.id || !payment.order_id) return NextResponse.json({ ok: true });

  if (evt.event === "payment.captured" || evt.event === "order.paid") {
    await markPaid(payment.order_id, payment.id, payment.notes?.lead_id);
  } else if (evt.event === "payment.failed") {
    const leadId = payment.notes?.lead_id;
    await recordEvent({
      eventId: `pf_${payment.id}`,
      name: "PaymentFailed",
      leadId: leadId && UUID_RE.test(leadId) ? leadId : null,
      path: "/",
    });
  }
  return NextResponse.json({ ok: true });
}
