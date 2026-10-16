import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export function razorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

// Local development without Razorpay keys uses a simulated payment. Never available in production.
export function mockPayments() {
  return !razorpayConfigured() && process.env.NODE_ENV !== "production";
}

export async function createOrder(amount: number, currency: string, receipt: string, notes: Record<string, string>) {
  if (mockPayments()) return { id: `order_mock_${receipt.replace(/-/g, "").slice(0, 14)}` };
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
    body: JSON.stringify({ amount, currency, receipt: receipt.slice(0, 40), notes }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Razorpay order failed: ${res.status} ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as { id: string };
}

function safeEqualHex(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  if (mockPayments()) return signature === "mock";
  const expected = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}
