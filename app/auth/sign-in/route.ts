function safeReturnTo(request: Request) {
  const value = new URL(request.url).searchParams.get("return_to") ?? "/";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export function GET(request: Request) {
  const destination = `/account?return_to=${encodeURIComponent(safeReturnTo(request))}`;
  return new Response(null, { status: 302, headers: { Location: destination } });
}
