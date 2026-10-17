import "server-only";
import { db } from "./db";

export const RANGES = { today: "Today", "7d": "7 days", "30d": "30 days", "90d": "90 days", all: "All time" } as const;
export type RangeKey = keyof typeof RANGES;

export const DIMENSIONS = { utm_source: "Source", utm_campaign: "Campaign", utm_content: "Ad / content" } as const;
export type DimensionKey = keyof typeof DIMENSIONS;

const IST_OFFSET_MS = 5.5 * 3600 * 1000;

export function parseRange(v: string | null | undefined): RangeKey {
  return v && v in RANGES ? (v as RangeKey) : "30d";
}

export function parseDimension(v: string | null | undefined): DimensionKey {
  return v && v in DIMENSIONS ? (v as DimensionKey) : "utm_source";
}

// Ranges start at midnight India time.
export function rangeStart(v: string | null | undefined): Date {
  const key = parseRange(v);
  if (key === "all") return new Date(0);
  const days = key === "today" ? 0 : parseInt(key, 10) - 1;
  const istNow = new Date(Date.now() + IST_OFFSET_MS);
  const istMidnight = Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate()) - days * 86400000;
  return new Date(istMidnight - IST_OFFSET_MS);
}

export type Funnel = {
  visitors: number;
  sessions: number;
  pageViews: number;
  avgSessionSeconds: number;
  engaged: number;
  ctaClicks: number;
  leads: number;
  checkouts: number;
  paid: number;
  revenue: number; // rupees
  failedPayments: number;
};

export async function getFunnel(since: Date): Promise<Funnel> {
  const sql = await db();
  const [r] = await sql`
    SELECT
      count(DISTINCT visitor_id) FILTER (WHERE name = 'PageView')          AS visitors,
      count(DISTINCT coalesce(session_id, visitor_id)) FILTER (WHERE name = 'PageView') AS sessions,
      count(*)                   FILTER (WHERE name = 'PageView')          AS page_views,
      count(DISTINCT visitor_id) FILTER (WHERE name = 'ViewContent')       AS engaged,
      count(DISTINCT visitor_id) FILTER (WHERE name = 'CTAClick')          AS cta,
      count(DISTINCT lead_id)    FILTER (WHERE name = 'Lead')              AS leads,
      count(DISTINCT lead_id)    FILTER (WHERE name = 'InitiateCheckout')  AS checkouts,
      count(DISTINCT lead_id)    FILTER (WHERE name = 'Purchase')          AS paid,
      coalesce(sum(value)        FILTER (WHERE name = 'Purchase'), 0)      AS revenue,
      count(*)                   FILTER (WHERE name = 'PaymentFailed')     AS failed
    FROM audit_events WHERE created_at >= ${since}`;
  // Session length = first to last event (pings included) within the session.
  const [d] = await sql`
    SELECT coalesce(avg(secs), 0) AS avg_secs FROM (
      SELECT extract(epoch FROM max(created_at) - min(created_at)) AS secs
      FROM audit_events WHERE created_at >= ${since} AND session_id IS NOT NULL
      GROUP BY session_id
    ) s`;
  return {
    visitors: Number(r.visitors),
    sessions: Number(r.sessions),
    pageViews: Number(r.page_views),
    avgSessionSeconds: Math.round(Number(d.avg_secs)),
    engaged: Number(r.engaged),
    ctaClicks: Number(r.cta),
    leads: Number(r.leads),
    checkouts: Number(r.checkouts),
    paid: Number(r.paid),
    revenue: Number(r.revenue) / 100,
    failedPayments: Number(r.failed),
  };
}

export type BreakdownRow = { key: string; visitors: number; sessions: number; ctaClicks: number; leads: number; paid: number; revenue: number };

export async function getBreakdown(since: Date, dim: DimensionKey): Promise<BreakdownRow[]> {
  const sql = await db();
  const rows = await sql`
    SELECT coalesce(nullif(${sql(dim)}, ''), '(direct / none)') AS key,
      count(DISTINCT visitor_id) FILTER (WHERE name = 'PageView')  AS visitors,
      count(DISTINCT coalesce(session_id, visitor_id)) FILTER (WHERE name = 'PageView') AS sessions,
      count(DISTINCT visitor_id) FILTER (WHERE name = 'CTAClick')  AS cta,
      count(DISTINCT lead_id)    FILTER (WHERE name = 'Lead')      AS leads,
      count(DISTINCT lead_id)    FILTER (WHERE name = 'Purchase')  AS paid,
      coalesce(sum(value)        FILTER (WHERE name = 'Purchase'), 0) AS revenue
    FROM audit_events WHERE created_at >= ${since}
    GROUP BY 1 ORDER BY paid DESC, leads DESC, visitors DESC LIMIT 50`;
  return rows.map((r) => ({
    key: String(r.key),
    visitors: Number(r.visitors),
    sessions: Number(r.sessions),
    ctaClicks: Number(r.cta),
    leads: Number(r.leads),
    paid: Number(r.paid),
    revenue: Number(r.revenue) / 100,
  }));
}

export type DailyRow = { day: string; visitors: number; sessions: number; leads: number; paid: number };

export async function getDaily(since: Date): Promise<DailyRow[]> {
  const sql = await db();
  const rows = await sql`
    SELECT to_char((created_at AT TIME ZONE 'Asia/Kolkata')::date, 'YYYY-MM-DD') AS day,
      count(DISTINCT visitor_id) FILTER (WHERE name = 'PageView') AS visitors,
      count(DISTINCT coalesce(session_id, visitor_id)) FILTER (WHERE name = 'PageView') AS sessions,
      count(DISTINCT lead_id)    FILTER (WHERE name = 'Lead')     AS leads,
      count(DISTINCT lead_id)    FILTER (WHERE name = 'Purchase') AS paid
    FROM audit_events WHERE created_at >= ${since}
    GROUP BY 1 ORDER BY 1 DESC LIMIT 30`;
  return rows.map((r) => ({ day: String(r.day), visitors: Number(r.visitors), sessions: Number(r.sessions), leads: Number(r.leads), paid: Number(r.paid) }));
}

// Visitors with any activity (page view, scroll, click or the 60s ping) in the last 5 minutes.
export async function getLiveVisitors(): Promise<number> {
  const sql = await db();
  const [r] = await sql`
    SELECT count(DISTINCT visitor_id) AS n FROM audit_events
    WHERE created_at >= now() - interval '5 minutes' AND visitor_id IS NOT NULL`;
  return Number(r.n);
}

export type MetaHealth = { sent: number; skipped: number; errors: number; lastErrors: { name: string; status: string; at: Date }[] };

export async function getMetaHealth(since: Date): Promise<MetaHealth> {
  const sql = await db();
  const [c] = await sql`
    SELECT count(*) FILTER (WHERE meta_status = 'sent') AS sent,
           count(*) FILTER (WHERE meta_status = 'skipped') AS skipped,
           count(*) FILTER (WHERE meta_status LIKE 'error:%' OR meta_status = 'pending') AS errors
    FROM audit_events WHERE created_at >= ${since} AND name <> 'Ping'`;
  const last = await sql<{ name: string; meta_status: string; created_at: Date }[]>`
    SELECT name, meta_status, created_at FROM audit_events
    WHERE created_at >= ${since} AND meta_status LIKE 'error:%' ORDER BY created_at DESC LIMIT 5`;
  return {
    sent: Number(c.sent),
    skipped: Number(c.skipped),
    errors: Number(c.errors),
    lastErrors: last.map((r) => ({ name: r.name, status: r.meta_status, at: r.created_at })),
  };
}

export type LeadListRow = {
  id: string;
  created_at: Date;
  status: string;
  name: string;
  email: string;
  phone: string;
  brand: string;
  website: string | null;
  ad_spend: string | null;
  challenge: string | null;
  amount: number;
  paid_at: Date | null;
  razorpay_payment_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  fbclid: string | null;
  gclid: string | null;
  landing_url: string | null;
};

export async function getLeads(since: Date, status: string | null): Promise<LeadListRow[]> {
  const sql = await db();
  const filter = status === "paid" || status === "checkout" || status === "lead" ? status : null;
  return sql<LeadListRow[]>`
    SELECT id, created_at, status, name, email, phone, brand, website, ad_spend, challenge, amount, paid_at,
           razorpay_payment_id, utm_source, utm_medium, utm_campaign, utm_content, fbclid, gclid, landing_url
    FROM audit_leads
    WHERE created_at >= ${since} ${filter ? sql`AND status = ${filter}` : sql``}
    ORDER BY created_at DESC LIMIT 200`;
}
