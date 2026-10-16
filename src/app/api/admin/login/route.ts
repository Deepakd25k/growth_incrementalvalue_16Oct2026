import { NextResponse, type NextRequest } from "next/server";
import { checkCredentials, createSession, SESSION_COOKIE } from "@/lib/auth";
import { clientIp } from "@/lib/request";

// Best-effort brute-force brake (per server instance): 5 failed attempts per IP per 15 minutes.
const failures = new Map<string, { count: number; until: number }>();

export async function POST(req: NextRequest) {
  const ip = clientIp(req) || "unknown";
  const f = failures.get(ip);
  if (f && f.count >= 5 && f.until > Date.now()) {
    return NextResponse.redirect(new URL("/admin/login?error=locked", req.url), 303);
  }

  const form = await req.formData();
  const username = String(form.get("username") || "");
  const password = String(form.get("password") || "");

  let ok = false;
  try {
    ok = await checkCredentials(username, password);
  } catch {
    return NextResponse.redirect(new URL("/admin/login?error=config", req.url), 303);
  }
  if (!ok) {
    const prev = f && f.until > Date.now() ? f.count : 0;
    failures.set(ip, { count: prev + 1, until: Date.now() + 15 * 60 * 1000 });
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.redirect(new URL("/admin/login?error=invalid", req.url), 303);
  }

  failures.delete(ip);
  const session = await createSession();
  const res = NextResponse.redirect(new URL("/admin", req.url), 303);
  res.cookies.set(SESSION_COOKIE, session.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: session.maxAge,
  });
  return res;
}
