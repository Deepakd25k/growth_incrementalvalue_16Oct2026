"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { consentState, setConsent } from "@/lib/tracking";

export function ConsentBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => setShow(consentState() === "unset"), []);
  if (!show) return null;

  const choose = (granted: boolean) => {
    setConsent(granted);
    setShow(false);
  };

  return (
    <div className="consent" role="dialog" aria-label="Cookie notice">
      <div>
        We use cookies and the Meta Pixel to measure our ads and improve this page. See our{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </div>
      <div className="actions">
        <button className="btn btn-sm" onClick={() => choose(true)}>Okay</button>
        <button className="btn btn-sm btn-ghost" onClick={() => choose(false)}>Decline</button>
      </div>
    </div>
  );
}
