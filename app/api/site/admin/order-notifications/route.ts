import { commerceEnv, errorResponse, requireAdmin } from "@/lib/site-commerce";
import { retryDueOrderConfirmations } from "@/lib/order-notifications";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const rows = await commerceEnv().DB.prepare("SELECT order_number, event_type, recipient_email, status, attempts, last_error, next_attempt_at, sent_at, created_at FROM order_notifications ORDER BY created_at DESC LIMIT 100").all();
    return Response.json({ notifications: rows.results ?? [] });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const retried = await retryDueOrderConfirmations();
    return Response.json({ retried });
  } catch (error) { return errorResponse(error); }
}
