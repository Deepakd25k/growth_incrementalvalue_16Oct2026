// Shared between browser and server: the shape of one marketing "touch" and how to clean it.

export type Touch = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  fbclid?: string;
  gclid?: string;
  landing?: string;
  referrer?: string;
  ts: number; // ms epoch when this touch happened
};

export type Attribution = {
  first?: Touch | null;
  last?: Touch | null;
};

const MAX = 300;

function clean(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim().slice(0, MAX);
  return s || undefined;
}

export function sanitizeTouch(t: unknown): Touch | null {
  if (!t || typeof t !== "object") return null;
  const o = t as Record<string, unknown>;
  const ts = typeof o.ts === "number" && Number.isFinite(o.ts) ? o.ts : Date.now();
  return {
    source: clean(o.source)?.toLowerCase(),
    medium: clean(o.medium)?.toLowerCase(),
    campaign: clean(o.campaign),
    content: clean(o.content),
    term: clean(o.term),
    fbclid: clean(o.fbclid),
    gclid: clean(o.gclid),
    landing: clean(o.landing),
    referrer: clean(o.referrer),
    ts,
  };
}

export function sanitizeAttribution(a: unknown): Attribution {
  if (!a || typeof a !== "object") return {};
  const o = a as Record<string, unknown>;
  return { first: sanitizeTouch(o.first), last: sanitizeTouch(o.last) };
}

// Events and leads are credited to the last non-direct touch (what most ad platforms report).
export function creditedTouch(a: Attribution): Touch | null {
  return a.last || a.first || null;
}
