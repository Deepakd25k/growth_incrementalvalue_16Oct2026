import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "Cancellation & Refund Policy | D2C Growth Audit" };

export default function Refund() {
  return (
    <LegalPage title="Cancellation & Refund Policy" updated="16 October 2026">
      <p>
        The {site.product} is a personalised service. Your slot is reserved for you as soon as you pay, and we limit the number of audits each
        month, so the fee is <b>non-refundable</b> once paid, except in the cases below.
      </p>
      <h2>Rescheduling</h2>
      <p>You can reschedule your call once, free of charge, up to 12 hours before the booked time.</p>
      <h2>When you get a full refund</h2>
      <ul>
        <li>We are unable to hold your audit call within 30 days of your payment.</li>
        <li>You were charged more than once for the same order.</li>
      </ul>
      <p>Approved refunds are made to the original payment method within 5–7 working days.</p>
      <h2>Support instead of refunds</h2>
      <p>
        If something in your report is unclear, you have {site.supportDays} days of WhatsApp support to get answers while you implement the plan.
      </p>
      <h2>How to request</h2>
      <p>
        Write to {site.contactEmail ? <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> : "us via the Contact page"} with your
        payment ID.
      </p>
    </LegalPage>
  );
}
