import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { priceLabel, site } from "@/config/site";

export const metadata: Metadata = { title: "Terms & Conditions | D2C Growth Audit" };

export default function Terms() {
  return (
    <LegalPage title="Terms & Conditions" updated="16 October 2026">
      <p>
        These terms apply to the {site.product} (&quot;the Service&quot;) offered by {site.legalName} through this website. By paying for the
        Service you agree to them.
      </p>
      <h2>The Service</h2>
      <ul>
        <li>One 60-minute live audit call over video, recorded and shared with you.</li>
        <li>A written audit report and a 30-day action plan, sent by email within 48 hours of the call.</li>
        <li>{site.supportDays} days of WhatsApp support from the day the report is sent, with replies within 24 hours, Monday to Saturday.</li>
      </ul>
      <p>Implementation of the recommendations is not part of the Service unless agreed separately in writing.</p>
      <h2>Price and payment</h2>
      <p>The price is {priceLabel}, paid in advance through Razorpay. Applicable taxes, if any, are shown at checkout.</p>
      <h2>Your responsibilities</h2>
      <p>
        You need to give read-only access to the accounts we audit before the call, and confirm that you are authorised to give that access. If
        access is not shared, the audit will be based only on what can be reviewed on the call.
      </p>
      <h2>No guaranteed results</h2>
      <p>
        The audit gives expert recommendations and estimates. Outcomes depend on your product, market, margins and execution, so we do not
        guarantee any specific revenue, ROAS, CAC or other result. Figures on this website describe past work and are not a promise.
      </p>
      <h2>Confidentiality</h2>
      <p>We keep your business data confidential and use it only to deliver the Service.</p>
      <h2>Liability</h2>
      <p>Our total liability for the Service is limited to the amount you paid for it.</p>
      <h2>Cancellation and refunds</h2>
      <p>See our <Link href="/refund-policy">Cancellation &amp; Refund Policy</Link>.</p>
      <h2>Governing law</h2>
      <p>These terms are governed by the laws of India.</p>
    </LegalPage>
  );
}
