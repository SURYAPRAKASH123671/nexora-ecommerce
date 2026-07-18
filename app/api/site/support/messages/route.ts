import { commerceEnv, errorResponse, HttpError, requireSiteUser } from "@/lib/site-commerce";

export async function GET(request: Request) {
  try {
    const user = requireSiteUser(request); const id = new URL(request.url).searchParams.get("conversationId");
    if (!id) throw new HttpError(400, "conversationId is required.");
    const { DB } = commerceEnv(); await own(DB, id, user.email);
    const rows = await DB.prepare("SELECT id, sender_role, sender_email, body, message_type, delivery_status, read_at, created_at FROM support_messages WHERE conversation_id=? ORDER BY created_at ASC LIMIT 500").bind(id).all();
    await DB.prepare("UPDATE support_messages SET read_at=COALESCE(read_at, ?), delivery_status='SEEN' WHERE conversation_id=? AND sender_role='AGENT'").bind(new Date().toISOString(), id).run();
    return Response.json(rows.results, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const user = requireSiteUser(request); const body = await request.json() as { conversationId?: string; message?: string };
    const id = body.conversationId?.trim(); const message = body.message?.trim().replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, 4000);
    if (!id || !message) throw new HttpError(400, "Conversation and message are required.");
    const { DB } = commerceEnv(); await own(DB, id, user.email);
    const recent = await DB.prepare("SELECT COUNT(*) total FROM support_messages WHERE sender_email=? AND created_at >= datetime('now','-1 minute')").bind(user.email).first<{ total: number }>();
    if (Number(recent?.total ?? 0) >= 20) throw new HttpError(429, "Please wait before sending more messages.");
    const now = new Date().toISOString(); const messageId = crypto.randomUUID();
    await DB.batch([
      DB.prepare("INSERT INTO support_messages (id, conversation_id, sender_role, sender_email, body, message_type, delivery_status, created_at) VALUES (?, ?, 'CUSTOMER', ?, ?, 'TEXT', 'DELIVERED', ?)").bind(messageId, id, user.email, message, now),
      DB.prepare("UPDATE support_conversations SET status=CASE WHEN status='OPEN' THEN 'WAITING_FOR_AGENT' ELSE status END, last_message_at=?, updated_at=? WHERE id=?").bind(now, now, id),
    ]);
    return Response.json({ id: messageId, status: "DELIVERED", createdAt: now }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}

async function own(DB: ReturnType<typeof commerceEnv>["DB"], id: string, email: string) { const row = await DB.prepare("SELECT id FROM support_conversations WHERE id=? AND customer_email=?").bind(id, email).first(); if (!row) throw new HttpError(404, "Support conversation not found."); }
