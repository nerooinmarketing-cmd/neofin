import { NextResponse, type NextRequest } from "next/server";
import { revokeSessionByToken, SESSION_COOKIE_NAME } from "@/server/auth/session-service";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await revokeSessionByToken(token);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
