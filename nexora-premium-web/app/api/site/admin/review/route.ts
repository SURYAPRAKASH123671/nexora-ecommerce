import {
  commerceEnv,
  errorResponse,
  HttpError,
  requireAdmin,
} from "@/lib/site-commerce";

type PaymentRow = {
  id: number;
  order_number: string;
  review_status: string;
  order_status: string;
  payment_status: string;
};

export async function PATCH(request: Request) {
  try {
    const admin = requireAdmin(request);
    const payload = (await request.json()) as {
      paymentId?: number;
      decision?: "APPROVE" | "REJECT";
      note?: string;
    };
    const paymentId = Number(payload.paymentId);
    if (
      !Number.isInteger(paymentId) ||
      !["APPROVE", "REJECT"].includes(payload.decision ?? "")
    )
      throw new HttpError(400, "A valid payment and decision are required.");
    const note = payload.note?.trim().slice(0, 500) || null;
    const { DB } = commerceEnv();
    const payment = await DB.prepare(
      "SELECT p.id, p.order_number, p.review_status, o.order_status, o.payment_status FROM manual_upi_payments p JOIN orders o ON o.order_number = p.order_number WHERE p.id = ?",
    )
      .bind(paymentId)
      .first<PaymentRow>();
    if (!payment) throw new HttpError(404, "Payment record not found.");
    if (
      payment.review_status !== "PENDING_VERIFICATION" ||
      payment.order_status !== "PAYMENT_VERIFICATION_PENDING"
    )
      throw new HttpError(409, "This payment has already been reviewed.");
    const approved = payload.decision === "APPROVE";
    const paymentStatus = approved ? "VERIFIED" : "REJECTED";
    const orderStatus = approved ? "CONFIRMED" : "PAYMENT_REJECTED";
    const now = new Date().toISOString();
    await DB.batch([
      DB.prepare(
        "UPDATE manual_upi_payments SET review_status = ?, reviewed_at = ?, reviewed_by = ?, reviewer_note = ? WHERE id = ? AND review_status = 'PENDING_VERIFICATION'",
      ).bind(paymentStatus, now, admin.email, note, paymentId),
      DB.prepare(
        "UPDATE orders SET payment_status = ?, order_status = ?, updated_at = ? WHERE order_number = ? AND order_status = 'PAYMENT_VERIFICATION_PENDING'",
      ).bind(paymentStatus, orderStatus, now, payment.order_number),
      DB.prepare(
        "INSERT INTO order_history (order_number, event_type, from_value, to_value, actor_email, note, created_at) VALUES (?, 'PAYMENT_STATUS', ?, ?, ?, ?, ?)",
      ).bind(
        payment.order_number,
        payment.payment_status,
        paymentStatus,
        admin.email,
        note,
        now,
      ),
      DB.prepare(
        "INSERT INTO order_history (order_number, event_type, from_value, to_value, actor_email, note, created_at) VALUES (?, 'ORDER_STATUS', ?, ?, ?, ?, ?)",
      ).bind(
        payment.order_number,
        payment.order_status,
        orderStatus,
        admin.email,
        note,
        now,
      ),
    ]);
    return Response.json({
      paymentId,
      orderNumber: payment.order_number,
      reviewStatus: paymentStatus,
      orderStatus,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
