"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { trackPurchase } from "@/lib/tracking";
import { site } from "@/config/site";

type Status = { paid: boolean; value?: number; eventId?: string; transactionId?: string; firstName?: string; name?: string; email?: string };

export function ThankYou() {
  const lid = useSearchParams().get("lid") || "";
  const [status, setStatus] = useState<Status | null>(null);
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let tries = 0;
    // The webhook can land a few seconds after the redirect, so check a few times.
    async function check() {
      const res = await fetch(`/api/order-status?lid=${encodeURIComponent(lid)}`).catch(() => null);
      const data: Status = res ? await res.json().catch(() => ({ paid: false })) : { paid: false };
      if (cancelled) return;
      if (data.paid) {
        setStatus(data);
        trackPurchase(data.eventId!, data.value!, data.transactionId || data.eventId!);
      } else if (++tries < 5) {
        setTimeout(check, 2500);
      } else {
        setGaveUp(true);
      }
    }
    if (lid) check();
    else setGaveUp(true);
    return () => {
      cancelled = true;
    };
  }, [lid]);

  if (!status) {
    return (
      <div className="ty-card prose">
        <h1>{gaveUp ? "We couldn't confirm your payment yet" : "Confirming your payment…"}</h1>
        <p>
          {gaveUp
            ? `If money was debited, don't worry: it will be confirmed shortly. Write to us${site.contactEmail ? ` at ${site.contactEmail}` : ""} with your payment ID and we'll sort it out.`
            : "This takes a few seconds. Please don't close this page."}
        </p>
      </div>
    );
  }

  let bookingHref = "";
  if (site.bookingUrl) {
    const u = new URL(site.bookingUrl);
    if (status.name) u.searchParams.set("name", status.name);
    if (status.email) u.searchParams.set("email", status.email);
    bookingHref = u.toString();
  }

  return (
    <div className="ty-card prose">
      <span className="ok-badge">✓ Payment confirmed</span>
      <h1 style={{ marginTop: 16 }}>You&apos;re in, {status.firstName}! Let&apos;s find those leaks.</h1>
      <p>A payment receipt from Razorpay is on its way to your email. Here&apos;s what happens next:</p>
      <ol className="ty-steps">
        <li>
          <b>Book your 60-minute audit call</b>
          Pick a slot that works for you.
          {bookingHref && (
            <div style={{ marginTop: 12 }}>
              <a className="btn" href={bookingHref} target="_blank" rel="noopener noreferrer">Pick my slot <span className="arrow">→</span></a>
            </div>
          )}
        </li>
        <li>
          <b>Share read-only access before the call</b>
          Shopify staff account (Analytics, Orders, Online Store view), Meta Business Manager partner access (Analyst), GA4 Viewer and Google Ads read-only.
          You&apos;ll get exact steps on email.
        </li>
        <li>
          <b>Get your report within 48 hours of the call</b>
          Full audit, ₹ impact per issue, and your 30-day action plan, followed by {site.supportDays} days of WhatsApp support.
        </li>
      </ol>
    </div>
  );
}
