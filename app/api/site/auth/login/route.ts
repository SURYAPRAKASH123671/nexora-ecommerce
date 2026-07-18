import {
  assertSameOrigin,
  commerceEnv,
  createCustomerSession,
  errorResponse,
  HttpError,
  normalizeEmail,
  passwordMatches,
  sessionCookie,
} from "@/lib/site-commerce";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = (await request.json()) as { email?: string; password?: string };
    const email = normalizeEmail(String(body.email ?? ""));
    const password = String(body.password ?? "");
    const account = await commerceEnv().DB.prepare(
      "SELECT display_name AS name, password_hash AS hash, password_salt AS salt FROM customer_accounts WHERE email = ?1",
    ).bind(email).first<{ name: string; hash: string; salt: string }>();
    if (!account || !(await passwordMatches(password, account.salt, account.hash)))
      throw new HttpError(401, "Email or password is incorrect.");
    const session = await createCustomerSession(email);
    const configuredAdmins = (commerceEnv().NEXORA_ADMIN_EMAILS ?? "kssuryaprakash2@gmail.com").split(",").map((value) => value.trim().toLowerCase());
    return Response.json(
      { user: { email, name: account.name, isAdmin: configuredAdmins.includes(email) } },
      { headers: { "Set-Cookie": sessionCookie(session.token, session.expiresAt), "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
