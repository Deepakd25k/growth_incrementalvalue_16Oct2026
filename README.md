# D2C Growth Audit: landing page + funnel tracking

Next.js landing page for a ₹2,999 D2C audit. It includes Razorpay checkout, Meta Pixel + Conversions API (deduplicated), optional GA4/Google Ads, and a password-protected `/admin` funnel dashboard. It deploys to Vercel.

## How the funnel is tracked

```
Ad click (utm_*, fbclid, gclid)
  → PageView         Pixel + CAPI (same event_id)       → DB
  → ViewContent      pricing section seen               → DB, Pixel + CAPI
  → CTAClick         booking form opened                → DB only
  → Lead             form submitted (server-created)    → DB, Pixel + CAPI, GA4 generate_lead
  → InitiateCheckout Razorpay order created             → DB, Pixel + CAPI, GA4 begin_checkout
  → Purchase         payment signature verified         → DB, Pixel + CAPI, GA4 purchase, Google Ads conversion
```

**No double counting:**
- Every browser Pixel event and its server CAPI copy share one `event_id`, so Meta keeps only one.
- Lead, InitiateCheckout and Purchase are created only by the server. `/api/track` rejects them, so they can't be faked from the browser.
- Purchase is sent exactly once. That holds whether the browser callback or the Razorpay webhook arrives first, because of an atomic `status <> 'paid'` update. The thank-you page fires the browser Purchase only after the server confirms the payment, and only once per browser. GA4 and Google Ads also dedupe on `transaction_id`.
- Pixel `autoConfig` is off, so Meta's automatic button-click events don't add noise.
- `PageView` is guarded against React double effects. GA4 page views come from GA4 itself, never sent manually.

**Attribution:** the last non-direct touch (UTMs, `fbclid`, `gclid`, or an external referrer) is kept for 30 days. Every event and lead is credited to it. The first touch is stored on the lead too. `_fbc` and `_fbp` are created in Meta's own format, so browser and server send identical values. Email, phone and name are SHA-256 hashed before going to Meta.

**Consent:** visitors see a notice (India DPDP model) and can decline. Declining revokes the Pixel and Google tags and stops all CAPI sends for that visitor. Our own first-party funnel counts still work.

## Use these UTMs in your ads

Meta ads (URL parameters field):
```
utm_source=facebook&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}
```
Google Ads (final URL suffix):
```
utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={creative}&utm_term={keyword}
```

## Deploy on Vercel

1. **Import the repo:** Vercel → Add New → Project → pick this GitHub repo. The framework is detected as Next.js.
2. **Database:** Project → Storage → Create → **Neon (Postgres)** → connect to the project. This adds `DATABASE_URL`. Tables are created on first request.
3. **Environment variables:** add everything from `.env.example` under Project → Settings → Environment Variables. `ADMIN_SESSION_SECRET` needs 32+ random characters (`openssl rand -hex 32`).
4. **Razorpay:**
   - Copy the API keys into `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` (use test keys first).
   - Webhooks → add `https://YOURDOMAIN/api/razorpay/webhook` with events `payment.captured`, `order.paid` and `payment.failed`. Put the secret you set there into `RAZORPAY_WEBHOOK_SECRET`.
   - Turn on automatic capture (Settings → Payment Capture).
5. **Meta:**
   - Events Manager → your dataset → Settings. Copy the Pixel ID and generate a Conversions API access token.
   - Add the domain under Business Settings → Brand Safety → Domains and verify it.
   - Test: set `META_TEST_EVENT_CODE`, redeploy, open the site and check the **Test events** tab. Each event should show *Browser* and *Server* with "Deduplicated". Then remove the test code and redeploy.
6. **Redeploy**, open `/admin`, and log in.

## Before running ads (checklist)

- [ ] Real email, WhatsApp, booking link and business address set (Razorpay and Meta both review the Contact page).
- [ ] Razorpay live keys, with the webhook pointing at the production domain.
- [ ] One real ₹2,999 test purchase made and seen in `/admin` and Meta Test Events (refund it from Razorpay afterwards).
- [ ] Tracking health on `/admin` shows 0 errors.
- [ ] Domain verified in Meta Business Manager. Purchase prioritised in Aggregated Event Measurement if asked.

## Local development

```bash
cp .env.example .env.local   # fill DATABASE_URL + admin vars at minimum
npm install
npm run dev
```
Without Razorpay keys, local dev uses a simulated payment so you can test the whole funnel. This is never enabled in production.

## Where to change things

| What | File |
|---|---|
| Price, slots, support days | `src/config/site.ts` |
| Landing page copy (7 sections) | `src/app/(site)/page.tsx` |
| Colours, grid, layout | `src/app/globals.css` |
| Legal pages | `src/app/(site)/{privacy,terms,refund-policy,delivery-policy,contact}` |
| Photo | `public/deepak.jpg` (replace with a high-res square photo) |
