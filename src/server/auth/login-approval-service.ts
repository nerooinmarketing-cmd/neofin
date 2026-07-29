import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { telegramBotClient, type InlineKeyboardMarkup } from "@/server/telegram/bot-client";
import { formatDate } from "@/lib/format";
import { normalizePhone } from "@/lib/phone";

const APPROVAL_TTL_MS = 5 * 60 * 1000; // 5 dakika — bkz. Aşama 3 §"Onay isteği 5 dakika sonra geçersiz olsun"

function generateToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

export interface CreateLoginRequestInput {
  phone: string;
  deviceInfo?: string;
  ipAddress?: string;
}

export type CreateLoginRequestResult =
  | { ok: true; token: string; expiresAt: Date }
  | { ok: false; error: "NOT_FOUND" | "NO_TELEGRAM" };

/**
 * GSM-ile-giriş: kullanıcı web'de yalnızca telefon numarasını girer.
 * Numara zaten Telegram'a bağlı bir `CompanyUser`e ait olduğu için (bkz.
 * `prisma/schema.prisma` `CompanyUser.phone @unique`), eski akıştaki
 * "Telegram'ı aç → /start'a bas" adımına gerek kalmadan onay mesajı
 * doğrudan kullanıcının zaten bağlı olan Telegram hesabına gönderilir.
 */
export async function createLoginRequestByPhone(
  input: CreateLoginRequestInput,
): Promise<CreateLoginRequestResult> {
  const normalizedPhone = normalizePhone(input.phone);

  const companyUser = await prisma.companyUser.findFirst({
    where: { phone: normalizedPhone, isActive: true, deletedAt: null },
    include: { company: true, telegramAccounts: true },
  });
  if (!companyUser) return { ok: false, error: "NOT_FOUND" };

  const telegramAccount = companyUser.telegramAccounts[0];
  if (!telegramAccount) return { ok: false, error: "NO_TELEGRAM" };

  const approval = await prisma.loginApproval.create({
    data: {
      token: generateToken(),
      purpose: "LOGIN",
      deviceInfo: input.deviceInfo,
      ipAddress: input.ipAddress,
      expiresAt: new Date(Date.now() + APPROVAL_TTL_MS),
      telegramAccountId: telegramAccount.id,
      companyId: companyUser.companyId,
    },
  });

  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: "✅ Onayla", callback_data: `approve:${approval.id}` },
        { text: "❌ Reddet", callback_data: `deny:${approval.id}` },
      ],
    ],
  };

  await telegramBotClient.sendMessage(
    telegramAccount.telegramUserId.toString(),
    [
      "Giriş isteği",
      `Firma: ${companyUser.company.shortName ?? companyUser.company.phone}`,
      `Cihaz: ${input.deviceInfo ?? "bilinmiyor"}`,
      `Tarih: ${formatDate(approval.requestedAt)}`,
      "",
      "Bu giriş size mi ait?",
    ].join("\n"),
    { replyMarkup: keyboard },
  );

  return { ok: true, token: approval.token, expiresAt: approval.expiresAt };
}

/** /login/waiting sayfasının kısa aralıklarla sorguladığı uç. */
export async function getApprovalStatus(token: string) {
  const approval = await prisma.loginApproval.findUnique({ where: { token } });
  if (!approval) return null;

  if (approval.status === "PENDING" && approval.expiresAt < new Date()) {
    return prisma.loginApproval.update({
      where: { id: approval.id },
      data: { status: "EXPIRED" },
    });
  }
  return approval;
}

/** Onayla/Reddet inline butonlarına basıldığında webhook'tan çağrılır. */
export async function handleTelegramCallback(params: {
  callbackQueryId: string;
  callbackData: string;
  telegramUserId: bigint;
  chatId: number;
  messageId: number;
}) {
  const [action, approvalId] = params.callbackData.split(":");
  if ((action !== "approve" && action !== "deny") || !approvalId) return;

  const approval = await prisma.loginApproval.findUnique({ where: { id: approvalId } });
  if (!approval) {
    await telegramBotClient.answerCallbackQuery(params.callbackQueryId, {
      text: "İstek bulunamadı.",
      showAlert: true,
    });
    return;
  }

  const telegramAccount = await prisma.telegramAccount.findUnique({
    where: { telegramUserId: params.telegramUserId },
  });
  if (!telegramAccount || approval.telegramAccountId !== telegramAccount.id) {
    await telegramBotClient.answerCallbackQuery(params.callbackQueryId, {
      text: "Bu istek size ait değil.",
      showAlert: true,
    });
    return;
  }

  // Replay koruması: yalnızca hâlâ PENDING olan ve süresi geçmemiş istekler işlenir.
  if (approval.status !== "PENDING" || approval.expiresAt < new Date()) {
    await telegramBotClient.answerCallbackQuery(params.callbackQueryId, {
      text: "Bu istek zaten işlendi veya süresi doldu.",
      showAlert: true,
    });
    return;
  }

  const newStatus = action === "approve" ? "APPROVED" : "DENIED";
  await prisma.loginApproval.update({
    where: { id: approval.id },
    data: { status: newStatus, respondedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      companyId: approval.companyId,
      actorType: "USER",
      action: `LOGIN_APPROVAL_${newStatus}`,
      entityType: "LoginApproval",
      entityId: approval.id,
    },
  });

  await telegramBotClient.editMessageReplyMarkup(params.chatId, params.messageId, undefined);
  await telegramBotClient.answerCallbackQuery(params.callbackQueryId, {
    text: action === "approve" ? "Onaylandı." : "Reddedildi.",
  });
  await telegramBotClient.sendMessage(
    params.chatId,
    action === "approve"
      ? "Giriş onaylandı. Web sayfanıza dönebilirsiniz."
      : "Giriş reddedildi. Bu siz değilseniz hesabınızı kontrol edin.",
  );
}
