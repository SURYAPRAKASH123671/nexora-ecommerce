import {
  commerceEnv,
  errorResponse,
  HttpError,
  requireSiteUser,
} from "@/lib/site-commerce";
import { ensureCatalogSeeded } from "@/lib/catalog-store";

type QuestionRow = {
  id: number;
  question: string;
  answer: string;
  answered_at: string;
};

export async function GET(request: Request) {
  try {
    const productId = Number(
      new URL(request.url).searchParams.get("productId"),
    );
    if (!Number.isInteger(productId))
      throw new HttpError(400, "A valid product is required.");
    const { DB } = commerceEnv();
    await ensureCatalogSeeded(DB);
    const result = await DB.prepare(
      "SELECT id, question, answer, answered_at FROM product_questions WHERE product_id = ? AND status = 'ANSWERED' AND answer IS NOT NULL ORDER BY answered_at DESC LIMIT 50",
    )
      .bind(productId)
      .all<QuestionRow>();
    return Response.json(
      result.results.map((row) => ({
        id: row.id,
        question: row.question,
        answer: row.answer,
        answeredAt: row.answered_at,
      })),
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSiteUser(request);
    const payload = (await request.json()) as {
      productId?: number;
      question?: string;
    };
    const productId = Number(payload.productId);
    const question = payload.question?.trim() ?? "";
    if (
      !Number.isInteger(productId) ||
      question.length < 10 ||
      question.length > 500
    ) {
      throw new HttpError(
        400,
        "Questions must contain between 10 and 500 characters.",
      );
    }
    const { DB } = commerceEnv();
    await ensureCatalogSeeded(DB);
    const product = await DB.prepare(
      "SELECT id FROM catalog_products WHERE id = ?",
    )
      .bind(productId)
      .first<{ id: number }>();
    if (!product) throw new HttpError(404, "Product not found.");
    const result = await DB.prepare(
      "INSERT INTO product_questions (product_id, customer_email, question, status, created_at) VALUES (?, ?, ?, 'PENDING', ?)",
    )
      .bind(productId, user.email, question, new Date().toISOString())
      .run();
    return Response.json(
      {
        id: result.meta.last_row_id,
        status: "PENDING",
        message: "Your question was submitted for an administrator response.",
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
