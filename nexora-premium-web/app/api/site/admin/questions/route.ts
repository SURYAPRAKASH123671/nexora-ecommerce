import {
  commerceEnv,
  errorResponse,
  HttpError,
  requireAdmin,
} from "@/lib/site-commerce";
import { ensureCatalogSeeded } from "@/lib/catalog-store";

type QuestionRow = {
  id: number;
  product_id: number;
  product_name: string;
  customer_email: string;
  question: string;
  answer: string | null;
  status: string;
  created_at: string;
  answered_at: string | null;
};

export async function GET(request: Request) {
  try {
    requireAdmin(request);
    const status = new URL(request.url).searchParams.get("status") ?? "PENDING";
    if (!["PENDING", "ANSWERED", "ALL"].includes(status))
      throw new HttpError(400, "Unsupported question status.");
    const { DB } = commerceEnv();
    await ensureCatalogSeeded(DB);
    const base =
      "SELECT q.id, q.product_id, p.name AS product_name, q.customer_email, q.question, q.answer, q.status, q.created_at, q.answered_at FROM product_questions q JOIN catalog_products p ON p.id = q.product_id";
    const result =
      status === "ALL"
        ? await DB.prepare(
            `${base} ORDER BY q.created_at DESC LIMIT 100`,
          ).all<QuestionRow>()
        : await DB.prepare(
            `${base} WHERE q.status = ? ORDER BY q.created_at DESC LIMIT 100`,
          )
            .bind(status)
            .all<QuestionRow>();
    return Response.json(
      result.results.map((row) => ({
        id: row.id,
        productId: row.product_id,
        productName: row.product_name,
        customerEmail: row.customer_email,
        question: row.question,
        answer: row.answer,
        status: row.status,
        createdAt: row.created_at,
        answeredAt: row.answered_at,
      })),
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = requireAdmin(request);
    const payload = (await request.json()) as { id?: number; answer?: string };
    const id = Number(payload.id);
    const answer = payload.answer?.trim() ?? "";
    if (!Number.isInteger(id) || answer.length < 2 || answer.length > 1500)
      throw new HttpError(400, "A valid question and answer are required.");
    const { DB } = commerceEnv();
    const now = new Date().toISOString();
    const result = await DB.prepare(
      "UPDATE product_questions SET answer = ?, answered_by = ?, status = 'ANSWERED', answered_at = ? WHERE id = ? AND status = 'PENDING'",
    )
      .bind(answer, admin.email, now, id)
      .run();
    if (Number(result.meta.changes ?? 0) !== 1)
      throw new HttpError(
        409,
        "This question is unavailable or already answered.",
      );
    return Response.json({ id, status: "ANSWERED", answeredAt: now });
  } catch (error) {
    return errorResponse(error);
  }
}
