import { commerceEnv, errorResponse, HttpError, requireSiteUser } from "@/lib/site-commerce";
import { customerCanCancel } from "@/lib/order-state";
import { inventorySettlementStatements } from "@/lib/inventory-settlement";

export async function POST(request: Request) {
  try {
    const user = await requireSiteUser(request);
    const body = (await request.json()) as { orderNumber?: string; reason?: string };
    if (!body.orderNumber) throw new HttpError(400, "Order number is required.");
    const { DB } = commerceEnv();
    const order = await DB.prepare(
      "SELECT customer_email, payment_method, payment_status, order_status FROM orders WHERE order_number = ?",
    ).bind(body.orderNumber).first<{
      customer_email: string; payment_method: string; payment_status: string; order_status: string;
    }>();
    if (!order || order.customer_email !== user.email) throw new HttpError(404, "Order not found.");
    if (!customerCanCancel(order.order_status)) throw new HttpError(409, "This order can no longer be cancelled online.");
    if (order.payment_method !== "COD" && order.payment_status === "VERIFIED")
      throw new HttpError(409, "A paid order requires an administrator-reviewed refund before cancellation.");
    const now = new Date().toISOString();
    const reason = body.reason?.trim().slice(0, 300) || "Cancelled by customer";
    await DB.batch([
      DB.prepare("UPDATE orders SET order_status = 'ORDER_CANCELLED', payment_status = CASE WHEN payment_method = 'COD' THEN 'COD_CANCELLED' ELSE payment_status END, updated_at = ? WHERE order_number = ? AND order_status = ?")
        .bind(now, body.orderNumber, order.order_status),
      ...inventorySettlementStatements(DB, body.orderNumber, "RESERVED", "RELEASED", now),
      ...inventorySettlementStatements(DB, body.orderNumber, "CONSUMED", "RELEASED", now),
      DB.prepare("INSERT INTO order_history (order_number, event_type, from_value, to_value, actor_email, note, created_at) VALUES (?, 'ORDER_STATUS', ?, 'ORDER_CANCELLED', ?, ?, ?)")
        .bind(body.orderNumber, order.order_status, user.email, reason, now),
    ]);
    return Response.json({ orderNumber: body.orderNumber, orderStatus: "ORDER_CANCELLED" });
  } catch (error) {
    return errorResponse(error);
  }
}
