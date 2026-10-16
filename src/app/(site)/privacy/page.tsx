import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "Privacy Policy | D2C Growth Audit" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="16 October 2026">
      <p>
        This policy explains how {site.legalName} (&quot;we&quot;, &quot;us&quot;) collects and uses personal data on this website, in line with
        India&apos;s Digital Personal Data Protection Act, 2023 and the Information Technology Act, 2000.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li><b>Details you give us:</b> name, email, WhatsApp number, brand name, website, monthly ad spend range and the problem you describe.</li>
        <li><b>Payment details:</b> payments are processed by Razorpay. We receive the payment status and ID. We never see or store your card, UPI or bank details.</li>
        <li><b>Usage data:</b> pages visited, buttons clicked, the ad or link that brought you here (UTM parameters, fbclid, gclid), browser, device and IP address.</li>
      </ul>
      <h2>Cookies, Meta Pixel and Conversions API</h2>
      <p>
        We use the Meta Pixel and Meta Conversions API to measure how our Facebook and Instagram ads perform and to show our ads to relevant
        people. When you visit or buy, we share event data with Meta Platforms, Inc.: the page, the action (such as viewing pricing, submitting
        the form or completing payment), your IP address, browser details, Meta cookie IDs and, for form submissions and purchases, your email,
        phone and name in <b>hashed (SHA-256)</b> form. If enabled, we use Google Analytics and Google Ads conversion tracking in a similar way.
      </p>
      <p>
        You can decline tracking using the cookie notice on your first visit. To change your choice later, clear cookies for this site and choose
        again. You can also control ad preferences in your Facebook/Instagram settings and opt out of interest-based ads at{" "}
        <a href="https://www.facebook.com/adpreferences" target="_blank" rel="noopener noreferrer">facebook.com/adpreferences</a>.
      </p>
      <h2>How we use your data</h2>
      <ul>
        <li>To deliver the audit you bought: scheduling, the call, the report and support.</li>
        <li>To contact you about your audit by email or WhatsApp.</li>
        <li>To measure and improve our ads and this website.</li>
        <li>To meet legal, tax and accounting requirements.</li>
      </ul>
      <p>We do not sell your personal data.</p>
      <h2>Data you share for the audit</h2>
      <p>
        Read-only access to your Shopify, ad and analytics accounts is used only to perform your audit. We do not copy customer lists. Please
        remove our access once the audit and support period end.
      </p>
      <h2>Retention</h2>
      <p>We keep lead and purchase records for up to 3 years, or longer if the law requires it (for example, tax records).</p>
      <h2>Your rights</h2>
      <p>
        You can ask to access, correct or delete your personal data, or withdraw consent, by writing to us
        {site.contactEmail ? <> at <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a></> : " via the Contact page"}. We reply within 30 days.
      </p>
      <h2>Grievance officer</h2>
      <p>
        {site.legalName}
        {site.contactEmail ? `, ${site.contactEmail}` : ""}
        {site.address ? `, ${site.address}` : ""}
      </p>
    </LegalPage>
  );
}
