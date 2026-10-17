import Link from "next/link";
import { hasDb } from "@/lib/db";
import {
  DIMENSIONS, RANGES, getBreakdown, getDaily, getFunnel, getLeads, getLiveVisitors, getMetaHealth,
  parseDimension, parseRange, rangeStart, type DimensionKey, type RangeKey,
} from "@/lib/admin-data";
import { metaConfigured } from "@/lib/meta";
import { razorpayConfigured } from "@/lib/razorpay";
import { AutoRefresh } from "./AutoRefresh";

export const dynamic = "force-dynamic";

const pct = (a: number, b: number) => (b > 0 ? `${((a / b) * 100).toFixed(1)}%` : "–");
const inr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const fmtDuration = (s: number) => (s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`);
const fmtTime = (d: Date) =>
  d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

const AD_SPEND: Record<string, string> = {
  "under-2l": "< ₹2L", "2l-5l": "₹2–5L", "5l-10l": "₹5–10L", "10l-20l": "₹10–20L", "20l-plus": "₹20L+",
};

type SP = Promise<{ range?: string; dim?: string; status?: string }>;

export default async function AdminPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const range = parseRange(sp.range);
  const dim = parseDimension(sp.dim);
  const status = sp.status || "";

  if (!hasDb()) {
    return (
      <main className="container">
        <AdminBar range={range} dim={dim} status={status} />
        <div className="form-error" style={{ marginTop: 24 }}>DATABASE_URL is not set. Connect a Postgres database (see README) to start tracking.</div>
      </main>
    );
  }

  const since = rangeStart(range);
  let data;
  try {
    data = await Promise.all([
      getFunnel(since), getBreakdown(since, dim), getDaily(since), getMetaHealth(since), getLeads(since, status || null), getLiveVisitors(),
    ]);
  } catch (e) {
    console.error("admin data failed", e);
    return (
      <main className="container">
        <AdminBar range={range} dim={dim} status={status} />
        <div className="form-error" style={{ marginTop: 24 }}>
          Could not read the database: {(e as Error).message}. Check DATABASE_URL in Vercel → Settings → Environment Variables, then redeploy.
        </div>
      </main>
    );
  }
  const [funnel, breakdown, daily, health, leads, live] = data;

  const stages = [
    { label: "Visitors", n: funnel.visitors, help: "Unique visitors with a page view" },
    { label: "Saw pricing", n: funnel.engaged, help: "Scrolled to the pricing section" },
    { label: "Clicked CTA", n: funnel.ctaClicks, help: "Opened the booking form" },
    { label: "Leads", n: funnel.leads, help: "Submitted the form" },
    { label: "Checkout opened", n: funnel.checkouts, help: "Razorpay order created" },
    { label: "Paid", n: funnel.paid, help: "Payment verified" },
  ];
  const max = Math.max(1, ...stages.map((s) => s.n));
  const q = (o: Record<string, string>) => {
    const p = new URLSearchParams({ range, dim, ...(status ? { status } : {}), ...o });
    for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
    return `/admin?${p}`;
  };

  return (
    <main className="container" style={{ paddingBottom: 60 }}>
      <AdminBar range={range} dim={dim} status={status} />

      {(!metaConfigured() || !razorpayConfigured()) && (
        <div className="form-error" style={{ marginTop: 16 }}>
          {!razorpayConfigured() && <div>Razorpay keys are missing: payments will not work in production.</div>}
          {!metaConfigured() && <div>Meta Pixel ID or Conversions API token is missing: Meta events are not being sent.</div>}
        </div>
      )}

      <h2>Overview · {RANGES[range]}</h2>
      <div className="kpis">
        <Kpi l="Live now" v={live.toLocaleString("en-IN")} r="active in last 5 min" />
        <Kpi l="Visitors" v={funnel.visitors.toLocaleString("en-IN")} r="unique people" />
        <Kpi l="Sessions" v={funnel.sessions.toLocaleString("en-IN")} r="visits (30-min gap)" />
        <Kpi l="Pages / session" v={funnel.sessions ? (funnel.pageViews / funnel.sessions).toFixed(1) : "–"} />
        <Kpi l="Avg session" v={fmtDuration(funnel.avgSessionSeconds)} />
        <Kpi l="Leads" v={funnel.leads.toLocaleString("en-IN")} r={`${pct(funnel.leads, funnel.visitors)} of visitors`} />
        <Kpi l="Paid audits" v={funnel.paid.toLocaleString("en-IN")} r={`${pct(funnel.paid, funnel.visitors)} of visitors`} />
        <Kpi l="Revenue" v={inr(funnel.revenue)} />
        <Kpi l="Lead → paid" v={pct(funnel.paid, funnel.leads)} />
        <Kpi l="Failed payments" v={funnel.failedPayments.toLocaleString("en-IN")} />
      </div>

      <h2>Funnel</h2>
      <div className="funnel-bars" role="table" aria-label="Funnel">
        {stages.map((s, i) => (
          <div className="fb" role="row" key={s.label} title={`${s.help}: ${s.n}`}>
            <div role="cell">{s.label}</div>
            <div className="track" role="cell"><div className="fill" style={{ width: `${(s.n / max) * 100}%` }} /></div>
            <div className="n" role="cell">
              {s.n.toLocaleString("en-IN")}{" "}
              <span className="small">{i > 0 ? pct(s.n, stages[i - 1].n) : ""}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="small" style={{ marginTop: 8 }}>Percentages show conversion from the step above.</p>

      <h2>By {DIMENSIONS[dim].toLowerCase()}</h2>
      <div className="tabs" style={{ marginBottom: 10 }}>
        {(Object.keys(DIMENSIONS) as DimensionKey[]).map((d) => (
          <Link key={d} href={q({ dim: d })} className={d === dim ? "on" : ""}>{DIMENSIONS[d]}</Link>
        ))}
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>{DIMENSIONS[dim]}</th><th className="num">Visitors</th><th className="num">Sessions</th><th className="num">CTA clicks</th>
              <th className="num">Leads</th><th className="num">Paid</th><th className="num">Revenue</th><th className="num">Visitor → paid</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.length === 0 && <tr><td colSpan={8} className="small">No data yet.</td></tr>}
            {breakdown.map((r) => (
              <tr key={r.key}>
                <td>{r.key}</td><td className="num">{r.visitors}</td><td className="num">{r.sessions}</td><td className="num">{r.ctaClicks}</td>
                <td className="num">{r.leads}</td><td className="num">{r.paid}</td><td className="num">{inr(r.revenue)}</td>
                <td className="num">{pct(r.paid, r.visitors)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Daily</h2>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Day (IST)</th><th className="num">Visitors</th><th className="num">Sessions</th><th className="num">Leads</th><th className="num">Paid</th></tr></thead>
          <tbody>
            {daily.length === 0 && <tr><td colSpan={5} className="small">No data yet.</td></tr>}
            {daily.map((d) => (
              <tr key={d.day}><td>{d.day}</td><td className="num">{d.visitors}</td><td className="num">{d.sessions}</td><td className="num">{d.leads}</td><td className="num">{d.paid}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Leads</h2>
      <div className="tabs" style={{ marginBottom: 10 }}>
        {[["", "All"], ["paid", "Paid"], ["checkout", "Checkout, not paid"], ["lead", "Lead only"]].map(([v, l]) => (
          <Link key={v} href={q({ status: v })} className={v === status ? "on" : ""}>{l}</Link>
        ))}
        <a href={`/api/admin/export?range=${range}`} style={{ marginLeft: "auto" }}>Download CSV</a>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>When</th><th>Status</th><th>Founder</th><th>Brand</th><th>Ad spend</th><th>Source / campaign / ad</th><th>Problem</th></tr>
          </thead>
          <tbody>
            {leads.length === 0 && <tr><td colSpan={7} className="small">No leads in this range.</td></tr>}
            {leads.map((l) => (
              <tr key={l.id}>
                <td style={{ whiteSpace: "nowrap" }}>{fmtTime(l.created_at)}</td>
                <td><span className={`pill ${l.status}`}>{l.status}</span>{l.paid_at && <div className="small">{l.razorpay_payment_id}</div>}</td>
                <td>
                  <b>{l.name}</b>
                  <div className="small"><a href={`mailto:${l.email}`}>{l.email}</a></div>
                  <div className="small"><a href={`https://wa.me/${l.phone.length === 10 ? `91${l.phone}` : l.phone}`} target="_blank" rel="noopener noreferrer">{l.phone}</a></div>
                </td>
                <td>{l.brand}{l.website && <div className="small">{l.website}</div>}</td>
                <td style={{ whiteSpace: "nowrap" }}>{AD_SPEND[l.ad_spend || ""] || "–"}</td>
                <td>
                  {l.utm_source || "(direct)"}{l.utm_medium ? ` / ${l.utm_medium}` : ""}
                  {l.utm_campaign && <div className="small">{l.utm_campaign}</div>}
                  {l.utm_content && <div className="small">{l.utm_content}</div>}
                  <div className="small">{[l.fbclid && "fbclid", l.gclid && "gclid"].filter(Boolean).join(" · ")}</div>
                </td>
                <td className="small" style={{ maxWidth: 260 }}>{l.challenge || "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Tracking health (Meta Conversions API)</h2>
      <div className="kpis" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <Kpi l="Sent to Meta" v={String(health.sent)} />
        <Kpi l="Not sent (declined / internal)" v={String(health.skipped)} />
        <Kpi l="Errors" v={String(health.errors)} />
      </div>
      {health.lastErrors.length > 0 && (
        <div className="tbl-wrap" style={{ marginTop: 10 }}>
          <table className="tbl">
            <thead><tr><th>When</th><th>Event</th><th>Error</th></tr></thead>
            <tbody>
              {health.lastErrors.map((e, i) => (
                <tr key={i}><td>{fmtTime(e.at)}</td><td>{e.name}</td><td className="small">{e.status}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function Kpi({ l, v, r }: { l: string; v: string; r?: string }) {
  return (
    <div className="kpi">
      <div className="l">{l}</div>
      <div className="v">{v}</div>
      {r && <div className="r">{r}</div>}
    </div>
  );
}

function AdminBar({ range, dim, status }: { range: RangeKey; dim: DimensionKey; status: string }) {
  return (
    <div className="bar">
      <Link href="/" className="logo"><span className="logo-mark">DG</span> Funnel dashboard</Link>
      <div className="tabs">
        {(Object.keys(RANGES) as RangeKey[]).map((r) => (
          <Link key={r} href={`/admin?range=${r}&dim=${dim}${status ? `&status=${status}` : ""}`} className={r === range ? "on" : ""}>{RANGES[r]}</Link>
        ))}
      </div>
      <AutoRefresh />
      <form method="post" action="/api/admin/logout">
        <button className="btn btn-sm btn-ghost">Log out</button>
      </form>
    </div>
  );
}
