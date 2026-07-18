import {
  commerceEnv,
  errorResponse,
  HttpError,
  requireSiteUser,
} from "@/lib/site-commerce";

export async function POST(request: Request) {
  try {
    const user = requireSiteUser(request);
    const body = (await request.json()) as { orderNumber?: string };
    if (!body.orderNumber) throw new HttpError(400, "Order number is required.");
    const { DB } = commerceEnv();
    const row = await DB.prepare(
      "SELECT p.status, o.customer_email FROM razorpay_payments p JOIN orders o ON o.order_number = p.order_number WHERE p.order_number = ?",
    )
      .bind(body.orderNumber)
      .first<{ status: string; customer_email: string }>();
    if (!row || row.customer_email !== user.email)
      throw new HttpError(404, "Payment order not found.");
    if (row.status === "CAPTURED")
      throw new HttpError(409, "A captured payment cannot be cancelled.");
    const now = new Date().toISOString();
    await DB.batch([
      DB.prepare(
        "UPDATE razorpay_payments SET status = 'CANCELLED', updated_at = ? WHERE order_number = ? AND status = 'CREATED'",
      ).bind(now, body.orderNumber),
      DB.prepare(
        "UPDATE orders SET payment_status = 'CANCELLED', order_status = 'PAYMENT_CANCELLED', updated_at = ? WHERE order_number = ? AND payment_status = 'PAYMENT_PENDING'",
      ).bind(now, body.orderNumber),
      DB.prepare(
        "INSERT INTO order_history (order_number, event_type, from_value, to_value, actor_email, note, created_at) VALUES (?, 'PAYMENT_STATUS', ?, 'CANCELLED', ?, 'Razorpay checkout dismissed', ?)",
      ).bind(body.orderNumber, row.status, user.email, now),
    ]);
    return Response.json({ orderNumber: body.orderNumber, paymentStatus: "CANCELLED" });
  } catch (error) {
    return errorResponse(error);
  }
}
