import { NextResponse, type NextRequest } from "next/server";
import { getTenantContextFromRequest } from "@/server/auth/api-tenant-context";
import { prisma } from "@/lib/prisma";
import { telegramBotClient } from "@/server/telegram/bot-client";

/** "Telegram'da paylaşılabilir bağlantı" — rapor URL'sini kullanıcının kendi Telegram hesabına gönderir. */
export async function POST(request: NextRequest) {
  const ctx = await getTenantContextFromRequest(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { reportTitle?: string; reportPath?: string } | null;
  if (!body?.reportTitle || !body.reportPath) {
    return NextResponse.json({ error: "reportTitle ve reportPath gerekli" }, { status: 400 });
  }

  const telegramAccount = await prisma.telegramAccount.findFirst({
    where: { companyId: ctx.companyId, companyUserId: ctx.companyUserId },
  });
  if (!telegramAccount) {
    return NextResponse.json({ error: "Telegram hesabınız bağlı değil." }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const link = `${appUrl}${body.reportPath}`;

  await telegramBotClient.sendMessage(
    telegramAccount.telegramUserId.toString(),
    `📊 ${body.reportTitle}\n\n${link}`,
  );

  return NextResponse.json({ ok: true });
}
