import { env } from "cloudflare:workers";

export const MERCHANT_UPI_ID = "suryakannan32123@oksbi";
export const MERCHANT_NAME = "Surya Prakash K S";
export const MAX_PROOF_BYTES = 5 * 1024 * 1024;
const PASSWORD_HASH_ITERATIONS = 100_000;

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

export async function requireSiteUser(request: Request): Promise<SiteUser> {
  const token = readCookie(request, "nexora_session");
  if (!token) throw new HttpError(401, "Sign in securely to continue.");
  const tokenHash = await sha256(token);
  const record = await commerceEnv().DB.prepare(
    `SELECT u.email, u.display_name AS name
       FROM customer_sessions s
       JOIN customer_accounts u ON u.email = s.customer_email
      WHERE s.token_hash = ?1 AND s.expires_at > CURRENT_TIMESTAMP
      LIMIT 1`,
  ).bind(tokenHash).first<{ email: string; name: string }>();
  if (!record) throw new HttpError(401, "Your session has expired. Sign in again.");
  const email = record.email.toLowerCase();
  const name = record.name;
  const configuredAdmins = (
    commerceEnv().NEXORA_ADMIN_EMAILS ?? "kssuryaprakash2@gmail.com"
  )
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return { email, name, isAdmin: configuredAdmins.includes(email) };
}

export async function requireAdmin(request: Request): Promise<SiteUser> {
  const user = await requireSiteUser(request);
  if (!user.isAdmin) throw new HttpError(403, "Administrator access required.");
  return user;
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  const allowedOrigins = new Set([
    new URL(request.url).origin,
    "https://nexora-web-virid.vercel.app",
  ]);
  if (origin && !allowedOrigins.has(origin))
    throw new HttpError(403, "Request origin was rejected.");
}

export function normalizeEmail(value: string): string {
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
    throw new HttpError(400, "Enter a valid email address.");
  return email;
}

export function validatePassword(value: string): void {
  if (value.length < 10 || value.length > 128 || !/[A-Za-z]/.test(value) || !/\d/.test(value))
    throw new HttpError(400, "Use 10-128 characters with at least one letter and one number.");
}

export async function passwordHash(password: string, salt = randomToken(16)): Promise<{ hash: string; salt: string }> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({
    name: "PBKDF2",
    hash: "SHA-256",
    salt: fromBase64Url(salt),
    iterations: PASSWORD_HASH_ITERATIONS,
  }, key, 256);
  return { hash: toBase64Url(new Uint8Array(bits)), salt };
}

export async function passwordMatches(password: string, salt: string, expected: string): Promise<boolean> {
  const { hash } = await passwordHash(password, salt);
  return timingSafeEqual(hash, expected);
}

export async function createCustomerSession(email: string): Promise<{ token: string; expiresAt: string }> {
  const token = randomToken(32);
  const tokenHash = await sha256(token);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await commerceEnv().DB.prepare(
    "INSERT INTO customer_sessions (token_hash, customer_email, expires_at) VALUES (?1, ?2, ?3)",
  ).bind(tokenHash, email, expiresAt).run();
  return { token, expiresAt };
}

export function sessionCookie(token: string, expiresAt: string): string {
  return `nexora_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=${new Date(expiresAt).toUTCString()}`;
}

export function clearSessionCookie(): string {
  return "nexora_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0";
}

export async function revokeCustomerSession(request: Request): Promise<void> {
  const token = readCookie(request, "nexora_session");
  if (token) await commerceEnv().DB.prepare("DELETE FROM customer_sessions WHERE token_hash = ?1").bind(await sha256(token)).run();
}

function readCookie(request: Request, name: string): string | null {
  for (const part of (request.headers.get("cookie") ?? "").split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return null;
}

function randomToken(bytes: number): string {
  const value = new Uint8Array(bytes);
  crypto.getRandomValues(value);
  return toBase64Url(value);
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return toBase64Url(new Uint8Array(digest));
}

function toBase64Url(value: Uint8Array): string {
  return btoa(String.fromCharCode(...value)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return result === 0;
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
