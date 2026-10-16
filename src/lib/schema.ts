// Funnel tracking schema. Applied automatically on first DB use (see db.ts); safe to run repeatedly.
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS leads (
  id                   uuid PRIMARY KEY,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  visitor_id           text,
  name                 text NOT NULL,
  email                text NOT NULL,
  phone                text NOT NULL,
  brand                text NOT NULL,
  website              text,
  ad_spend             text,
  challenge            text,
  status               text NOT NULL DEFAULT 'lead',   -- lead | checkout | paid
  amount               integer NOT NULL,               -- paise
  currency             text NOT NULL DEFAULT 'INR',
  razorpay_order_id    text UNIQUE,
  razorpay_payment_id  text,
  paid_at              timestamptz,
  utm_source           text,
  utm_medium           text,
  utm_campaign         text,
  utm_content          text,
  utm_term             text,
  fbclid               text,
  gclid                text,
  first_touch          jsonb,
  last_touch           jsonb,
  landing_url          text,
  fbp                  text,
  fbc                  text,
  ip                   text,
  user_agent           text,
  consent              boolean NOT NULL DEFAULT true,
  notes                text
);
CREATE INDEX IF NOT EXISTS leads_created_idx ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS leads_email_idx ON leads (lower(email));

CREATE TABLE IF NOT EXISTS events (
  id            bigserial PRIMARY KEY,
  event_id      text NOT NULL UNIQUE,
  name          text NOT NULL,           -- PageView | ViewContent | CTAClick | Lead | InitiateCheckout | Purchase | PaymentFailed
  visitor_id    text,
  lead_id       uuid,
  path          text,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  utm_content   text,
  utm_term      text,
  has_fbclid    boolean NOT NULL DEFAULT false,
  has_gclid     boolean NOT NULL DEFAULT false,
  value         integer,                 -- paise
  meta_status   text,                    -- sent | skipped | error:<msg>
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS events_created_idx ON events (created_at DESC);
CREATE INDEX IF NOT EXISTS events_name_created_idx ON events (name, created_at DESC);
CREATE INDEX IF NOT EXISTS events_visitor_idx ON events (visitor_id);
`;
