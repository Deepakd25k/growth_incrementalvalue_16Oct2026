"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { captureAttribution, initThirdParty, startPing, trackPageView } from "@/lib/tracking";

export function Tracking() {
  const pathname = usePathname();

  useEffect(() => {
    captureAttribution();
    initThirdParty();
    trackPageView(pathname);
    startPing();
  }, [pathname]);

  return null;
}
