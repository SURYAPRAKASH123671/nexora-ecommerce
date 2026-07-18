import {
  commerceEnv,
  errorResponse,
  HttpError,
  requireAdmin,
} from "@/lib/site-commerce";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const paymentId = Number(
      new URL(request.url).searchParams.get("paymentId"),
    );
    if (!Number.isInteger(paymentId))
      throw new HttpError(400, "Invalid payment ID.");
    const { DB, PAYMENT_PROOFS } = commerceEnv();
    const payment = await DB.prepare(
      "SELECT proof_storage_key, proof_original_name, proof_content_type FROM manual_upi_payments WHERE id = ?",
    )
      .bind(paymentId)
      .first<{
        proof_storage_key: string;
        proof_original_name: string;
        proof_content_type: string;
      }>();
    if (!payment) throw new HttpError(404, "Payment proof not found.");
    const object = await PAYMENT_PROOFS.get(payment.proof_storage_key);
    if (!object) throw new HttpError(404, "Payment screenshot is unavailable.");
    return new Response(object.body, {
      headers: {
        "Content-Type": payment.proof_content_type,
        "Content-Disposition": `inline; filename="${payment.proof_original_name.replaceAll('"', "")}"`,
        "Content-Length": String(object.size),
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
