import Image from "next/image";
import { CtaButton } from "@/components/Checkout";
import { ViewTracker } from "@/components/ViewTracker";
import { Header, Footer, WhatsAppButton } from "@/components/Chrome";
import { priceLabel, site } from "@/config/site";

const PAINS = [
  "ROAS in Ads Manager looks fine, but the money isn't showing up in the bank",
  "Every time you push budget, CAC shoots up and you pull back",
  "1 in 4 COD orders comes back as RTO",
  "Meta, Shopify and GA4 all show different numbers. You don't know which to trust",
  "Traffic is coming in, but the conversion rate is stuck under 1.5%",
  "You don't actually know your CM2 or CM3, so you don't know if you make money per order",
];

const PILLARS = [
  {
    t: "Ads & attribution",
    d: "Meta, Google and WhatsApp: account structure, creatives, audiences, wasted spend and where attribution is leaking.",
    o: "Which campaigns to cut, which to scale, and the ROAS you can actually trust.",
  },
  {
    t: "Shopify CRO",
    d: "Landing pages, product pages, cart and checkout drop-off, page speed and trust signals on mobile.",
    o: "The top fixes that lift conversion rate, in priority order.",
  },
  {
    t: "Unit economics",
    d: "CAC, AOV, CM1 → CM2 → CM3. Shipping, payment gateway, returns and discounts, all in one view.",
    o: "Whether each order makes or loses money, and why.",
  },
  {
    t: "RTO & COD control",
    d: "Pin-code risk, COD to prepaid nudges, NDR flow, address verification and courier mix.",
    o: "A plan to bring RTO down without killing COD conversions.",
  },
  {
    t: "AOV growth",
    d: "Bundles, upsells, free-shipping threshold and offer structure, based on your real order data.",
    o: "2–3 offers to test that raise order value.",
  },
  {
    t: "Retention",
    d: "WhatsApp and email flows, repeat purchase rate and post-purchase journey.",
    o: "The flows that bring buyers back without paying for them again.",
  },
];

const STEPS = [
  { t: "Book & share details", d: "Pay, pick a slot and fill a 5-minute form. Share read-only access to Shopify and ad accounts." },
  { t: "60-min live audit", d: "We open your accounts together on a call. Most leaks get spotted live, with you watching." },
  { t: "Deep dive", d: "I go through the data after the call and put a ₹ number on every leak I find." },
  { t: "Report in 48 hours", d: "Your full report and 30-day action plan land in your inbox." },
];

const DELIVERABLES = [
  "60-min live audit call + recording",
  "Full-funnel audit report (Notion + PDF)",
  "₹ impact estimate for every issue",
  "Priority matrix: what to fix first",
  "30-day action plan your team can run",
  `${site.supportDays} days of WhatsApp support`,
];

const STACK: [string, number][] = [
  ["60-min live audit call with screen share", 15000],
  ["Full-funnel audit report (ads, CRO, RTO, retention)", 20000],
  ["Unit economics & CM3 breakdown", 10000],
  ["30-day action plan, priority ordered", 10000],
  [`${site.supportDays} days of WhatsApp support while you implement`, 5000],
];
const STACK_TOTAL = STACK.reduce((s, [, v]) => s + v, 0);
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const FAQS = [
  {
    q: "Will you also implement the fixes?",
    a: "The audit tells you exactly what to fix and in what order, so your team or agency can execute it. If you'd like me to implement, we can talk about that separately after the audit.",
  },
  {
    q: "What access do you need? Is my data safe?",
    a: "Read-only access only: Shopify staff account with limited permissions, Meta Business Manager partner access (Analyst), GA4 Viewer and Google Ads read-only. I never ask for passwords. Remove access any time after the audit.",
  },
  {
    q: "My agency already runs our ads. Do I still need this?",
    a: "Yes. This is an independent second opinion. Most leaks sit outside Ads Manager: checkout, RTO, margins and attribution, which agencies often don't look at.",
  },
  {
    q: "Who is this for?",
    a: "Shopify D2C brands in India spending up to about ₹20L a month on ads who feel stuck: CAC rising, ROAS flat, or growth that isn't turning into profit.",
  },
  {
    q: "How soon will I get the report?",
    a: "Within 48 hours of the call, by email. Then you have WhatsApp support for 15 days while you implement.",
  },
  {
    q: "What if I need to reschedule?",
    a: "No problem. Reschedule up to 12 hours before your slot. See the refund policy for the full details.",
  },
];

export default function Home() {
  return (
    <>
      <Header />
      <main>
        {/* 1. Hero */}
        <section className="hero grid-bg">
          <div className="container hero-grid">
            <div>
              <span className="eyebrow">D2C growth audit · for Shopify brands</span>
              <h1>
                Your ads aren&apos;t the problem. Your <span className="u hl">leaks</span> are.
              </h1>
              <p className="sub">
                A full audit of your D2C brand (ads, attribution, Shopify CRO, RTO and unit economics) by someone who has managed{" "}
                <b>₹15Cr+ in ad spend</b>. Find exactly where money is leaking, with a <span className="u">₹ number on every fix</span>.
              </p>
              <div className="hero-cta">
                <CtaButton location="hero">Book my audit · {priceLabel} <span className="arrow">→</span></CtaButton>
                <span className="price-note">Only {site.monthlySlots} audits per month</span>
              </div>
              <div className="chips">
                <span>60-min live call</span>
                <span>Report in 48 hrs</span>
                <span>{site.supportDays} days support</span>
              </div>
            </div>
            <div className="card" aria-label="About Deepak Gupta">
              <div className="mentor-head">
                <Image className="avatar" src="/deepak.jpg" alt="Deepak Gupta" width={84} height={84} priority />
                <div>
                  <span className="eyebrow" style={{ fontSize: 12 }}>Your auditor</span>
                  <div className="name">Deepak Gupta</div>
                  <div className="role">Performance Marketing Lead, D2C · 5 yrs</div>
                </div>
              </div>
              <div className="stat-grid">
                <div className="stat"><b>₹15Cr+</b><span>ad spend managed in the last 2 years</span></div>
                <div className="stat"><b>4.5X</b><span>average blended ROAS</span></div>
                <div className="stat"><b>25% → 8%</b><span>RTO cut for a D2C brand</span></div>
                <div className="stat"><b>₹1,500 → ₹500</b><span>CAC, by fixing CRO &amp; attribution</span></div>
              </div>
              <div className="card-foot"><span className="tag">SHOPIFY</span> Fashion · Beauty · FMCG · Kidswear · Games</div>
            </div>
          </div>
        </section>
        <div className="strip">
          <div className="container">
            <div><b>&lt;10%</b><span>RTO across brands</span></div>
            <div><b>60%</b><span>prepaid orders on avg.</span></div>
            <div><b>30%</b><span>avg. MoM growth</span></div>
            <div><b>CM3+</b><span>profitable, not just high ROAS</span></div>
          </div>
        </div>

        {/* 2. Problem */}
        <section className="section" id="problem">
          <div className="container">
            <span className="eyebrow">Sound familiar?</span>
            <h2 className="h2">Spending on ads every month, but <span className="u">growth is stuck</span>?</h2>
            <div className="pain-grid">
              {PAINS.map((p) => (
                <div className="pain" key={p}><span className="x">✕</span>{p}</div>
              ))}
            </div>
            <div className="callout">
              Most D2C brands don&apos;t have a traffic problem. They have a <span className="u hl">leak problem</span>. More budget only makes the leak bigger.
            </div>
          </div>
        </section>

        {/* 3. What I audit */}
        <section className="section grid-bg" id="audit">
          <div className="container">
            <span className="eyebrow">What I audit</span>
            <h2 className="h2">6 areas. End to end. <span className="u">Beyond Ads Manager.</span></h2>
            <p className="lead">Your ad account is only one part of the funnel. I look at everything between the ad click and the money in your bank.</p>
            <div className="pillar-grid">
              {PILLARS.map((p, i) => (
                <div className="pillar" key={p.t}>
                  <span className="num">0{i + 1}</span>
                  <h3>{p.t}</h3>
                  <p>{p.d}</p>
                  <div className="out"><b>You&apos;ll know:</b> {p.o}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. How it works */}
        <section className="section" id="how">
          <div className="container">
            <span className="eyebrow">How it works</span>
            <h2 className="h2">From booking to a clear plan in <span className="u">under a week</span>.</h2>
            <div className="steps">
              {STEPS.map((s, i) => (
                <div className="step" key={s.t}>
                  <div className="dot">{i + 1}</div>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </div>
              ))}
            </div>
            <h3 style={{ marginTop: 48, fontSize: 22 }}>What you get</h3>
            <ul className="deliver">
              {DELIVERABLES.map((d) => <li key={d}>{d}</li>)}
            </ul>
          </div>
        </section>

        {/* 5. About */}
        <section className="section grid-bg" id="about">
          <div className="container">
            <span className="eyebrow">Who&apos;s auditing your brand</span>
            <h2 className="h2">Hi, I&apos;m <span className="u hl">Deepak Gupta</span>.</h2>
            <div className="about">
              <Image className="about-photo" src="/deepak.jpg" alt="Deepak Gupta" width={320} height={320} />
              <div>
                <p className="bio">
                  I lead performance marketing for D2C brands on Shopify: <b>fashion &amp; apparel, beauty &amp; personal care, FMCG, kidswear and card games</b>.
                  In the last 2 years I have spent <b>₹15Cr+</b> on ads across Meta, Google, Amazon, Blinkit and WhatsApp.
                </p>
                <p className="bio">
                  I work <b>directly with founders</b>. No middlemen. I know what you ask, which numbers you check and what keeps you up at night.
                  I also interview marketers for in-house D2C roles, so I know what good looks like from the inside.
                </p>
                <div className="proof-grid">
                  <div className="proof"><b>&lt;10%</b><span>RTO across brands, some under 4%</span></div>
                  <div className="proof"><b>60%</b><span>prepaid orders on average</span></div>
                  <div className="proof"><b>30%</b><span>average month-on-month growth</span></div>
                  <div className="proof"><b>CM3 positive</b><span>brands, not just high ROAS</span></div>
                  <div className="proof"><b>₹1,000–4,500</b><span>AOV range handled</span></div>
                  <div className="proof"><b>5 categories</b><span>of Shopify D2C brands</span></div>
                </div>
                <p className="disclaimer">
                  Numbers are from brands I have worked with. Every brand is different. Your results depend on your product, margins and how the fixes are executed.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Pricing */}
        <section className="section" id="pricing">
          <ViewTracker name="pricing">
            <div className="container">
              <span className="eyebrow">Pricing</span>
              <h2 className="h2">Over <span className="u hl">20x the value</span> for less than one day of ad spend.</h2>
              <div className="price-wrap">
                <div className="stack">
                  <table>
                    <tbody>
                      {STACK.map(([label, v]) => (
                        <tr key={label}><td>{label}</td><td>{inr(v)}</td></tr>
                      ))}
                      <tr className="total"><td>Total value</td><td>{inr(STACK_TOTAL)}</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="buy">
                  <span className="eyebrow">D2C growth audit</span>
                  <div className="amount">{priceLabel} <small>one time</small></div>
                  <p className="vs">One fixed price. No retainers, no lock-in.</p>
                  <div className="support">
                    <b>{site.supportDays}-day implementation support</b>
                    Stuck while applying a fix? Message me on WhatsApp and get an answer within 24 hours (Mon–Sat) for {site.supportDays} days after your report.
                  </div>
                  <CtaButton location="pricing" className="btn btn-block">Claim my audit slot <span className="arrow">→</span></CtaButton>
                  <p className="fine">Only {site.monthlySlots} audits per month · Secure payment via Razorpay</p>
                </div>
              </div>
            </div>
          </ViewTracker>
        </section>

        {/* 7. FAQ + final CTA */}
        <section className="section grid-bg" id="faq">
          <div className="container">
            <span className="eyebrow">FAQ</span>
            <h2 className="h2">Questions founders ask</h2>
            <div className="faq">
              {FAQS.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
            <div className="final">
              <h2>Every month you wait, <span className="u hl">the leak keeps costing you</span>.</h2>
              <p>One call. A clear report. A 30-day plan. Find out where your money is going, for {priceLabel}.</p>
              <CtaButton location="final">Book my audit · {priceLabel} <span className="arrow">→</span></CtaButton>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
      <div className="sticky-cta">
        <div className="row">
          <div className="p">{priceLabel}<small>{site.monthlySlots} slots / month</small></div>
          <CtaButton location="sticky_mobile">Book my audit <span className="arrow">→</span></CtaButton>
        </div>
      </div>
    </>
  );
}
