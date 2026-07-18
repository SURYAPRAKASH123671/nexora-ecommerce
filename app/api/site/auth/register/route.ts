import {
  assertSameOrigin,
  commerceEnv,
  createCustomerSession,
  errorResponse,
  HttpError,
  normalizeEmail,
  passwordHash,
  sessionCookie,
  validatePassword,
} from "@/lib/site-commerce";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = (await request.json()) as { name?: string; email?: string; password?: string };
    const name = String(body.name ?? "").trim().replace(/\s+/g, " ");
    if (name.length < 2 || name.length > 80) throw new HttpError(400, "Enter your full name.");
    const email = normalizeEmail(String(body.email ?? ""));
    const password = String(body.password ?? "");
    validatePassword(password);
    const existing = await commerceEnv().DB.prepare("SELECT email FROM customer_accounts WHERE email = ?1").bind(email).first();
    if (existing) throw new HttpError(409, "An account already exists for this email.");
    const credentials = await passwordHash(password);
    await commerceEnv().DB.prepare(
      "INSERT INTO customer_accounts (email, display_name, password_hash, password_salt) VALUES (?1, ?2, ?3, ?4)",
    ).bind(email, name, credentials.hash, credentials.salt).run();
    const session = await createCustomerSession(email);
    const configuredAdmins = (commerceEnv().NEXORA_ADMIN_EMAILS ?? "kssuryaprakash2@gmail.com").split(",").map((value) => value.trim().toLowerCase());
    return Response.json(
      { user: { email, name, isAdmin: configuredAdmins.includes(email) } },
      { status: 201, headers: { "Set-Cookie": sessionCookie(session.token, session.expiresAt), "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
