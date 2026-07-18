import { commerceEnv, errorResponse, HttpError, requireSiteUser, safeFileName } from "@/lib/site-commerce";

const MAX = 8 * 1024 * 1024;
export async function POST(request: Request) {
  try {
    const user = await requireSiteUser(request); const form = await request.formData(); const conversationId = String(form.get("conversationId") ?? ""); const file = form.get("file");
    if (!(file instanceof File) || !conversationId) throw new HttpError(400, "Conversation and file are required.");
    const { DB, PAYMENT_PROOFS } = commerceEnv(); const own = await DB.prepare("SELECT id FROM support_conversations WHERE id=? AND customer_email=?").bind(conversationId, user.email).first(); if (!own) throw new HttpError(404, "Conversation not found.");
    if (!file.size || file.size > MAX) throw new HttpError(400, "Attachments must be between 1 byte and 8 MB.");
    const bytes = await file.arrayBuffer(); const view = new Uint8Array(bytes); const detected = detect(view);
    if (!detected || (file.type && file.type !== detected.type)) throw new HttpError(400, "Only genuine PNG, JPEG, WebP, or PDF files are accepted.");
    const digest = await crypto.subtle.digest("SHA-256", bytes); const sha256 = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2,"0")).join("");
    const id = crypto.randomUUID(); const objectKey = `support/${user.email}/${conversationId}/${id}${detected.ext}`; const now = new Date().toISOString();
    await PAYMENT_PROOFS.put(objectKey, bytes, { httpMetadata: { contentType: detected.type, contentDisposition: `attachment; filename="${safeFileName(file.name)}"` }, customMetadata: { customerEmail: user.email, conversationId, sha256 } });
    await DB.prepare("INSERT INTO support_attachments (id, conversation_id, customer_email, object_key, original_name, content_type, size_bytes, sha256, scan_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_EXTERNAL_SCAN', ?)").bind(id, conversationId, user.email, objectKey, safeFileName(file.name), detected.type, file.size, sha256, now).run();
    return Response.json({ id, name: safeFileName(file.name), contentType: detected.type, size: file.size, scanStatus: "PENDING_EXTERNAL_SCAN" }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}

export async function GET(request: Request) {
  try {
    const user = await requireSiteUser(request); const id = new URL(request.url).searchParams.get("id"); if (!id) throw new HttpError(400, "Attachment id is required.");
    const { DB, PAYMENT_PROOFS } = commerceEnv(); const attachment = await DB.prepare("SELECT object_key, original_name, content_type, customer_email FROM support_attachments WHERE id=?").bind(id).first<Record<string,string>>();
    if (!attachment || (attachment.customer_email !== user.email && !user.isAdmin)) throw new HttpError(404, "Attachment not found.");
    const object = await PAYMENT_PROOFS.get(attachment.object_key); if (!object) throw new HttpError(404, "Attachment content not found.");
    return new Response(object.body, { headers: { "Content-Type": attachment.content_type, "Content-Disposition": `attachment; filename="${attachment.original_name}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) { return errorResponse(error); }
}

function detect(view: Uint8Array) { if (view.length >= 8 && view[0]===0x89 && view[1]===0x50 && view[2]===0x4e && view[3]===0x47) return { type:"image/png",ext:".png" }; if (view.length>=3 && view[0]===0xff && view[1]===0xd8 && view[2]===0xff) return {type:"image/jpeg",ext:".jpg"}; if (view.length>=12 && String.fromCharCode(...view.slice(0,4))==="RIFF" && String.fromCharCode(...view.slice(8,12))==="WEBP") return {type:"image/webp",ext:".webp"}; if (view.length>=5 && String.fromCharCode(...view.slice(0,5))==="%PDF-") return {type:"application/pdf",ext:".pdf"}; return null; }
