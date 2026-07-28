import { NextResponse, type NextRequest } from "next/server";
import { createLoginRequest } from "@/server/auth/login-approval-service";
import { getClientIp, getDeviceInfo } from "@/server/auth/request-info";
import { checkRateLimit } from "@/server/security/rate-limit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  const rateLimit = checkRateLimit(`login-request:${ip}`, {
    maxRequests: 10,
    windowMs: 5 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.retryAfterMs ?? 0) / 1000)) } },
    );
  }

  const result = await createLoginRequest({
    deviceInfo: getDeviceInfo(request),
    ipAddress: ip,
  });

  return NextResponse.json(result);
}
