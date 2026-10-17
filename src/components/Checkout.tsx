"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAttribution, sessionId, trackCtaClick, trackInitiateCheckout, trackLead, visitorId } from "@/lib/tracking";
import { priceLabel, site } from "@/config/site";

type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayInstance = { open: () => void; on: (event: string, cb: (r: { error?: { description?: string } }) => void) => void };
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

const CheckoutContext = createContext<{ open: (location: string) => void }>({ open: () => {} });
export const useCheckout = () => useContext(CheckoutContext);

const AD_SPEND_OPTIONS = [
  ["under-2l", "Under ₹2L / month"],
  ["2l-5l", "₹2L – ₹5L / month"],
  ["5l-10l", "₹5L – ₹10L / month"],
  ["10l-20l", "₹10L – ₹20L / month"],
  ["20l-plus", "₹20L+ / month"],
] as const;

type Form = { name: string; email: string; phone: string; brand: string; website: string; adSpend: string; challenge: string };
const EMPTY: Form = { name: "", email: "", phone: "", brand: "", website: "", adSpend: "", challenge: "" };

function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function CheckoutProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isOpen, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [badFields, setBadFields] = useState<string[]>([]);

  const open = useCallback((location: string) => {
    trackCtaClick(location);
    setError("");
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, busy]);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function verifyAndFinish(r: RazorpayResponse) {
    const res = await fetch("/api/payment/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.leadId) {
      setBusy(false);
      setError(`Payment received but we could not confirm it automatically. Please contact us with payment ID ${r.razorpay_payment_id}.`);
      return;
    }
    router.push(`/thank-you?lid=${data.leadId}`);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setBadFields([]);

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, visitor_id: visitorId(), session_id: sessionId(), attribution: getAttribution(), url: location.href.split("#")[0] }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    if (!res || !res.ok) {
      setBusy(false);
      setBadFields(data.fields || []);
      setError(data.error || "Something went wrong. Please try again.");
      return;
    }

    const value = data.amount / 100;
    if (data.leadEventId) trackLead(data.leadEventId, value);
    trackInitiateCheckout(data.checkoutEventId, value);

    if (data.mock) {
      // Local development only: the server refuses mock payments in production.
      if (window.confirm(`DEV MODE: simulate a successful ${priceLabel} payment?`)) {
        await verifyAndFinish({ razorpay_order_id: data.orderId, razorpay_payment_id: `pay_mock_${Date.now()}`, razorpay_signature: "mock" });
      } else setBusy(false);
      return;
    }

    if (!(await loadRazorpay()) || !window.Razorpay) {
      setBusy(false);
      setError("Could not load the payment window. Check your connection and try again.");
      return;
    }
    const rzp = new window.Razorpay({
      key: data.keyId,
      amount: data.amount,
      currency: data.currency,
      order_id: data.orderId,
      name: site.name,
      description: site.product,
      prefill: { name: form.name, email: form.email, contact: form.phone },
      notes: { lead_id: data.leadId },
      theme: { color: "#3155F5" },
      handler: (r: RazorpayResponse) => verifyAndFinish(r),
      modal: { ondismiss: () => setBusy(false) },
    });
    rzp.on("payment.failed", (r) => {
      setBusy(false);
      setError(r.error?.description ? `Payment failed: ${r.error.description}` : "Payment failed. Please try again.");
    });
    rzp.open();
  }

  const err = (k: string) => (badFields.includes(k) ? "field err" : "field");

  return (
    <CheckoutContext.Provider value={{ open }}>
      {children}
      {isOpen && (
        <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && setOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
            <div className="modal-top">
              <div>
                <span className="eyebrow">Step 1 of 2 · Your brand</span>
                <h3 id="checkout-title" style={{ marginTop: 8 }}>Book your D2C audit</h3>
              </div>
              <button className="close" aria-label="Close" onClick={() => !busy && setOpen(false)}>✕</button>
            </div>
            <div className="progress"><span className="on" /><span /></div>
            <form onSubmit={submit} noValidate>
              <div className="row2">
                <div className={err("name")}>
                  <label htmlFor="f-name">Your name</label>
                  <input id="f-name" required autoComplete="name" value={form.name} onChange={set("name")} />
                </div>
                <div className={err("brand")}>
                  <label htmlFor="f-brand">Brand name</label>
                  <input id="f-brand" required autoComplete="organization" value={form.brand} onChange={set("brand")} />
                </div>
              </div>
              <div className="row2">
                <div className={err("email")}>
                  <label htmlFor="f-email">Email</label>
                  <input id="f-email" type="email" required autoComplete="email" value={form.email} onChange={set("email")} />
                </div>
                <div className={err("phone")}>
                  <label htmlFor="f-phone">WhatsApp number</label>
                  <input id="f-phone" type="tel" required inputMode="tel" autoComplete="tel" placeholder="98765 43210" value={form.phone} onChange={set("phone")} />
                </div>
              </div>
              <div className={err("website")}>
                <label htmlFor="f-web">Website <em>(optional)</em></label>
                <input id="f-web" inputMode="url" placeholder="yourbrand.com" value={form.website} onChange={set("website")} />
              </div>
              <div className={err("adSpend")}>
                <label htmlFor="f-spend">Monthly ad spend</label>
                <select id="f-spend" required value={form.adSpend} onChange={set("adSpend")}>
                  <option value="" disabled>Select a range</option>
                  {AD_SPEND_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="f-ch">Biggest problem right now <em>(optional)</em></label>
                <textarea id="f-ch" placeholder="e.g. CAC jumps every time we scale, RTO at 22%" value={form.challenge} onChange={set("challenge")} />
              </div>
              {error && <div className="form-error" role="alert">{error}</div>}
              <button className="btn btn-block" style={{ marginTop: 18 }} disabled={busy}>
                {busy ? "Opening secure payment…" : <>Continue to payment · {priceLabel} <span className="arrow">→</span></>}
              </button>
              <div className="secure"><span>🔒 Secured by Razorpay</span><span>UPI · Cards · Netbanking</span></div>
              <p className="legal-note">
                By continuing you agree to our <Link href="/terms" target="_blank">Terms</Link>,{" "}
                <Link href="/refund-policy" target="_blank">Refund Policy</Link> and{" "}
                <Link href="/privacy" target="_blank">Privacy Policy</Link>.
              </p>
            </form>
          </div>
        </div>
      )}
    </CheckoutContext.Provider>
  );
}

export function CtaButton({ location, children, className = "btn" }: { location: string; children: React.ReactNode; className?: string }) {
  const { open } = useCheckout();
  return (
    <button type="button" className={className} onClick={() => open(location)}>
      {children}
    </button>
  );
}
