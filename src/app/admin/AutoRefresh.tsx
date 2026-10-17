"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const INTERVAL_MS = 15_000;

// Re-runs the dashboard's server queries every 15s while the tab is visible, without a page reload.
export function AutoRefresh() {
  const router = useRouter();
  const [on, setOn] = useState(true);
  const [lastAt, setLastAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!on) return;
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      startTransition(() => router.refresh());
      setLastAt(Date.now());
    };
    const id = setInterval(refresh, INTERVAL_MS);
    // Catch up immediately when coming back to the tab.
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [on, router]);

  const ago = Math.max(0, Math.round((now - lastAt) / 1000));
  return (
    <div className="live">
      <span className={`live-dot${on ? " on" : ""}`} aria-hidden="true" />
      <span>{on ? (pending ? "Updating…" : `Live · updated ${ago}s ago`) : "Paused"}</span>
      <button type="button" className="btn btn-sm btn-ghost" onClick={() => setOn((v) => !v)}>
        {on ? "Pause" : "Resume"}
      </button>
    </div>
  );
}
