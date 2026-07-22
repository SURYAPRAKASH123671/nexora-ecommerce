import { commerceEnv, errorResponse, HttpError } from "@/lib/site-commerce";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";
import { deliverOrderConfirmation } from "@/lib/order-notifications";

type RazorpayEntity = {
  id?: string;
  order_id?: string;
  payment_id?: string;
  amount?: number;
  currency?: string;
  status?: string;
  error_code?: string;
  error_description?: string;
};

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("x-razorpay-signature") ?? "";
    const rawPayload = await request.text();
    if (!(await verifyRazorpayWebhookSignature(rawPayload, signature)))
      throw new HttpError(400, "Invalid webhook signature.");
    const payload = JSON.parse(rawPayload) as {
      event?: string;
      payload?: {
        payment?: { entity?: RazorpayEntity };
        order?: { entity?: RazorpayEntity };
        refund?: { entity?: RazorpayEntity };
      };
    };
    const event = payload.event ?? "";
    const payment = payload.payload?.payment?.entity;
    const order = payload.payload?.order?.entity;
    const refund = payload.payload?.refund?.entity;
    const providerOrderId = payment?.order_id ?? order?.id ?? "";
    const { DB } = commerceEnv();
    const attempt = providerOrderId
      ? await DB.prepare(
          "SELECT order_number, amount_paise, currency, status FROM razorpay_payments WHERE provider_order_id = ?",
        )
          .bind(providerOrderId)
          .first<{
            order_number: string;
            amount_paise: number;
            currency: string;
            status: string;
          }>()
      : null;
    if (attempt) {
      const now = new Date().toISOString();
      if (
        ["payment.captured", "order.paid"].includes(event) &&
        payment?.id &&
        payment.amount === attempt.amount_paise &&
        payment.currency === attempt.currency &&
        (payment.status === "captured" || event === "order.paid")
      ) {
        await DB.batch([
          DB.prepare(
            "UPDATE razorpay_payments SET provider_payment_id = ?, status = 'CAPTURED', failure_code = NULL, failure_description = NULL, updated_at = ? WHERE order_number = ? AND status != 'REFUNDED'",
          ).bind(payment.id, now, attempt.order_number),
          DB.prepare(
            "UPDATE orders SET payment_status = 'VERIFIED', order_status = 'CONFIRMED', updated_at = ? WHERE order_number = ? AND payment_status != 'REFUNDED'",
          ).bind(now, attempt.order_number),
          DB.prepare(
            "UPDATE order_inventory_reservations SET status = 'CONSUMED', updated_at = ? WHERE order_number = ? AND status = 'RESERVED'",
          ).bind(now, attempt.order_number),
          DB.prepare(
            "INSERT INTO order_history (order_number, event_type, from_value, to_value, actor_email, note, created_at) VALUES (?, 'PAYMENT_STATUS', ?, 'VERIFIED', 'razorpay-webhook', ?, ?)",
          ).bind(attempt.order_number, attempt.status, event, now),
        ]);
        await deliverOrderConfirmation(attempt.order_number);
      } else if (event === "payment.failed" && attempt.status !== "CAPTURED") {
        await DB.batch([
          DB.prepare(
            "UPDATE razorpay_payments SET provider_payment_id = ?, status = 'FAILED', failure_code = ?, failure_description = ?, updated_at = ? WHERE order_number = ?",
          ).bind(
            payment?.id ?? null,
            payment?.error_code ?? null,
            payment?.error_description ?? "Payment failed",
            now,
            attempt.order_number,
          ),
          DB.prepare(
            "UPDATE orders SET payment_status = 'FAILED', order_status = 'PAYMENT_FAILED', updated_at = ? WHERE order_number = ?",
          ).bind(now, attempt.order_number),
          DB.prepare(
            "UPDATE order_inventory_reservations SET status = 'RELEASED', updated_at = ? WHERE order_number = ? AND status = 'RESERVED'",
          ).bind(now, attempt.order_number),
        ]);
      }
    }
    if (refund?.payment_id) {
      const refundedAttempt = await DB.prepare(
        "SELECT order_number, amount_paise, status FROM razorpay_payments WHERE provider_payment_id = ?",
      )
        .bind(refund.payment_id)
        .first<{ order_number: string; amount_paise: number; status: string }>();
      if (refundedAttempt) {
        const now = new Date().toISOString();
        if (
          event === "refund.processed" &&
          refund.amount === refundedAttempt.amount_paise
        )
          await DB.batch([
            DB.prepare(
              "UPDATE razorpay_payments SET provider_refund_id = ?, refunded_amount_paise = ?, status = 'REFUNDED', updated_at = ? WHERE order_number = ?",
            ).bind(refund.id, refund.amount, now, refundedAttempt.order_number),
            DB.prepare(
              "UPDATE orders SET payment_status = 'REFUNDED', order_status = 'REFUNDED', updated_at = ? WHERE order_number = ?",
            ).bind(now, refundedAttempt.order_number),
            DB.prepare(
              "UPDATE order_inventory_reservations SET status = 'RELEASED', updated_at = ? WHERE order_number = ? AND status = 'CONSUMED'",
            ).bind(now, refundedAttempt.order_number),
          ]);
        else if (event === "refund.failed")
          await DB.prepare(
            "UPDATE razorpay_payments SET provider_refund_id = ?, status = 'REFUND_FAILED', failure_description = ?, updated_at = ? WHERE order_number = ?",
          )
            .bind(
              refund.id ?? null,
              refund.error_description ?? "Refund failed",
              now,
              refundedAttempt.order_number,
            )
            .run();
      }
    }
    return Response.json({ received: true });
  } catch (error) {
    return errorResponse(error);
  }
}
