import "server-only";
import { db } from "./db";
import { recordEvent } from "./events";
import { fbcFrom } from "./meta";
import type { Touch } from "./attribution";
import { site } from "@/config/site";

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const purchaseEventId = (leadId: string) => `purchase_${leadId}`;

type LeadRow = {
  id: string;
  visitor_id: string | null;
  name: string;
  email: string;
  phone: string;
  amount: number;
  currency: string;
  last_touch: Touch | null;
  fbp: string | null;
  fbc: string | null;
  ip: string | null;
  user_agent: string | null;
  consent: boolean;
};

// Marks the lead paid exactly once, whether the browser callback or the Razorpay webhook
// arrives first, and sends the single Purchase conversion.
// leadIdHint comes from the Razorpay order notes and covers a lead that started a newer order
// after this one was created.
export async function markPaid(orderId: string, paymentId: string, leadIdHint?: string | null): Promise<{ leadId: string } | null> {
  const sql = await db();
  const hint = leadIdHint && UUID_RE.test(leadIdHint) ? leadIdHint : null;
  const rows = await sql<LeadRow[]>`
    UPDATE leads SET status = 'paid', razorpay_order_id = ${orderId}, razorpay_payment_id = ${paymentId},
                     paid_at = now(), updated_at = now()
    WHERE (razorpay_order_id = ${orderId} OR id = ${hint}) AND status <> 'paid'
    RETURNING *`;
  if (rows.length === 0) {
    const existing = await sql<{ id: string }[]>`
      SELECT id FROM leads WHERE razorpay_order_id = ${orderId} OR id = ${hint} LIMIT 1`;
    return existing[0] ? { leadId: existing[0].id } : null;
  }
  const lead = rows[0];
  const touch = lead.last_touch;

  await recordEvent({
    eventId: purchaseEventId(lead.id),
    name: "Purchase",
    visitorId: lead.visitor_id,
    leadId: lead.id,
    path: "/thank-you",
    touch,
    value: lead.amount,
    meta: lead.consent
      ? {
          sourceUrl: `${site.url}/thank-you`,
          user: {
            ip: lead.ip ?? undefined,
            userAgent: lead.user_agent ?? undefined,
            fbp: lead.fbp ?? undefined,
            fbc: fbcFrom(lead.fbc ?? undefined, touch?.fbclid, touch?.ts),
            externalId: lead.visitor_id ?? undefined,
            email: lead.email,
            phone: lead.phone,
            name: lead.name,
          },
          customData: {
            currency: lead.currency,
            value: lead.amount / 100,
            content_name: site.product,
            content_type: "product",
            content_ids: ["d2c-audit"],
            order_id: orderId,
          },
        }
      : null,
  });
  return { leadId: lead.id };
}
