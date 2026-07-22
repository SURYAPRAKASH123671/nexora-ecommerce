import {
  commerceEnv,
  errorResponse,
  HttpError,
  requireSiteUser,
} from "@/lib/site-commerce";
import {
  fetchRazorpayPayment,
  verifyRazorpayPaymentSignature,
} from "@/lib/razorpay";
import { deliverOrderConfirmation } from "@/lib/order-notifications";

type VerifyPayload = {
  orderNumber?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
};

export async function POST(request: Request) {
  try {
    const user = await requireSiteUser(request);
    const body = (await request.json()) as VerifyPayload;
    if (
      !body.orderNumber ||
      !body.razorpay_order_id ||
      !body.razorpay_payment_id ||
      !body.razorpay_signature
    )
      throw new HttpError(400, "Complete payment verification details are required.");
    const { DB } = commerceEnv();
    const payment = await DB.prepare(
      "SELECT p.provider_order_id, p.amount_paise, p.currency, p.status, o.customer_email FROM razorpay_payments p JOIN orders o ON o.order_number = p.order_number WHERE p.order_number = ?",
    )
      .bind(body.orderNumber)
      .first<{
        provider_order_id: string;
        amount_paise: number;
        currency: string;
        status: string;
        customer_email: string;
      }>();
    if (!payment || payment.customer_email !== user.email)
      throw new HttpError(404, "Payment order not found.");
    if (payment.provider_order_id !== body.razorpay_order_id)
      throw new HttpError(409, "Payment order mismatch.");
    if (
      !(await verifyRazorpayPaymentSignature(
        body.razorpay_order_id,
        body.razorpay_payment_id,
        body.razorpay_signature,
      ))
    )
      throw new HttpError(400, "Payment signature verification failed.");
    const providerPayment = await fetchRazorpayPayment(body.razorpay_payment_id);
    if (
      providerPayment.order_id !== payment.provider_order_id ||
      providerPayment.amount !== payment.amount_paise ||
      providerPayment.currency !== payment.currency ||
      providerPayment.status !== "captured" ||
      !providerPayment.captured
    )
      throw new HttpError(409, "The provider has not confirmed this payment as captured.");
    const now = new Date().toISOString();
    await DB.batch([
      DB.prepare(
        "UPDATE razorpay_payments SET provider_payment_id = ?, status = 'CAPTURED', failure_code = NULL, failure_description = NULL, updated_at = ? WHERE order_number = ?",
      ).bind(body.razorpay_payment_id, now, body.orderNumber),
      DB.prepare(
        "UPDATE orders SET payment_status = 'VERIFIED', order_status = 'CONFIRMED', updated_at = ? WHERE order_number = ?",
      ).bind(now, body.orderNumber),
      DB.prepare(
        "UPDATE order_inventory_reservations SET status = 'CONSUMED', updated_at = ? WHERE order_number = ? AND status = 'RESERVED'",
      ).bind(now, body.orderNumber),
      DB.prepare(
        "INSERT INTO order_history (order_number, event_type, from_value, to_value, actor_email, note, created_at) VALUES (?, 'PAYMENT_STATUS', ?, 'VERIFIED', ?, 'Razorpay signature and captured payment verified', ?)",
      ).bind(body.orderNumber, payment.status, user.email, now),
    ]);
    await deliverOrderConfirmation(body.orderNumber);
    return Response.json({
      orderNumber: body.orderNumber,
      paymentStatus: "VERIFIED",
      orderStatus: "CONFIRMED",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
