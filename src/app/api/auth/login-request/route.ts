import { NextResponse, type NextRequest } from "next/server";
import { createLoginRequestByPhone } from "@/server/auth/login-approval-service";
import { getClientIp, getDeviceInfo } from "@/server/auth/request-info";
import { checkRateLimit } from "@/server/security/rate-limit";
import { isValidTurkishMobile } from "@/lib/phone";

const ERROR_MESSAGES = {
  NOT_FOUND: "Bu telefon numarasına kayıtlı bir hesap bulunamadı.",
  NO_TELEGRAM: "Bu hesaba bağlı bir Telegram hesabı yok. Yöneticinizden eşleştirme kodu isteyin.",
};

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

  const body = (await request.json().catch(() => null)) as { phone?: string } | null;
  if (!body?.phone || !isValidTurkishMobile(body.phone)) {
    return NextResponse.json({ error: "Geçerli bir telefon numarası girin." }, { status: 400 });
  }

  const result = await createLoginRequestByPhone({
    phone: body.phone,
    deviceInfo: getDeviceInfo(request),
    ipAddress: ip,
  });

  if (!result.ok) {
    return NextResponse.json({ error: ERROR_MESSAGES[result.error] }, { status: 404 });
  }

  return NextResponse.json({ token: result.token, expiresAt: result.expiresAt });
}
