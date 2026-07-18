function safeReturnTo(request: Request) {
  const value = new URL(request.url).searchParams.get("return_to") ?? "/";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export async function GET(request: Request) {
  await revokeCustomerSession(request);
  return new Response(null, { status: 302, headers: { Location: safeReturnTo(request), "Set-Cookie": clearSessionCookie() } });
}
import { clearSessionCookie, revokeCustomerSession } from "@/lib/site-commerce";
