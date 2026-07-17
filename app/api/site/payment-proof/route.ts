import {
  commerceEnv,
  errorResponse,
  HttpError,
  MERCHANT_UPI_ID,
  requireSiteUser,
  safeFileName,
  validateProof,
} from "@/lib/site-commerce";

type OrderRow = {
  order_number: string;
  customer_email: string;
  total_paise: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
};

export async function POST(request: Request) {
  try {
    const user = requireSiteUser(request);
    const form = await request.formData();
    const orderNumber = String(form.get("orderNumber") ?? "");
    const payerReference =
      String(form.get("payerReference") ?? "")
        .trim()
        .slice(0, 40) || null;
    const file = form.get("screenshot");
    if (!(file instanceof File))
      throw new HttpError(400, "Choose a payment screenshot.");
    const { DB, PAYMENT_PROOFS } = commerceEnv();
    const order = await DB.prepare(
      "SELECT order_number, customer_email, total_paise, payment_method, payment_status, order_status FROM orders WHERE order_number = ? AND customer_email = ?",
    )
      .bind(orderNumber, user.email)
      .first<OrderRow>();
    if (!order) throw new HttpError(404, "Order not found.");
    if (order.payment_method !== "UPI")
      throw new HttpError(
        400,
        "Payment proof is only accepted for UPI orders.",
      );
    if (
      !(
        ["PENDING", "REJECTED"].includes(order.payment_status) &&
        ["PLACED", "PAYMENT_REJECTED"].includes(order.order_status)
      )
    )
      throw new HttpError(
        409,
        "This order cannot accept another payment proof.",
      );
    const existing = await DB.prepare(
      "SELECT id FROM manual_upi_payments WHERE order_number = ?",
    )
      .bind(orderNumber)
      .first<{ id: number }>();
    if (existing && order.payment_status !== "REJECTED")
      throw new HttpError(409, "A payment proof is already awaiting review.");
    const validated = await validateProof(file);
    const storageKey = `upi-proofs/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}${validated.extension}`;
    await PAYMENT_PROOFS.put(storageKey, validated.bytes, {
      httpMetadata: { contentType: validated.contentType },
      customMetadata: { orderNumber, sha256: validated.sha256 },
    });
    const now = new Date().toISOString();
    const statements = existing
      ? [
          DB.prepare(
            "UPDATE manual_upi_payments SET payer_reference = ?, proof_storage_key = ?, proof_original_name = ?, proof_content_type = ?, proof_size = ?, proof_sha256 = ?, review_status = 'PENDING_VERIFICATION', submitted_at = ?, reviewed_at = NULL, reviewed_by = NULL, reviewer_note = NULL WHERE order_number = ?",
          ).bind(
            payerReference,
            storageKey,
            safeFileName(file.name),
            validated.contentType,
            file.size,
            validated.sha256,
            now,
            orderNumber,
          ),
        ]
      : [
          DB.prepare(
            "INSERT INTO manual_upi_payments (order_number, customer_email, merchant_upi_id, amount_paise, payer_reference, proof_storage_key, proof_original_name, proof_content_type, proof_size, proof_sha256, review_status, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_VERIFICATION', ?)",
          ).bind(
            orderNumber,
            user.email,
            MERCHANT_UPI_ID,
            order.total_paise,
            payerReference,
            storageKey,
            safeFileName(file.name),
            validated.contentType,
            file.size,
            validated.sha256,
            now,
          ),
        ];
    await DB.batch([
      ...statements,
      DB.prepare(
        "UPDATE orders SET payment_status = 'PENDING_VERIFICATION', order_status = 'PAYMENT_VERIFICATION_PENDING', updated_at = ? WHERE order_number = ?",
      ).bind(now, orderNumber),
      DB.prepare(
        "INSERT INTO order_history (order_number, event_type, from_value, to_value, actor_email, note, created_at) VALUES (?, 'PAYMENT_STATUS', ?, 'PENDING_VERIFICATION', ?, 'Manual UPI proof uploaded', ?)",
      ).bind(orderNumber, order.payment_status, user.email, now),
      DB.prepare(
        "INSERT INTO order_history (order_number, event_type, from_value, to_value, actor_email, note, created_at) VALUES (?, 'ORDER_STATUS', ?, 'PAYMENT_VERIFICATION_PENDING', ?, 'Awaiting manual payment verification', ?)",
      ).bind(orderNumber, order.order_status, user.email, now),
    ]);
    return Response.json(
      {
        orderNumber,
        reviewStatus: "PENDING_VERIFICATION",
        orderStatus: "PAYMENT_VERIFICATION_PENDING",
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
