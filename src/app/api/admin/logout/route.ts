import { NextResponse, type NextRequest } from "next/server";
import { revokeAdminSessionByToken, ADMIN_SESSION_COOKIE_NAME } from "@/server/admin/admin-session-service";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  if (token) {
    await revokeAdminSessionByToken(token);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(ADMIN_SESSION_COOKIE_NAME);
  return response;
}
