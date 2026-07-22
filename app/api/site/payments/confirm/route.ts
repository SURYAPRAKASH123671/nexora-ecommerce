import { commerceEnv, errorResponse, HttpError, requireSiteUser } from "@/lib/site-commerce";
import { confirmHostedPayment } from "@/lib/international-payments";
import { inventorySettlementStatements } from "@/lib/inventory-settlement";

export async function POST(request: Request) {
  try {
    const user = await requireSiteUser(request);
    const { orderNumber, providerOrderId, gateway } = await request.json() as { orderNumber?: string; providerOrderId?: string; gateway?: string };
    if (!orderNumber || !providerOrderId || !["STRIPE", "PAYPAL"].includes(gateway ?? "")) throw new HttpError(400, "Invalid payment confirmation.");
    const { DB } = commerceEnv();
    const payment = await DB.prepare("SELECT p.amount_paise, p.status, o.customer_email FROM gateway_payments p JOIN orders o ON o.order_number=p.order_number WHERE p.order_number=? AND p.gateway=? AND p.provider_order_id=?")
      .bind(orderNumber, gateway, providerOrderId).first<{ amount_paise: number; status: string; customer_email: string }>();
    if (!payment || payment.customer_email !== user.email) throw new HttpError(404, "Payment not found.");
    if (payment.status === "SUCCESS") return Response.json({ orderNumber, paymentStatus: "VERIFIED" });
    const transactionId = await confirmHostedPayment(gateway as "STRIPE" | "PAYPAL", providerOrderId, orderNumber, payment.amount_paise);
    const now = new Date().toISOString();
    await DB.batch([
      DB.prepare("UPDATE gateway_payments SET transaction_id=?, status='SUCCESS', payment_time=?, updated_at=? WHERE order_number=? AND gateway=? AND status!='SUCCESS'").bind(transactionId, now, now, orderNumber, gateway),
      DB.prepare("UPDATE orders SET payment_status='VERIFIED', order_status='CONFIRMED', updated_at=? WHERE order_number=? AND customer_email=? AND payment_status!='VERIFIED'").bind(now, orderNumber, user.email),
      DB.prepare("INSERT INTO order_history (order_number,event_type,from_value,to_value,actor_email,note,created_at) VALUES (?,'PAYMENT_STATUS','PAYMENT_PENDING','VERIFIED',?,?,?)").bind(orderNumber, `${gateway!.toLowerCase()}-confirmation`, `${gateway} transaction ${transactionId}`, now),
      ...inventorySettlementStatements(DB, orderNumber, "RESERVED", "CONSUMED", now),
    ]);
    return Response.json({ orderNumber, paymentStatus: "VERIFIED", transactionId });
  } catch (error) { return errorResponse(error); }
}
