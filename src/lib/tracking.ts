// Browser-side tracking. One module owns every pixel call so nothing fires twice.
//
//  Event            | Meta Pixel (browser) | Meta CAPI (server) | Google           | Our DB
//  PageView         | yes, same event_id   | yes                | GA4 auto         | yes
//  ViewContent      | yes, same event_id   | yes                | -                | yes (pricing seen)
//  CTAClick         | -                    | -                  | -                | yes (internal only)
//  Lead             | yes, same event_id   | yes                | generate_lead    | yes
//  InitiateCheckout | yes, same event_id   | yes                | begin_checkout   | yes
//  Purchase         | yes, same event_id   | yes (only once)    | purchase + Ads   | yes

import type { Attribution, Touch } from "./attribution";

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown };
    _fbq?: unknown;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";
const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID || "";
const ADS_CONVERSION = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION || ""; // "AW-123456789/AbCdEf"
const ADS_ID = ADS_CONVERSION.split("/")[0] || "";

const ATTR_KEY = "dg_attr";
const TOUCH_TTL_MS = 30 * 24 * 3600 * 1000;

// ---------- small helpers ----------

function readCookie(name: string): string | undefined {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : undefined;
}

function writeCookie(name: string, value: string, days: number) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${days * 86400}; Path=/; SameSite=Lax${secure}`;
}

function randomId(len = 16) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function newEventId(prefix: string) {
  return `${prefix}_${randomId(10)}`;
}

function storageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode */
  }
}

// ---------- identity, consent, attribution ----------

export function visitorId(): string {
  let id = readCookie("dg_vid") || storageGet("dg_vid");
  if (!id || !/^[A-Za-z0-9_-]{8,80}$/.test(id)) id = `v_${randomId(12)}`;
  writeCookie("dg_vid", id, 365);
  storageSet("dg_vid", id);
  return id;
}

export type ConsentState = "granted" | "denied" | "unset";

export function consentState(): ConsentState {
  const v = readCookie("dg_consent");
  return v === "granted" || v === "denied" ? v : "unset";
}

// India (DPDP) notice model: tracking runs unless the visitor declines.
export function trackingAllowed() {
  return consentState() !== "denied";
}

export function setConsent(granted: boolean) {
  writeCookie("dg_consent", granted ? "granted" : "denied", 180);
  if (granted) {
    initThirdParty();
  } else {
    window.fbq?.("consent", "revoke");
    window.gtag?.("consent", "update", { ad_storage: "denied", analytics_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  }
}

export function getAttribution(): Attribution {
  try {
    const a = JSON.parse(storageGet(ATTR_KEY) || "{}") as Attribution;
    if (a.last && Date.now() - a.last.ts > TOUCH_TTL_MS) a.last = null;
    return a;
  } catch {
    return {};
  }
}

// Records a new touch when the visit came from a tagged link, an ad click or another site.
// Direct visits keep the earlier touch, so a founder who clicks an ad and returns later is still credited.
export function captureAttribution(): Attribution {
  const attr = getAttribution();
  const p = new URLSearchParams(location.search);
  const ref = document.referrer;
  let refHost = "";
  try {
    refHost = ref ? new URL(ref).hostname.replace(/^www\./, "") : "";
  } catch {
    /* ignore */
  }
  const external = refHost && refHost !== location.hostname.replace(/^www\./, "");

  const fbclid = p.get("fbclid") || undefined;
  const gclid = p.get("gclid") || p.get("gbraid") || p.get("wbraid") || undefined;
  let touch: Touch | null = null;

  if (p.get("utm_source") || fbclid || gclid) {
    touch = {
      source: p.get("utm_source") || (fbclid ? "facebook" : "google"),
      medium: p.get("utm_medium") || (fbclid || gclid ? "paid" : undefined),
      campaign: p.get("utm_campaign") || undefined,
      content: p.get("utm_content") || undefined,
      term: p.get("utm_term") || undefined,
      fbclid,
      gclid,
      landing: location.pathname + location.search,
      referrer: ref || undefined,
      ts: Date.now(),
    };
  } else if (external) {
    touch = { source: refHost, medium: "referral", landing: location.pathname, referrer: ref, ts: Date.now() };
  }

  if (touch) {
    attr.last = touch;
    if (!attr.first) attr.first = touch;
    storageSet(ATTR_KEY, JSON.stringify(attr));
  } else if (!attr.first) {
    attr.first = { source: undefined, landing: location.pathname, ts: Date.now() };
    storageSet(ATTR_KEY, JSON.stringify(attr));
  }

  // Meta click cookie, in the exact format the Pixel uses, so browser and server send the same fbc.
  if (fbclid && trackingAllowed()) {
    const current = readCookie("_fbc");
    if (!current || !current.endsWith(`.${fbclid}`)) writeCookie("_fbc", `fb.1.${Date.now()}.${fbclid}`, 90);
  }
  return attr;
}

// ---------- third-party tags ----------

let thirdPartyReady = false;

function loadScript(src: string) {
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

export function initThirdParty() {
  if (thirdPartyReady || !trackingAllowed()) return;
  thirdPartyReady = true;

  if (PIXEL_ID) {
    if (!readCookie("_fbp")) writeCookie("_fbp", `fb.1.${Date.now()}.${Math.floor(Math.random() * 1e10)}`, 90);
    if (!window.fbq) {
      // Standard Meta Pixel bootstrap: queue calls until fbevents.js loads.
      const n = function (...args: unknown[]) {
        if (n.callMethod) n.callMethod(...args);
        else n.queue!.push(args);
      } as NonNullable<Window["fbq"]>;
      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [];
      window.fbq = n;
      window._fbq = n;
      loadScript("https://connect.facebook.net/en_US/fbevents.js");
    }
    // autoConfig off: no automatic button-click/metadata events that could double count.
    window.fbq("set", "autoConfig", false, PIXEL_ID);
    window.fbq("init", PIXEL_ID, { external_id: visitorId() });
  }

  if (GA4_ID || ADS_ID) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      // gtag.js expects the arguments object itself, not an array.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
    window.gtag("consent", "default", { ad_storage: "granted", analytics_storage: "granted", ad_user_data: "granted", ad_personalization: "granted" });
    window.gtag("js", new Date());
    if (GA4_ID) window.gtag("config", GA4_ID);
    if (ADS_ID) window.gtag("config", ADS_ID);
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${GA4_ID || ADS_ID}`);
  }
}

// ---------- event senders ----------

function sendToServer(name: string, eventId: string, extra: Record<string, unknown> = {}) {
  const body = JSON.stringify({
    name,
    event_id: eventId,
    visitor_id: visitorId(),
    path: location.pathname,
    url: location.href.split("#")[0],
    attribution: getAttribution(),
    ...extra,
  });
  fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
}

function pixel(name: string, data: Record<string, unknown>, eventId: string) {
  if (PIXEL_ID && trackingAllowed()) window.fbq?.("track", name, data, { eventID: eventId });
}

function gtagEvent(name: string, params: Record<string, unknown>) {
  if ((GA4_ID || ADS_ID) && trackingAllowed()) window.gtag?.("event", name, params);
}

let lastPageViewPath = "";

export function trackPageView(path: string) {
  if (path === lastPageViewPath) return; // guards React strict-mode double effects
  lastPageViewPath = path;
  const id = newEventId("pv");
  pixel("PageView", {}, id);
  sendToServer("PageView", id);
}

const contentViewed = new Set<string>();

export function trackViewContent(section: string) {
  if (contentViewed.has(section)) return;
  contentViewed.add(section);
  const id = newEventId("vc");
  pixel("ViewContent", { content_name: section, content_type: "product", content_ids: ["d2c-audit"] }, id);
  sendToServer("ViewContent", id, { section });
}

export function trackCtaClick(location: string) {
  sendToServer("CTAClick", newEventId("cta"), { section: location });
}

// Lead and InitiateCheckout ids come from the server, which already sent the CAPI copy.
export function trackLead(eventId: string, value: number) {
  pixel("Lead", { content_name: "D2C Growth Audit", currency: "INR", value }, eventId);
  gtagEvent("generate_lead", { currency: "INR", value });
}

export function trackInitiateCheckout(eventId: string, value: number) {
  pixel("InitiateCheckout", { currency: "INR", value, content_ids: ["d2c-audit"], content_type: "product", num_items: 1 }, eventId);
  gtagEvent("begin_checkout", { currency: "INR", value, items: [{ item_id: "d2c-audit", item_name: "D2C Growth Audit", price: value, quantity: 1 }] });
}

export function trackPurchase(eventId: string, value: number, transactionId: string) {
  const key = `dg_purchase_${eventId}`;
  if (storageGet(key)) return; // already reported from this browser (page refresh)
  storageSet(key, "1");
  pixel("Purchase", { currency: "INR", value, content_ids: ["d2c-audit"], content_type: "product" }, eventId);
  gtagEvent("purchase", {
    transaction_id: transactionId,
    currency: "INR",
    value,
    items: [{ item_id: "d2c-audit", item_name: "D2C Growth Audit", price: value, quantity: 1 }],
  });
  if (ADS_CONVERSION && trackingAllowed()) {
    window.gtag?.("event", "conversion", { send_to: ADS_CONVERSION, value, currency: "INR", transaction_id: transactionId });
  }
}
