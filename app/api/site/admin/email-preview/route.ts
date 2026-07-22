import { commerceEnv, errorResponse, HttpError, requireAdmin } from "@/lib/site-commerce";
import { OrderEmailData, renderOrderConfirmationHtml, renderOrderConfirmationText } from "@/lib/order-email-template";

function sampleData(scenario: string, baseUrl: string): OrderEmailData {
  const prepaid = scenario === "PREPAID";
  const multiple = scenario === "MULTI_ITEM";
  const longAddress = scenario === "LONG_ADDRESS";
  const items = [{ name: "Nexora Studio Headphones", variantName: "Midnight · Wireless", quantity: 1, unitPrice: 12999, lineTotal: 12999, imageUrl: `${baseUrl}/products/audio-1.webp` }];
  if (multiple) items.push({ name: "Nexora Travel Power Kit", variantName: "65W · Graphite", quantity: 2, unitPrice: 2499, lineTotal: 4998, imageUrl: "" });
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  return {
    customerName: "Surya Prakash", customerEmail: "preview@example.com", publicOrderReference: "NX-20260722-8F42K",
    orderDate: "2026-07-22T15:42:00+05:30", paymentMethod: prepaid ? "RAZORPAY" : "COD",
    paymentStatus: prepaid ? "VERIFIED" : "COD_PENDING", orderStatus: "CONFIRMED", items,
    subtotal, deliveryFee: subtotal >= 5000 ? 0 : 99, total: subtotal + (subtotal >= 5000 ? 0 : 99),
    shippingAddress: { fullName: "Surya Prakash", phone: "+91 91503 57320", line1: longAddress ? "Apartment 1402, Aster Residency, Second Cross Road, Near the Community Library and Technology Park" : "42 Lake View Road", city: "Chennai", state: "Tamil Nadu", pincode: "600001" },
    viewOrderUrl: `${baseUrl}/account?order=NX-20260722-8F42K`, supportUrl: `${baseUrl}/contact-us?order=NX-20260722-8F42K`, cancellable: !prepaid,
  };
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const env = commerceEnv();
    if (env.NEXORA_EMAIL_PREVIEW_ENABLED !== "true") throw new HttpError(404, "Email preview is disabled.");
    const url = new URL(request.url);
    const scenario = (url.searchParams.get("scenario") ?? "COD").toUpperCase();
    if (!["COD", "PREPAID", "MULTI_ITEM", "LONG_ADDRESS"].includes(scenario)) throw new HttpError(400, "Unsupported preview scenario.");
    const data = sampleData(scenario, (env.NEXORA_APP_URL ?? url.origin).replace(/\/$/, ""));
    if (url.searchParams.get("format") === "text") return new Response(renderOrderConfirmationText(data), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
    return new Response(renderOrderConfirmationHtml(data), { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
  } catch (error) { return errorResponse(error); }
}
