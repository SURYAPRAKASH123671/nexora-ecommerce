import {
  commerceEnv,
  errorResponse,
  HttpError,
  requireSiteUser,
} from "@/lib/site-commerce";
import { inventorySettlementStatements } from "@/lib/inventory-settlement";

export async function POST(request: Request) {
  try {
    const user = await requireSiteUser(request);
    const body = (await request.json()) as { orderNumber?: string };
    if (!body.orderNumber) throw new HttpError(400, "Order number is required.");

    const { DB } = commerceEnv();
    const order = await DB.prepare(
      "SELECT customer_email, payment_method, payment_status, order_status FROM orders WHERE order_number = ?",
    )
      .bind(body.orderNumber)
      .first<{
        customer_email: string;
        payment_method: string;
        payment_status: string;
        order_status: string;
      }>();

    if (!order || order.customer_email !== user.email)
      throw new HttpError(404, "Payment order not found.");
    if (order.payment_method !== "UPI")
      throw new HttpError(400, "Only pending direct UPI orders use this cancellation route.");
    if (order.payment_status !== "PENDING" || order.order_status !== "PLACED")
      throw new HttpError(409, "This payment can no longer be cancelled.");

    const now = new Date().toISOString();
    await DB.batch([
      DB.prepare(
        "UPDATE orders SET payment_status = 'CANCELLED', order_status = 'PAYMENT_CANCELLED', updated_at = ? WHERE order_number = ? AND payment_status = 'PENDING' AND order_status = 'PLACED'",
      ).bind(now, body.orderNumber),
      ...inventorySettlementStatements(DB, body.orderNumber, "RESERVED", "RELEASED", now),
      DB.prepare(
        "INSERT INTO order_history (order_number, event_type, from_value, to_value, actor_email, note, created_at) VALUES (?, 'PAYMENT_STATUS', 'PENDING', 'CANCELLED', ?, 'Customer cancelled direct UPI checkout before proof submission', ?)",
      ).bind(body.orderNumber, user.email, now),
    ]);

    return Response.json({
      orderNumber: body.orderNumber,
      paymentStatus: "CANCELLED",
      orderStatus: "PAYMENT_CANCELLED",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
