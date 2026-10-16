import Link from "next/link";
import { CtaButton } from "./Checkout";
import { priceLabel, site } from "@/config/site";

export function Header({ cta = true }: { cta?: boolean }) {
  return (
    <header className="header">
      <div className="container">
        <Link href="/" className="logo">
          <span className="logo-mark">DG</span> Deepak Gupta
        </Link>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span className="header-meta">D2C GROWTH AUDIT · {priceLabel}</span>
          {cta && <CtaButton location="header" className="btn btn-sm">Book audit</CtaButton>}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <nav aria-label="Legal">
          <Link href="/terms">Terms &amp; Conditions</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/refund-policy">Cancellation &amp; Refund</Link>
          <Link href="/delivery-policy">Service Delivery</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <div>© {new Date().getFullYear()} {site.legalName}. All rights reserved.</div>
        <p className="meta-note">
          This site is not a part of the Facebook™ website or Meta Platforms, Inc., and is not endorsed by Meta in any way. Facebook™ and
          Instagram™ are trademarks of Meta Platforms, Inc. Google™ is a trademark of Google LLC. Results mentioned are from past work and are
          not a promise of future results.
        </p>
      </div>
    </footer>
  );
}

export function WhatsAppButton() {
  if (!site.whatsappNumber) return null;
  const text = encodeURIComponent("Hi Deepak, I have a question about the D2C audit.");
  return (
    <a className="wa" href={`https://wa.me/${site.whatsappNumber}?text=${text}`} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4C2.7 15.6 2.2 13.8 2.2 12 2.2 6.6 6.6 2.2 12 2.2c2.6 0 5.1 1 6.9 2.9 1.8 1.8 2.9 4.3 2.9 6.9 0 5.4-4.4 9.8-9.8 9.8zm8.3-18.1C18.1 1.5 15.1.3 12 .3 5.5.3.3 5.5.3 12c0 2.1.5 4.1 1.6 5.9L.2 23.8l6-1.6c1.7.9 3.7 1.4 5.7 1.4 6.5 0 11.7-5.2 11.7-11.7.1-3.1-1.1-6.1-3.3-8.2z" />
      </svg>
    </a>
  );
}
