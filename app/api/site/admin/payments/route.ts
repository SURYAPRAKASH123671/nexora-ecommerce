import {
  commerceEnv,
  errorResponse,
  HttpError,
  requireAdmin,
} from "@/lib/site-commerce";

type PaymentRow = {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  amount_paise: number;
  payer_reference: string | null;
  review_status: string;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  reviewer_note: string | null;
  order_status: string;
};

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const status = new URL(request.url).searchParams.get("status");
    const allowed = ["PENDING_VERIFICATION", "VERIFIED", "REJECTED"];
    if (status && status !== "ALL" && !allowed.includes(status))
      throw new HttpError(400, "Unsupported payment status filter.");
    const { DB } = commerceEnv();
    const baseSql =
      "SELECT p.id, p.order_number, o.customer_name, p.customer_email, p.amount_paise, p.payer_reference, p.review_status, p.submitted_at, p.reviewed_at, p.reviewed_by, p.reviewer_note, o.order_status FROM manual_upi_payments p JOIN orders o ON o.order_number = p.order_number";
    const result =
      status && status !== "ALL"
        ? await DB.prepare(
            `${baseSql} WHERE p.review_status = ? ORDER BY p.submitted_at DESC LIMIT 100`,
          )
            .bind(status)
            .all<PaymentRow>()
        : await DB.prepare(
            `${baseSql} ORDER BY p.submitted_at DESC LIMIT 100`,
          ).all<PaymentRow>();
    return Response.json(
      result.results.map((row) => ({
        id: row.id,
        orderNumber: row.order_number,
        customerName: row.customer_name,
        customerEmail: row.customer_email,
        amount: row.amount_paise / 100,
        payerReference: row.payer_reference,
        reviewStatus: row.review_status,
        proofUrl: `/api/site/admin/proof?paymentId=${row.id}`,
        submittedAt: row.submitted_at,
        reviewedAt: row.reviewed_at,
        reviewedBy: row.reviewed_by,
        reviewerNote: row.reviewer_note,
        orderStatus: row.order_status,
      })),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
