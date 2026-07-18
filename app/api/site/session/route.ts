import { errorResponse, requireSiteUser } from "@/lib/site-commerce";

export async function GET(request: Request) {
  try {
    return Response.json({ user: await requireSiteUser(request) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
