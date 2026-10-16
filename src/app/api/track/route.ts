import { after, NextResponse, type NextRequest } from "next/server";
import { hasDb } from "@/lib/db";
import { recordEvent } from "@/lib/events";
import { creditedTouch, sanitizeAttribution } from "@/lib/attribution";
import { fbcFrom } from "@/lib/meta";
import { clientIp, hasConsent, readJson, str, userAgent } from "@/lib/request";

// Browser-originated events only. Lead, InitiateCheckout and Purchase are created by the
// checkout/payment endpoints so they cannot be faked from the browser.
const ALLOWED = new Set(["PageView", "ViewContent", "CTAClick"]);
const SENT_TO_META = new Set(["PageView", "ViewContent"]);
const ID_RE = /^[A-Za-z0-9_-]{8,80}$/;

export async function POST(req: NextRequest) {
  const body = await readJson(req);
  if (!body) return NextResponse.json({ error: "bad request" }, { status: 400 });

  const name = str(body.name, 40);
  const eventId = str(body.event_id, 80);
  const visitorId = str(body.visitor_id, 80);
  if (!ALLOWED.has(name) || !ID_RE.test(eventId) || !ID_RE.test(visitorId)) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  if (!hasDb()) return new NextResponse(null, { status: 204 });

  const touch = creditedTouch(sanitizeAttribution(body.attribution));
  const consent = hasConsent(req);
  const url = str(body.url, 500);
  const ip = clientIp(req);
  const ua = userAgent(req);
  const fbp = req.cookies.get("_fbp")?.value;
  const fbc = fbcFrom(req.cookies.get("_fbc")?.value, touch?.fbclid, touch?.ts);
  const section = str(body.section, 60) || undefined;

  after(() =>
    recordEvent({
      eventId,
      name,
      visitorId,
      path: str(body.path, 200) || "/",
      touch,
      meta:
        consent && SENT_TO_META.has(name)
          ? {
              sourceUrl: url || undefined,
              user: { ip, userAgent: ua, fbp, fbc, externalId: visitorId },
              customData: name === "ViewContent" ? { content_name: section, content_type: "product", content_ids: ["d2c-audit"] } : undefined,
            }
          : null,
    }).catch((e) => console.error("track failed", e)),
  );
  return new NextResponse(null, { status: 204 });
}
