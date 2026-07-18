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
    const conversation = await DB.prepare("SELECT language FROM support_conversations WHERE id=?").bind(id).first<{ language: string }>();
    const supportReply = createSupportReply(message, conversation?.language ?? "en");
    const supportReplyId = crypto.randomUUID();
    await DB.batch([
      DB.prepare("INSERT INTO support_messages (id, conversation_id, sender_role, sender_email, body, message_type, delivery_status, created_at) VALUES (?, ?, 'CUSTOMER', ?, ?, 'TEXT', 'DELIVERED', ?)").bind(messageId, id, user.email, message, now),
      DB.prepare("INSERT INTO support_messages (id, conversation_id, sender_role, sender_email, body, message_type, delivery_status, created_at) VALUES (?, ?, 'SYSTEM', 'care@nexora.support', ?, 'SUPPORT_REPLY', 'DELIVERED', ?)").bind(supportReplyId, id, supportReply, now),
      DB.prepare("UPDATE support_conversations SET status=CASE WHEN status='OPEN' THEN 'WAITING_FOR_AGENT' ELSE status END, last_message_at=?, updated_at=? WHERE id=?").bind(now, now, id),
    ]);
    return Response.json({ id: messageId, status: "DELIVERED", createdAt: now, supportReply }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}

async function own(DB: ReturnType<typeof commerceEnv>["DB"], id: string, email: string) { const row = await DB.prepare("SELECT id FROM support_conversations WHERE id=? AND customer_email=?").bind(id, email).first(); if (!row) throw new HttpError(404, "Support conversation not found."); }

function createSupportReply(message: string, language: string) {
  const normalized = message.toLocaleLowerCase("en-IN");
  const intent = normalized.includes("order") || normalized.includes("track")
    ? "ORDER"
    : normalized.includes("return") || normalized.includes("refund")
      ? "RETURN"
      : normalized.includes("payment") || normalized.includes("upi") || normalized.includes("razorpay")
        ? "PAYMENT"
        : normalized.includes("product") || normalized.includes("recommend") || normalized.includes("compare")
          ? "PRODUCT"
          : "GREETING";

  const replies: Record<string, Record<string, string>> = {
    en: {
      GREETING: "Hi! Welcome to Nexora Support. How can we help with a product, order, payment, delivery, return, or account today? Our support team can review this conversation too.",
      ORDER: "I can help with your order. Please share the Nexora order number and whether you want tracking, cancellation, an invoice, or delivery help. Do not share passwords or payment credentials.",
      RETURN: "I can help with a return or refund. Please share the Nexora order number and the item issue. Eligible return requests are reviewed against the displayed return policy.",
      PAYMENT: "I can help with payment questions. Please share only the Nexora order number or payment reference—never your OTP, UPI PIN, CVV, or full card details. Payment confirmation remains server-verified.",
      PRODUCT: "Tell me the product name and what you want to know—specifications, compatibility, comparison, availability, or recommendations—and I’ll guide you using Nexora catalogue information.",
    },
    ta: {
      GREETING: "வணக்கம்! Nexora ஆதரவுக்கு வரவேற்கிறோம். பொருள், ஆர்டர், பணம் செலுத்துதல், டெலிவரி, ரிட்டர்ன் அல்லது கணக்கு குறித்து எப்படி உதவலாம்? எங்கள் ஆதரவு குழுவும் இந்த உரையாடலை பார்க்கலாம்.",
      ORDER: "உங்கள் ஆர்டருக்கு உதவ முடியும். Nexora ஆர்டர் எண்ணையும், டிராக்கிங், ரத்து, இன்வாய்ஸ் அல்லது டெலிவரி உதவி எது வேண்டும் என்பதையும் தெரிவியுங்கள்.",
      RETURN: "ரிட்டர்ன் அல்லது ரீஃபண்டுக்கு உதவ முடியும். Nexora ஆர்டர் எண்ணையும் பொருளின் பிரச்சினையையும் தெரிவியுங்கள்.",
      PAYMENT: "பணம் செலுத்துதல் குறித்து உதவ முடியும். ஆர்டர் எண் அல்லது பரிவர்த்தனை குறிப்பை மட்டும் பகிருங்கள். OTP, UPI PIN, CVV அல்லது முழு கார்டு விவரங்களை பகிர வேண்டாம்.",
      PRODUCT: "பொருளின் பெயரையும், விவரக்குறிப்பு, பொருத்தம், ஒப்பீடு, கிடைப்பது அல்லது பரிந்துரை எது தேவை என்பதையும் தெரிவியுங்கள்.",
    },
    hi: {
      GREETING: "नमस्ते! Nexora Support में आपका स्वागत है। उत्पाद, ऑर्डर, भुगतान, डिलीवरी, रिटर्न या अकाउंट में हम कैसे मदद कर सकते हैं? हमारी सहायता टीम भी इस बातचीत को देख सकती है।",
      ORDER: "मैं आपके ऑर्डर में मदद कर सकता हूँ। Nexora ऑर्डर नंबर और ट्रैकिंग, कैंसलेशन, इनवॉइस या डिलीवरी में से आवश्यक सहायता बताइए।",
      RETURN: "रिटर्न या रिफंड के लिए Nexora ऑर्डर नंबर और उत्पाद की समस्या बताइए। अनुरोध प्रदर्शित रिटर्न नीति के अनुसार जाँचा जाएगा।",
      PAYMENT: "भुगतान सहायता के लिए केवल ऑर्डर नंबर या भुगतान संदर्भ साझा करें। OTP, UPI PIN, CVV या पूरे कार्ड विवरण कभी साझा न करें।",
      PRODUCT: "उत्पाद का नाम और स्पेसिफिकेशन, कम्पैटिबिलिटी, तुलना, उपलब्धता या सुझाव में से आवश्यक जानकारी बताइए।",
    },
  };
  return (replies[language] ?? replies.en)[intent];
}
