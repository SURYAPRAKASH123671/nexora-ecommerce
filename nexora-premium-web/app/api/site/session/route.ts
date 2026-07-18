import { errorResponse, requireSiteUser } from "@/lib/site-commerce";

export async function GET(request: Request) {
  try {
    return Response.json({ user: requireSiteUser(request) });
  } catch (error) {
    return errorResponse(error);
  }
}
