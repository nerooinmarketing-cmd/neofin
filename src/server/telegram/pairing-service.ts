import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { telegramBotClient } from "@/server/telegram/bot-client";
import { getMainMenuKeyboard } from "@/server/telegram/main-menu";

const PAIRING_TTL_MS = 15 * 60 * 1000; // 15 dakika

/**
 * Sistem yöneticisinin bir firma kullanıcısı için ürettiği tek kullanımlık
 * eşleştirme bağlantısı (bkz. Aşama 15: "Telegram eşleştirme kodu
 * oluştur/yenile"). `LoginApproval`daki onay/red akışından farklıdır —
 * burada tek adım vardır: "bu Telegram hesabını bu kullanıcıya bağla".
 */
export async function createPairingCode(companyId: string, companyUserId: string) {
  const token = crypto.randomBytes(16).toString("base64url");
  const expiresAt = new Date(Date.now() + PAIRING_TTL_MS);

  await prisma.telegramPairingCode.create({
    data: { token, companyId, companyUserId, expiresAt },
  });

  const botUsername = process.env.TELEGRAM_BOT_USERNAME;
  const deepLink = botUsername ? `https://t.me/${botUsername}?start=${token}` : null;
  return { token, deepLink, expiresAt };
}

/** `true` dönerse token bir eşleştirme koduydu ve işlendi; `false` ise webhook normal /start akışına devam etmeli. */
export async function tryConsumePairingCode(params: {
  token: string;
  telegramUserId: bigint;
  chatId: number;
  firstName?: string;
  lastName?: string;
  username?: string;
}): Promise<boolean> {
  const pairing = await prisma.telegramPairingCode.findUnique({ where: { token: params.token } });
  if (!pairing || pairing.usedAt || pairing.expiresAt < new Date()) return false;

  await prisma.$transaction([
    prisma.telegramAccount.upsert({
      where: { telegramUserId: params.telegramUserId },
      create: {
        telegramUserId: params.telegramUserId,
        firstName: params.firstName,
        lastName: params.lastName,
        username: params.username,
        companyId: pairing.companyId,
        companyUserId: pairing.companyUserId,
        linkedAt: new Date(),
      },
      update: {
        companyId: pairing.companyId,
        companyUserId: pairing.companyUserId,
        linkedAt: new Date(),
        firstName: params.firstName,
        lastName: params.lastName,
        username: params.username,
      },
    }),
    prisma.telegramPairingCode.update({ where: { id: pairing.id }, data: { usedAt: new Date() } }),
  ]);

  const companyUser = await prisma.companyUser.findUniqueOrThrow({
    where: { id: pairing.companyUserId },
    include: { company: true },
  });

  await telegramBotClient.sendMessage(
    params.chatId,
    `✅ Telegram hesabınız "${companyUser.company.shortName ?? companyUser.company.name ?? "firmanız"}" için ` +
      `${companyUser.name} kullanıcısına bağlandı. Artık giriş yapabilir ve bildirim alabilirsiniz.\n\n` +
      "Aşağıdaki menüden hızlıca işlem yapabilirsiniz.",
    { replyMarkup: getMainMenuKeyboard() },
  );

  return true;
}
