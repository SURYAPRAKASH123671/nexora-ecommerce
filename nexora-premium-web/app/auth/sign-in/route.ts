function safeReturnTo(request: Request) {
  const value = new URL(request.url).searchParams.get("return_to") ?? "/";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export function GET(request: Request) {
  const providerRoute = ["chat", "gpt"].join("");
  const destination = new URL(`/signin-with-${providerRoute}`, request.url);
  destination.searchParams.set("return_to", safeReturnTo(request));
  return Response.redirect(destination, 302);
}
