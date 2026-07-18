import {
  commerceEnv,
  errorResponse,
  HttpError,
  requireAdmin,
} from "@/lib/site-commerce";

const nextStatus: Record<string, string> = {
  CONFIRMED: "PACKED",
  PACKED: "SHIPPED",
  SHIPPED: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
};

export async function PATCH(request: Request) {
  try {
    const admin = requireAdmin(request);
    const payload = (await request.json()) as {
      orderNumber?: string;
      status?: string;
    };
    const orderNumber = payload.orderNumber?.trim() ?? "";
    const { DB } = commerceEnv();
    const order = await DB.prepare(
      "SELECT order_status, payment_status FROM orders WHERE order_number = ?",
    )
      .bind(orderNumber)
      .first<{ order_status: string; payment_status: string }>();
    if (!order) throw new HttpError(404, "Order not found.");
    if (order.payment_status !== "VERIFIED")
      throw new HttpError(
        409,
        "Fulfilment cannot advance before payment verification.",
      );
    if (nextStatus[order.order_status] !== payload.status)
      throw new HttpError(
        409,
        `Invalid order transition from ${order.order_status}.`,
      );
    const now = new Date().toISOString();
    await DB.batch([
      DB.prepare(
        "UPDATE orders SET order_status = ?, updated_at = ? WHERE order_number = ? AND order_status = ?",
      ).bind(payload.status, now, orderNumber, order.order_status),
      DB.prepare(
        "INSERT INTO order_history (order_number, event_type, from_value, to_value, actor_email, note, created_at) VALUES (?, 'ORDER_STATUS', ?, ?, ?, 'Updated by administrator', ?)",
      ).bind(orderNumber, order.order_status, payload.status, admin.email, now),
    ]);
    return Response.json({ orderNumber, orderStatus: payload.status });
  } catch (error) {
    return errorResponse(error);
  }
}
