"use client";

import { useEffect, useRef } from "react";
import { trackViewContent } from "@/lib/tracking";

// Fires ViewContent once when the wrapped section is at least 40% on screen.
export function ViewTracker({ name, children }: { name: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          trackViewContent(name);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [name]);
  return <div ref={ref}>{children}</div>;
}
