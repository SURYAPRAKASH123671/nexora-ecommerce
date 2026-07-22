import { commerceEnv } from "@/lib/site-commerce";
import { customerCanCancel } from "@/lib/order-state";
import { OrderEmailData, orderEmailSubject, renderOrderConfirmationHtml, renderOrderConfirmationText } from "@/lib/order-email-template";

type OrderRow = {
  order_number: string; customer_email: string; customer_name: string; delivery_json: string; items_json: string;
  payment_method: OrderEmailData["paymentMethod"]; payment_status: string; order_status: string;
  subtotal_paise: number; shipping_paise: number; total_paise: number; created_at: string;
};

function safeError(error: unknown): string {
  const value = error instanceof Error ? `${error.name}: ${error.message}` : "Unknown email provider error";
  return value.replace(/[\r\n]/g, " ").slice(0, 500);
}

async function loadOrderEmailData(orderNumber: string): Promise<OrderEmailData> {
  const { DB, NEXORA_APP_URL } = commerceEnv();
  const row = await DB.prepare("SELECT order_number, customer_email, customer_name, delivery_json, items_json, payment_method, payment_status, order_status, subtotal_paise, shipping_paise, total_paise, created_at FROM orders WHERE order_number = ?")
    .bind(orderNumber).first<OrderRow>();
  if (!row) throw new Error("Order not found for confirmation notification.");
  const baseUrl = (NEXORA_APP_URL ?? "https://nexora-web-virid.vercel.app").replace(/\/$/, "");
  const address = JSON.parse(row.delivery_json) as OrderEmailData["shippingAddress"];
  const items = (JSON.parse(row.items_json) as Array<{ name: string; variantName?: string; quantity: number; unitPrice: number; lineTotal: number; imageUrl?: string }>).map((item) => ({
    ...item,
    imageUrl: item.imageUrl ? new URL(item.imageUrl, baseUrl).toString() : undefined,
  }));
  return {
    customerName: row.customer_name, customerEmail: row.customer_email, publicOrderReference: row.order_number,
    orderDate: row.created_at, paymentMethod: row.payment_method, paymentStatus: row.payment_status,
    orderStatus: row.order_status, items, subtotal: row.subtotal_paise / 100,
    deliveryFee: row.shipping_paise / 100, total: row.total_paise / 100, shippingAddress: address,
    viewOrderUrl: `${baseUrl}/account?order=${encodeURIComponent(row.order_number)}`,
    supportUrl: `${baseUrl}/contact-us?order=${encodeURIComponent(row.order_number)}`,
    cancellable: customerCanCancel(row.order_status) && row.payment_status !== "VERIFIED",
  };
}

/** Idempotent best-effort delivery. It never throws into the order transaction. */
export async function deliverOrderConfirmation(orderNumber: string): Promise<void> {
  const { DB, NEXORA_EMAIL_API_KEY, NEXORA_EMAIL_FROM } = commerceEnv();
  const now = new Date().toISOString();
  try {
    const data = await loadOrderEmailData(orderNumber);
    await DB.prepare("INSERT OR IGNORE INTO order_notifications (order_number, event_type, recipient_email, status, attempts, created_at, updated_at) VALUES (?, 'ORDER_CONFIRMED', ?, 'PENDING', 0, ?, ?)")
      .bind(orderNumber, data.customerEmail, now, now).run();
    const claim = await DB.prepare("UPDATE order_notifications SET status = 'SENDING', attempts = attempts + 1, updated_at = ? WHERE order_number = ? AND event_type = 'ORDER_CONFIRMED' AND status IN ('PENDING','FAILED') AND attempts < 3 AND (next_attempt_at IS NULL OR next_attempt_at <= ?)")
      .bind(now, orderNumber, now).run();
    if (!claim.meta.changes) return;
    if (!NEXORA_EMAIL_API_KEY || !NEXORA_EMAIL_FROM) throw new Error("Email provider is not configured");
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${NEXORA_EMAIL_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `ORDER_CONFIRMATION:${orderNumber}` },
      body: JSON.stringify({
        from: NEXORA_EMAIL_FROM, to: [data.customerEmail], subject: orderEmailSubject(data),
        html: renderOrderConfirmationHtml(data), text: renderOrderConfirmationText(data),
        headers: { "X-Entity-Ref-ID": `ORDER_CONFIRMATION:${orderNumber}` },
      }),
    });
    const provider = await response.json().catch(() => ({})) as { id?: string; message?: string };
    if (!response.ok || !provider.id) throw new Error(`Email provider rejected request (${response.status}): ${provider.message ?? "unknown"}`);
    await DB.prepare("UPDATE order_notifications SET status = 'SENT', provider_message_id = ?, sent_at = ?, last_error = NULL, next_attempt_at = NULL, updated_at = ? WHERE order_number = ? AND event_type = 'ORDER_CONFIRMED'")
      .bind(provider.id, now, now, orderNumber).run();
    console.info(`Order confirmation email sent orderRef=${orderNumber} recipientDomain=${data.customerEmail.split("@")[1] ?? "unknown"}`);
  } catch (error) {
    const reason = safeError(error);
    const retryAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    await DB.prepare("UPDATE order_notifications SET status = 'FAILED', last_error = ?, next_attempt_at = CASE WHEN attempts < 3 THEN ? ELSE NULL END, updated_at = ? WHERE order_number = ? AND event_type = 'ORDER_CONFIRMED' AND status = 'SENDING'")
      .bind(reason, retryAt, new Date().toISOString(), orderNumber).run().catch(() => undefined);
    console.error(`Order confirmation email failed orderRef=${orderNumber} reason=${reason}`);
  }
}

export async function retryDueOrderConfirmations(limit = 20): Promise<number> {
  const { DB } = commerceEnv();
  const rows = await DB.prepare("SELECT order_number FROM order_notifications WHERE status = 'FAILED' AND attempts < 3 AND next_attempt_at <= ? ORDER BY next_attempt_at ASC LIMIT ?")
    .bind(new Date().toISOString(), limit).all<{ order_number: string }>();
  for (const row of rows.results ?? []) await deliverOrderConfirmation(row.order_number);
  return rows.results?.length ?? 0;
}
