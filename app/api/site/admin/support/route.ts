import { commerceEnv, errorResponse, HttpError, requireAdmin } from "@/lib/site-commerce";

export async function GET(request: Request) {
  try {
    await requireAdmin(request); const { DB } = commerceEnv(); const id = new URL(request.url).searchParams.get("conversationId");
    if (id) {
      const conversation = await DB.prepare("SELECT c.*, t.id ticket_id, t.subject, t.priority, t.order_number FROM support_conversations c LEFT JOIN support_tickets t ON t.conversation_id=c.id WHERE c.id=?").bind(id).first();
      if (!conversation) throw new HttpError(404, "Conversation not found.");
      const [messages, notes, orders] = await Promise.all([
        DB.prepare("SELECT id, sender_role, sender_email, body, message_type, delivery_status, read_at, created_at FROM support_messages WHERE conversation_id=? ORDER BY created_at ASC LIMIT 500").bind(id).all(),
        DB.prepare("SELECT id, agent_email, body, created_at FROM support_internal_notes WHERE conversation_id=? ORDER BY created_at DESC LIMIT 100").bind(id).all(),
        DB.prepare("SELECT order_number, payment_status, order_status, total_paise, created_at FROM orders WHERE customer_email=? ORDER BY created_at DESC LIMIT 20").bind(String((conversation as Record<string, unknown>).customer_email)).all(),
      ]);
      return Response.json({ conversation, messages: messages.results, notes: notes.results, orders: orders.results });
    }
    const queue = await DB.prepare("SELECT c.id, c.customer_email, c.customer_name, c.language, c.status, c.intent, c.assigned_agent_email, c.last_message_at, t.id ticket_id, t.subject, t.priority FROM support_conversations c LEFT JOIN support_tickets t ON t.conversation_id=c.id WHERE c.status!='CLOSED' ORDER BY CASE t.priority WHEN 'URGENT' THEN 0 WHEN 'HIGH' THEN 1 ELSE 2 END, c.last_message_at ASC LIMIT 200").all();
    const metrics = await DB.prepare("SELECT COUNT(*) open_conversations, SUM(CASE WHEN assigned_agent_email IS NOT NULL THEN 1 ELSE 0 END) active_conversations FROM support_conversations WHERE status!='CLOSED'").first();
    return Response.json({ queue: queue.results, metrics }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request); const body = await request.json() as { conversationId?: string; action?: string; message?: string; note?: string; status?: string };
    const id = body.conversationId?.trim(); if (!id) throw new HttpError(400, "conversationId is required.");
    const { DB } = commerceEnv(); const exists = await DB.prepare("SELECT id FROM support_conversations WHERE id=?").bind(id).first(); if (!exists) throw new HttpError(404, "Conversation not found.");
    const now = new Date().toISOString();
    if (body.action === "JOIN") await DB.prepare("UPDATE support_conversations SET assigned_agent_email=?, status='ACTIVE', updated_at=? WHERE id=?").bind(admin.email, now, id).run();
    else if (body.action === "MESSAGE") { const message = body.message?.trim().slice(0, 4000); if (!message) throw new HttpError(400, "Message is required."); await DB.batch([DB.prepare("INSERT INTO support_messages (id, conversation_id, sender_role, sender_email, body, message_type, delivery_status, created_at) VALUES (?, ?, 'AGENT', ?, ?, 'TEXT', 'DELIVERED', ?)").bind(crypto.randomUUID(), id, admin.email, message, now), DB.prepare("UPDATE support_conversations SET assigned_agent_email=?, status='ACTIVE', last_message_at=?, updated_at=? WHERE id=?").bind(admin.email, now, now, id)]); }
    else if (body.action === "NOTE") { const note = body.note?.trim().slice(0, 4000); if (!note) throw new HttpError(400, "Internal note is required."); await DB.prepare("INSERT INTO support_internal_notes (id, conversation_id, agent_email, body, created_at) VALUES (?, ?, ?, ?, ?)").bind(crypto.randomUUID(), id, admin.email, note, now).run(); }
    else if (body.action === "STATUS") { const allowed = new Set(["OPEN","WAITING_FOR_AGENT","ACTIVE","RESOLVED","CLOSED"]); if (!allowed.has(body.status ?? "")) throw new HttpError(400, "Invalid status."); await DB.batch([DB.prepare("UPDATE support_conversations SET status=?, updated_at=? WHERE id=?").bind(body.status, now, id), DB.prepare("UPDATE support_tickets SET status=?, updated_at=? WHERE conversation_id=?").bind(body.status, now, id)]); }
    else throw new HttpError(400, "Unsupported support action.");
    return Response.json({ updated: true, action: body.action, at: now });
  } catch (error) { return errorResponse(error); }
}
