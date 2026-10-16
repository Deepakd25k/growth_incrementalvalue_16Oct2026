import "server-only";
import type { NextRequest } from "next/server";

export function clientIp(req: NextRequest): string | undefined {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim() || undefined;
  return req.headers.get("x-real-ip") || undefined;
}

export function userAgent(req: NextRequest): string | undefined {
  return req.headers.get("user-agent")?.slice(0, 500) || undefined;
}

export function hasConsent(req: NextRequest): boolean {
  return req.cookies.get("dg_consent")?.value !== "denied";
}

export async function readJson(req: NextRequest, maxBytes = 16_000): Promise<Record<string, unknown> | null> {
  const text = await req.text();
  if (text.length > maxBytes) return null;
  try {
    const v = JSON.parse(text);
    return v && typeof v === "object" ? v : null;
  } catch {
    return null;
  }
}

export function str(v: unknown, max = 200): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}
