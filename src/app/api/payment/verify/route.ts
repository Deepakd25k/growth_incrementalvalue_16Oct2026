import { NextResponse, type NextRequest } from "next/server";
import { markPaid } from "@/lib/leads";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { readJson, str } from "@/lib/request";

// Called by the browser right after Razorpay reports success. The signature proves the payment is real.
export async function POST(req: NextRequest) {
  const body = await readJson(req);
  const orderId = str(body?.orderId, 80);
  const paymentId = str(body?.paymentId, 80);
  const signature = str(body?.signature, 200);
  if (!orderId || !paymentId || !signature || !verifyPaymentSignature(orderId, paymentId, signature)) {
    return NextResponse.json({ error: "Payment could not be verified" }, { status: 400 });
  }
  const result = await markPaid(orderId, paymentId);
  if (!result) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ leadId: result.leadId });
}
