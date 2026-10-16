import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "Service Delivery Policy | D2C Growth Audit" };

export default function Delivery() {
  return (
    <LegalPage title="Service Delivery Policy" updated="16 October 2026">
      <p>The {site.product} is a digital service. Nothing is shipped physically.</p>
      <ul>
        <li><b>Booking:</b> after payment you get a link to book your call. Calls are usually held within 7 days of booking.</li>
        <li><b>Audit call:</b> 60 minutes over video call (Google Meet or Zoom).</li>
        <li><b>Report:</b> sent to your email within 48 hours of the call.</li>
        <li><b>Support:</b> {site.supportDays} days of WhatsApp support from the date the report is sent.</li>
      </ul>
      <p>
        If you haven&apos;t received your booking link or report on time, contact{" "}
        {site.contactEmail ? <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> : "us via the Contact page"}.
      </p>
    </LegalPage>
  );
}
