import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createDevSession,
  isDevLoginEnabled,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/server/auth/session-service";
import { getClientIp, getDeviceInfo } from "@/server/auth/request-info";

/** Yalnızca yerel geliştirmede: seed edilmiş kullanıcıları listeler. */
export async function GET() {
  if (!isDevLoginEnabled()) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const users = await prisma.companyUser.findMany({
    where: { deletedAt: null },
    include: { company: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      role: u.role,
      companyName: u.company.shortName ?? "(kurulum tamamlanmadı)",
    })),
  });
}

export async function POST(request: NextRequest) {
  if (!isDevLoginEnabled()) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as { companyUserId?: string } | null;
  if (!body?.companyUserId) {
    return NextResponse.json({ error: "companyUserId gerekli" }, { status: 400 });
  }

  const result = await createDevSession({
    companyUserId: body.companyUserId,
    deviceInfo: getDeviceInfo(request),
    ipAddress: getClientIp(request),
  });

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
