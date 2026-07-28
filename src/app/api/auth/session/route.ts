import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSessionFromApproval,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/server/auth/session-service";
import { getClientIp, getDeviceInfo } from "@/server/auth/request-info";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { token?: string } | null;
  const token = body?.token;
  if (!token) {
    return NextResponse.json({ error: "token gerekli" }, { status: 400 });
  }

  const approval = await prisma.loginApproval.findUnique({ where: { token } });
  if (!approval || approval.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Bu istek onaylanmış bir girişe ait değil." },
      { status: 409 },
    );
  }

  const result = await createSessionFromApproval({
    approvalId: approval.id,
    deviceInfo: getDeviceInfo(request),
    ipAddress: getClientIp(request),
  });
  if (!result) {
    return NextResponse.json(
      { error: "Bu giriş isteği zaten kullanılmış." },
      { status: 409 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, result.rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
