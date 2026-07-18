import { commerceEnv, errorResponse, HttpError, requireSiteUser } from "@/lib/site-commerce";

const languages = new Set(["en", "ta", "hi"]);
const intents = new Set(["GENERAL", "PRODUCT", "ORDER", "RETURN", "REFUND", "WARRANTY", "PAYMENT", "ACCOUNT"]);

export async function GET(request: Request) {
  try {
    const user = requireSiteUser(request);
    const { DB } = commerceEnv();
    const rows = await DB.prepare("SELECT id, language, status, intent, assigned_agent_email, summary, last_message_at, created_at FROM support_conversations WHERE customer_email=? ORDER BY last_message_at DESC LIMIT 50")
      .bind(user.email).all();
    return Response.json(rows.results, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const user = requireSiteUser(request);
    const body = await request.json() as { language?: string; intent?: string; subject?: string; orderNumber?: string };
    const language = languages.has(body.language ?? "") ? body.language! : "en";
    const intent = intents.has(body.intent ?? "") ? body.intent! : "GENERAL";
    const subject = clean(body.subject ?? "Customer support conversation", 120);
    const orderNumber = body.orderNumber ? clean(body.orderNumber, 80) : null;
    const { DB } = commerceEnv();
    const openCount = await DB.prepare("SELECT COUNT(*) total FROM support_conversations WHERE customer_email=? AND status IN ('OPEN','WAITING_FOR_AGENT','ACTIVE')").bind(user.email).first<{ total: number }>();
    if (Number(openCount?.total ?? 0) >= 5) throw new HttpError(429, "You already have five active support conversations.");
    const id = crypto.randomUUID(); const ticketId = `NXS-${crypto.randomUUID().slice(0, 8).toUpperCase()}`; const now = new Date().toISOString();
    await DB.batch([
      DB.prepare("INSERT INTO support_conversations (id, customer_email, customer_name, language, status, intent, last_message_at, created_at, updated_at) VALUES (?, ?, ?, ?, 'OPEN', ?, ?, ?, ?)").bind(id, user.email, user.name, language, intent, now, now, now),
      DB.prepare("INSERT INTO support_tickets (id, conversation_id, customer_email, order_number, ticket_type, priority, status, subject, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'NORMAL', 'OPEN', ?, ?, ?)").bind(ticketId, id, user.email, orderNumber, intent, subject, now, now),
      DB.prepare("INSERT INTO support_messages (id, conversation_id, sender_role, sender_email, body, message_type, delivery_status, created_at) VALUES (?, ?, 'SYSTEM', 'nexora-support', ?, 'STATUS', 'DELIVERED', ?)").bind(crypto.randomUUID(), id, language === "ta" ? "உங்கள் ஆதரவு உரையாடல் உருவாக்கப்பட்டது." : language === "hi" ? "आपकी सहायता बातचीत बनाई गई है।" : "Your support conversation is ready.", now),
    ]);
    return Response.json({ id, ticketId, status: "OPEN", language }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}

function clean(value: string, maximum: number) { const result = value.trim().replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " "); if (!result) throw new HttpError(400, "Required support information is missing."); return result.slice(0, maximum); }
