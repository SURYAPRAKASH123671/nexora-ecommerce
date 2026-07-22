import { HttpError, internationalPaymentEnv } from "@/lib/site-commerce";

export type HostedCheckout = { providerOrderId: string; checkoutUrl: string; currency: "INR" };

export async function createStripeCheckout(orderNumber: string, amountPaise: number, email: string, origin: string): Promise<HostedCheckout> {
  const { STRIPE_SECRET_KEY } = internationalPaymentEnv();
  if (!STRIPE_SECRET_KEY) throw new HttpError(503, "Stripe is temporarily unavailable.");
  const form = new URLSearchParams({ mode: "payment", success_url: `${origin}/checkout?gateway=stripe&order=${encodeURIComponent(orderNumber)}&session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${origin}/checkout?gateway=stripe&cancelled=true`, client_reference_id: orderNumber, customer_email: email,
    "metadata[order_number]": orderNumber, "line_items[0][quantity]": "1", "line_items[0][price_data][currency]": "inr", "line_items[0][price_data][unit_amount]": String(amountPaise), "line_items[0][price_data][product_data][name]": `Nexora order ${orderNumber}` });
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded", "Idempotency-Key": `stripe-${orderNumber}` }, body: form });
  const body = await response.json() as { id?: string; url?: string; error?: { message?: string } };
  if (!response.ok || !body.id || !body.url) throw new HttpError(502, body.error?.message ?? "Stripe rejected the checkout.");
  return { providerOrderId: body.id, checkoutUrl: body.url, currency: "INR" };
}

async function paypalToken() { const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_BASE_URL } = internationalPaymentEnv(); if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) throw new HttpError(503, "PayPal is temporarily unavailable.");
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, { method: "POST", headers: { Authorization: `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`)}`, "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=client_credentials" }); const body = await response.json() as { access_token?: string }; if (!response.ok || !body.access_token) throw new HttpError(502, "PayPal authentication failed."); return { token: body.access_token, base: PAYPAL_BASE_URL }; }

export async function createPayPalCheckout(orderNumber: string, amountPaise: number, origin: string): Promise<HostedCheckout> { const { token, base } = await paypalToken();
  const response = await fetch(`${base}/v2/checkout/orders`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "PayPal-Request-Id": `paypal-${orderNumber}` }, body: JSON.stringify({ intent: "CAPTURE", purchase_units: [{ reference_id: orderNumber, custom_id: orderNumber, amount: { currency_code: "INR", value: (amountPaise / 100).toFixed(2) } }], payment_source: { paypal: { experience_context: { return_url: `${origin}/checkout?gateway=paypal&order=${encodeURIComponent(orderNumber)}`, cancel_url: `${origin}/checkout?gateway=paypal&cancelled=true` } } } }) });
  const body = await response.json() as { id?: string; links?: Array<{ rel: string; href: string }> }; const url = body.links?.find(link => link.rel === "payer-action" || link.rel === "approve")?.href; if (!response.ok || !body.id || !url) throw new HttpError(502, "PayPal rejected the checkout."); return { providerOrderId: body.id, checkoutUrl: url, currency: "INR" };
}

export async function confirmHostedPayment(gateway: "STRIPE" | "PAYPAL", providerOrderId: string, orderNumber: string, amountPaise: number) {
  if (gateway === "STRIPE") { const { STRIPE_SECRET_KEY } = internationalPaymentEnv(); const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(providerOrderId)}`, { headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` } }); const body = await response.json() as { payment_status?: string; amount_total?: number; currency?: string; client_reference_id?: string; payment_intent?: string }; if (!response.ok || body.payment_status !== "paid" || body.amount_total !== amountPaise || body.currency?.toUpperCase() !== "INR" || body.client_reference_id !== orderNumber) throw new HttpError(409, "Stripe payment could not be verified."); return body.payment_intent ?? providerOrderId; }
  const { token, base } = await paypalToken(); const response = await fetch(`${base}/v2/checkout/orders/${encodeURIComponent(providerOrderId)}/capture`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "PayPal-Request-Id": `capture-${orderNumber}` }, body: "{}" }); const body = await response.json() as { status?: string; purchase_units?: Array<{ payments?: { captures?: Array<{ id?: string; status?: string; amount?: { currency_code?: string; value?: string } }> } }> }; const capture = body.purchase_units?.[0]?.payments?.captures?.[0]; if (!response.ok || body.status !== "COMPLETED" || capture?.status !== "COMPLETED" || capture.amount?.currency_code !== "INR" || Math.round(Number(capture.amount?.value) * 100) !== amountPaise || !capture.id) throw new HttpError(409, "PayPal payment could not be verified."); return capture.id;
}
