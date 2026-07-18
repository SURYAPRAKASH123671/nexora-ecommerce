import { env } from "cloudflare:workers";

export const MERCHANT_UPI_ID = "suryakannan32123@oksbi";
export const MERCHANT_NAME = "Surya Prakash K S";
export const MAX_PROOF_BYTES = 5 * 1024 * 1024;

type CommerceEnv = {
  DB: D1Database;
  PAYMENT_PROOFS: R2Bucket;
  NEXORA_ADMIN_EMAILS?: string;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  RAZORPAY_WEBHOOK_SECRET?: string;
};

export type SiteUser = { email: string; name: string; isAdmin: boolean };

export function commerceEnv(): CommerceEnv {
  const bindings = env as unknown as CommerceEnv;
  if (!bindings.DB || !bindings.PAYMENT_PROOFS) {
    throw new Error("Nexora storage is not configured.");
  }
  return bindings;
}

export function razorpayEnv(): Required<
  Pick<
    CommerceEnv,
    "RAZORPAY_KEY_ID" | "RAZORPAY_KEY_SECRET" | "RAZORPAY_WEBHOOK_SECRET"
  >
> {
  const bindings = commerceEnv();
  if (
    !bindings.RAZORPAY_KEY_ID?.startsWith("rzp_live_") ||
    !bindings.RAZORPAY_KEY_SECRET ||
    !bindings.RAZORPAY_WEBHOOK_SECRET
  )
    throw new HttpError(503, "Secure online payments are temporarily unavailable.");
  return {
    RAZORPAY_KEY_ID: bindings.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: bindings.RAZORPAY_KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET: bindings.RAZORPAY_WEBHOOK_SECRET,
  };
}

export function requireSiteUser(request: Request): SiteUser {
  const email = request.headers
    .get("oai-authenticated-user-email")
    ?.trim()
    .toLowerCase();
  if (!email) throw new HttpError(401, "Sign in securely to continue.");
  const encodedName = request.headers.get("oai-authenticated-user-full-name");
  const name =
    encodedName &&
    request.headers.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? (safeDecode(encodedName) ?? email)
      : email;
  const configuredAdmins = (
    commerceEnv().NEXORA_ADMIN_EMAILS ?? "kssuryaprakash2@gmail.com"
  )
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return { email, name, isAdmin: configuredAdmins.includes(email) };
}

export function requireAdmin(request: Request): SiteUser {
  const user = requireSiteUser(request);
  if (!user.isAdmin) throw new HttpError(403, "Administrator access required.");
  return user;
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError)
    return Response.json({ message: error.message }, { status: error.status });
  const message =
    error instanceof Error ? error.message : "Unexpected request failure.";
  return Response.json({ message }, { status: 500 });
}

export function upiPaymentUri(
  orderNumber: string,
  amountPaise: number,
): string {
  const amount = (amountPaise / 100).toFixed(2);
  const encode = (value: string) =>
    encodeURIComponent(value).replaceAll("%20", "%20");
  return `upi://pay?pa=${encode(MERCHANT_UPI_ID)}&pn=${encode(MERCHANT_NAME)}&cu=INR&am=${amount}&tn=${encode(`Nexora Order #${orderNumber}`)}`;
}

export async function validateProof(
  file: File,
): Promise<{
  bytes: ArrayBuffer;
  contentType: string;
  extension: string;
  sha256: string;
}> {
  if (!file.size || file.size > MAX_PROOF_BYTES)
    throw new HttpError(
      400,
      "Payment screenshots must be between 1 byte and 5 MB.",
    );
  const bytes = await file.arrayBuffer();
  const view = new Uint8Array(bytes);
  let contentType = "";
  let extension = "";
  if (
    view.length >= 8 &&
    view[0] === 0x89 &&
    view[1] === 0x50 &&
    view[2] === 0x4e &&
    view[3] === 0x47 &&
    view[4] === 0x0d &&
    view[5] === 0x0a &&
    view[6] === 0x1a &&
    view[7] === 0x0a
  ) {
    contentType = "image/png";
    extension = ".png";
  } else if (
    view.length >= 3 &&
    view[0] === 0xff &&
    view[1] === 0xd8 &&
    view[2] === 0xff
  ) {
    contentType = "image/jpeg";
    extension = ".jpg";
  } else if (
    view.length >= 12 &&
    String.fromCharCode(...view.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...view.slice(8, 12)) === "WEBP"
  ) {
    contentType = "image/webp";
    extension = ".webp";
  } else {
    throw new HttpError(
      400,
      "Only genuine PNG, JPEG, or WebP screenshots are accepted.",
    );
  }
  if (file.type && file.type !== contentType)
    throw new HttpError(
      400,
      "The uploaded file content does not match its image type.",
    );
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const sha256 = [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
  return { bytes, contentType, extension, sha256 };
}

export function safeFileName(value: string): string {
  return (value || "payment-proof")
    .split(/[\\/]/)
    .pop()!
    .replace(/[^a-zA-Z0-9._ -]/g, "_")
    .slice(-255);
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function safeDecode(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}
