import "server-only";
import { createHash } from "node:crypto";

// Meta Conversions API. Every server event uses the same event_id as its browser Pixel twin,
// so Meta counts each action once (deduplication) while still getting the server copy when
// the Pixel is blocked by an ad blocker or iOS.

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

export type MetaUser = {
  ip?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
  externalId?: string; // our visitor id, hashed before sending
  email?: string;
  phone?: string;
  name?: string;
};

export type MetaEvent = {
  eventName: string;
  eventId: string;
  eventTime?: number; // seconds
  sourceUrl?: string;
  user: MetaUser;
  customData?: Record<string, unknown>;
};

export function metaConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID && process.env.META_CAPI_ACCESS_TOKEN);
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "").replace(/^0+/, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

function userData(u: MetaUser) {
  const out: Record<string, unknown> = {};
  if (u.ip) out.client_ip_address = u.ip;
  if (u.userAgent) out.client_user_agent = u.userAgent;
  if (u.fbp) out.fbp = u.fbp;
  if (u.fbc) out.fbc = u.fbc;
  if (u.externalId) out.external_id = [sha256(u.externalId)];
  if (u.email) out.em = [sha256(u.email.trim().toLowerCase())];
  if (u.phone) out.ph = [sha256(normalizePhone(u.phone))];
  if (u.name) {
    const parts = u.name.trim().toLowerCase().split(/\s+/);
    if (parts[0]) out.fn = [sha256(parts[0])];
    if (parts.length > 1) out.ln = [sha256(parts[parts.length - 1])];
  }
  if (u.email || u.phone) out.country = [sha256("in")];
  return out;
}

export function buildPayload(e: MetaEvent) {
  const body: Record<string, unknown> = {
    data: [
      {
        event_name: e.eventName,
        event_time: e.eventTime ?? Math.floor(Date.now() / 1000),
        event_id: e.eventId,
        action_source: "website",
        event_source_url: e.sourceUrl,
        user_data: userData(e.user),
        custom_data: e.customData,
      },
    ],
  };
  if (process.env.META_TEST_EVENT_CODE) body.test_event_code = process.env.META_TEST_EVENT_CODE;
  return body;
}

// Returns a short status string stored on the event row: "sent", "skipped" or "error:...".
export async function sendMetaEvent(e: MetaEvent): Promise<string> {
  if (!metaConfigured()) return "skipped";
  const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const version = process.env.META_API_VERSION || "v24.0";
  const base = process.env.META_GRAPH_BASE || "https://graph.facebook.com";
  try {
    const res = await fetch(`${base}/${version}/${pixel}/events?access_token=${encodeURIComponent(process.env.META_CAPI_ACCESS_TOKEN!)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(e)),
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) return "sent";
    const text = await res.text();
    return `error:${res.status} ${text.slice(0, 200)}`;
  } catch (err) {
    return `error:${(err as Error).message.slice(0, 200)}`;
  }
}

export function fbcFrom(cookieFbc: string | undefined, fbclid: string | undefined, clickTs: number | undefined) {
  if (cookieFbc) return cookieFbc;
  if (fbclid) return `fb.1.${clickTs || Date.now()}.${fbclid}`;
  return undefined;
}
