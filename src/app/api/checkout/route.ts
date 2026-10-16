import { after, NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { db, hasDb } from "@/lib/db";
import { recordEvent } from "@/lib/events";
import { creditedTouch, sanitizeAttribution } from "@/lib/attribution";
import { fbcFrom } from "@/lib/meta";
import { createOrder, mockPayments, razorpayConfigured } from "@/lib/razorpay";
import { clientIp, hasConsent, readJson, str, userAgent } from "@/lib/request";
import { site } from "@/config/site";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ID_RE = /^[A-Za-z0-9_-]{8,80}$/;
const AD_SPEND = new Set(["under-2l", "2l-5l", "5l-10l", "10l-20l", "20l-plus"]);

// Form submit: saves the lead, creates the Razorpay order and logs Lead + InitiateCheckout.
export async function POST(req: NextRequest) {
  const body = await readJson(req);
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const name = str(body.name, 100);
  const email = str(body.email, 150).toLowerCase();
  const phoneDigits = str(body.phone, 20).replace(/\D/g, "");
  const brand = str(body.brand, 120);
  const website = str(body.website, 200);
  const adSpend = str(body.adSpend, 20);
  const challenge = str(body.challenge, 1000);
  const visitorId = ID_RE.test(str(body.visitor_id, 80)) ? str(body.visitor_id, 80) : null;

  const errors: string[] = [];
  if (name.length < 2) errors.push("name");
  if (!EMAIL_RE.test(email)) errors.push("email");
  if (phoneDigits.length < 10 || phoneDigits.length > 13) errors.push("phone");
  if (brand.length < 2) errors.push("brand");
  if (!AD_SPEND.has(adSpend)) errors.push("adSpend");
  if (errors.length) return NextResponse.json({ error: "Please check the highlighted fields", fields: errors }, { status: 422 });

  if (!hasDb()) return NextResponse.json({ error: "Checkout is not configured yet" }, { status: 503 });
  if (!razorpayConfigured() && !mockPayments()) {
    return NextResponse.json({ error: "Payments are not configured yet" }, { status: 503 });
  }

  const attribution = sanitizeAttribution(body.attribution);
  const touch = creditedTouch(attribution);
  const consent = hasConsent(req);
  const ip = clientIp(req);
  const ua = userAgent(req);
  const fbp = req.cookies.get("_fbp")?.value ?? null;
  const fbc = fbcFrom(req.cookies.get("_fbc")?.value, touch?.fbclid, touch?.ts) ?? null;
  const sourceUrl = str(body.url, 500) || `${site.url}/`;

  const sql = await db();

  // Someone retrying within a day reuses their lead, so one person = one lead in the funnel.
  const existing = await sql<{ id: string }[]>`
    SELECT id FROM leads
    WHERE lower(email) = ${email} AND status <> 'paid' AND created_at > now() - interval '24 hours'
    ORDER BY created_at DESC LIMIT 1`;
  const isNewLead = existing.length === 0;
  const leadId = isNewLead ? randomUUID() : existing[0].id;

  const contact = {
    name,
    email,
    phone: phoneDigits,
    brand,
    website: website || null,
    ad_spend: adSpend,
    challenge: challenge || null,
    amount: site.priceInPaise,
    currency: site.currency,
    ip: ip ?? null,
    user_agent: ua ?? null,
    consent,
  };
  const tracking = {
    visitor_id: visitorId,
    utm_source: touch?.source ?? null,
    utm_medium: touch?.medium ?? null,
    utm_campaign: touch?.campaign ?? null,
    utm_content: touch?.content ?? null,
    utm_term: touch?.term ?? null,
    fbclid: touch?.fbclid ?? null,
    gclid: touch?.gclid ?? null,
    first_touch: attribution.first ? sql.json(attribution.first) : null,
    last_touch: touch ? sql.json(touch) : null,
    landing_url: attribution.first?.landing ?? null,
    fbp,
    fbc,
  };

  if (isNewLead) {
    await sql`INSERT INTO leads ${sql({ id: leadId, ...contact, ...tracking })}`;
  } else {
    // A retry without attribution (e.g. another device) must not wipe the ad that brought this lead in.
    const update = touch && visitorId ? { ...contact, ...tracking } : contact;
    await sql`UPDATE leads SET ${sql(update)}, updated_at = now() WHERE id = ${leadId}`;
  }

  let order: { id: string };
  try {
    order = await createOrder(site.priceInPaise, site.currency, leadId, { lead_id: leadId, brand: brand.slice(0, 100) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not start payment. Please try again." }, { status: 502 });
  }
  await sql`UPDATE leads SET razorpay_order_id = ${order.id}, status = 'checkout', updated_at = now() WHERE id = ${leadId}`;

  const leadEventId = `lead_${leadId}`;
  const checkoutEventId = `ic_${order.id}`;
  const metaUser = { ip, userAgent: ua, fbp: fbp ?? undefined, fbc: fbc ?? undefined, externalId: visitorId ?? undefined, email, phone: phoneDigits, name };
  const value = site.priceInPaise / 100;

  after(async () => {
    try {
      if (isNewLead) {
        await recordEvent({
          eventId: leadEventId,
          name: "Lead",
          visitorId,
          leadId,
          path: "/",
          touch,
          meta: consent ? { sourceUrl, user: metaUser, customData: { content_name: site.product, currency: site.currency, value } } : null,
        });
      }
      await recordEvent({
        eventId: checkoutEventId,
        name: "InitiateCheckout",
        visitorId,
        leadId,
        path: "/",
        touch,
        value: site.priceInPaise,
        meta: consent
          ? { sourceUrl, user: metaUser, customData: { currency: site.currency, value, content_ids: ["d2c-audit"], content_type: "product", num_items: 1 } }
          : null,
      });
    } catch (e) {
      console.error("checkout events failed", e);
    }
  });

  return NextResponse.json({
    leadId,
    orderId: order.id,
    amount: site.priceInPaise,
    currency: site.currency,
    keyId: process.env.RAZORPAY_KEY_ID ?? null,
    mock: mockPayments(),
    leadEventId: isNewLead ? leadEventId : null,
    checkoutEventId,
  });
}
