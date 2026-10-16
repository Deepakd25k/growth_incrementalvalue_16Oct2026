import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "Contact | D2C Growth Audit" };

export default function Contact() {
  return (
    <LegalPage title="Contact us" updated="16 October 2026">
      <p>Questions about the audit, a payment or your data? Reach out and we&apos;ll reply within 24 hours (Mon–Sat).</p>
      <ul>
        <li><b>Name:</b> {site.legalName}</li>
        {site.contactEmail && <li><b>Email:</b> <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a></li>}
        {site.whatsappNumber && <li><b>WhatsApp:</b> <a href={`https://wa.me/${site.whatsappNumber}`}>+{site.whatsappNumber}</a></li>}
        {site.address && <li><b>Address:</b> {site.address}</li>}
      </ul>
    </LegalPage>
  );
}
