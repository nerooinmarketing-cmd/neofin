import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { quoteRequestRepository } from "@/server/repositories/quote-request-repository";
import { getClientIp } from "@/server/auth/request-info";
import { checkRateLimit } from "@/server/security/rate-limit";

const quoteRequestSchema = z.object({
  name: z.string().trim().min(2, "Ad soyad gerekli").max(200),
  phone: z.string().trim().min(10, "Telefon numarası gerekli").max(30),
  companyName: z.string().trim().max(200).optional(),
  message: z.string().trim().max(2000).optional(),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  const rateLimit = checkRateLimit(`quote-request:${ip}`, {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.retryAfterMs ?? 0) / 1000)) } },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = quoteRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Lütfen ad soyad ve telefon numaranızı girin." }, { status: 400 });
  }

  const quoteRequest = await quoteRequestRepository.create(parsed.data);
  return NextResponse.json({ id: quoteRequest.id });
}
