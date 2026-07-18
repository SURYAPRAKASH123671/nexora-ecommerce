import { HttpError, razorpayEnv } from "@/lib/site-commerce";

const API = "https://api.razorpay.com/v1";

export type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  status: string;
};

export type RazorpayPayment = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  captured: boolean;
  error_code?: string;
  error_description?: string;
};

export async function createRazorpayOrder(
  orderNumber: string,
  amountPaise: number,
): Promise<RazorpayOrder> {
  return razorpayRequest<RazorpayOrder>("/orders", {
    method: "POST",
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt: orderNumber,
      notes: { nexora_order_number: orderNumber },
    }),
  });
}

export async function fetchRazorpayPayment(
  paymentId: string,
): Promise<RazorpayPayment> {
  if (!/^pay_[A-Za-z0-9]+$/.test(paymentId))
    throw new HttpError(400, "Invalid payment identifier.");
  return razorpayRequest<RazorpayPayment>(`/payments/${paymentId}`, {
    method: "GET",
  });
}

export async function verifyRazorpayPaymentSignature(
  providerOrderId: string,
  providerPaymentId: string,
  signature: string,
): Promise<boolean> {
  const { RAZORPAY_KEY_SECRET } = razorpayEnv();
  return verifyHmac(
    `${providerOrderId}|${providerPaymentId}`,
    signature,
    RAZORPAY_KEY_SECRET,
  );
}

export async function verifyRazorpayWebhookSignature(
  payload: string,
  signature: string,
): Promise<boolean> {
  const { RAZORPAY_WEBHOOK_SECRET } = razorpayEnv();
  return verifyHmac(payload, signature, RAZORPAY_WEBHOOK_SECRET);
}

async function razorpayRequest<T>(
  path: string,
  init: RequestInit,
): Promise<T> {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = razorpayEnv();
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok)
    throw new HttpError(
      502,
      `The payment provider rejected this request (${response.status}).`,
    );
  return (await response.json()) as T;
}

async function verifyHmac(
  payload: string,
  suppliedHex: string,
  secret: string,
): Promise<boolean> {
  if (!/^[a-f0-9]{64}$/i.test(suppliedHex)) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, encoder.encode(payload)),
  );
  const expected = [...digest]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
  let difference = expected.length ^ suppliedHex.length;
  for (let index = 0; index < expected.length; index += 1)
    difference |= expected.charCodeAt(index) ^ suppliedHex.charCodeAt(index);
  return difference === 0;
}
