// Admin session: an HMAC-signed cookie. Uses Web Crypto so it runs in middleware and route handlers.

export const SESSION_COOKIE = "dg_admin";
const SESSION_HOURS = 12;

const enc = new TextEncoder();

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(data: string): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("ADMIN_SESSION_SECRET must be at least 32 characters");
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSession(): Promise<{ value: string; maxAge: number }> {
  const exp = Date.now() + SESSION_HOURS * 3600 * 1000;
  const payload = b64url(enc.encode(JSON.stringify({ exp })));
  return { value: `${payload}.${await hmac(payload)}`, maxAge: SESSION_HOURS * 3600 };
}

export async function verifySession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  try {
    if (!constantTimeEqual(await hmac(payload), sig)) return false;
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof json.exp === "number" && json.exp > Date.now();
  } catch {
    return false;
  }
}

export async function checkCredentials(username: string, password: string): Promise<boolean> {
  const u = process.env.ADMIN_USERNAME;
  const p = process.env.ADMIN_PASSWORD;
  if (!u || !p) return false;
  // Compare HMACs so the comparison time does not depend on where the strings differ.
  const [a, b, c, d] = await Promise.all([hmac(username), hmac(u), hmac(password), hmac(p)]);
  return constantTimeEqual(a, b) && constantTimeEqual(c, d);
}
