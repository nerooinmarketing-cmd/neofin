import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { telegramBotClient, type InlineKeyboardMarkup } from "@/server/telegram/bot-client";
import { formatDate } from "@/lib/format";

const APPROVAL_TTL_MS = 5 * 60 * 1000; // 5 dakika — bkz. Aşama 3 §"Onay isteği 5 dakika sonra geçersiz olsun"

function generateToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

export interface CreateLoginRequestInput {
  deviceInfo?: string;
  ipAddress?: string;
  purpose?: string; // "LOGIN" | "TARIFF_DELETE" | "USER_ADD" ...
}

export async function createLoginRequest(input: CreateLoginRequestInput) {
  const approval = await prisma.loginApproval.create({
    data: {
      token: generateToken(),
      purpose: input.purpose ?? "LOGIN",
      deviceInfo: input.deviceInfo,
      ipAddress: input.ipAddress,
      expiresAt: new Date(Date.now() + APPROVAL_TTL_MS),
    },
  });

  const botUsername = process.env.TELEGRAM_BOT_USERNAME;
  const telegramDeepLink = botUsername
    ? `https://t.me/${botUsername}?start=${approval.token}`
    : null;

  return { token: approval.token, expiresAt: approval.expiresAt, telegramDeepLink };
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

/**
 * Kullanıcı Telegram botuna `/start <token>` gönderdiğinde webhook'tan
 * çağrılır. Telegram hesabı ilk kez görülüyorsa kaydı oluşturulur; bir firma
 * kullanıcısıyla eşleşmiyorsa istek NOT_LINKED olarak işaretlenir ve panel
 * açılmaz (bkz. UX dokümanı §4.2).
 */
export async function handleTelegramStart(params: {
  token: string;
  telegramUserId: bigint;
  firstName?: string;
  lastName?: string;
  username?: string;
  chatId: number;
}) {
  const telegramAccount = await prisma.telegramAccount.upsert({
    where: { telegramUserId: params.telegramUserId },
    update: {
      firstName: params.firstName,
      lastName: params.lastName,
      username: params.username,
    },
    create: {
      telegramUserId: params.telegramUserId,
      firstName: params.firstName,
      lastName: params.lastName,
      username: params.username,
    },
  });

  const approval = await getApprovalStatus(params.token);
  if (!approval || approval.status !== "PENDING") {
    await telegramBotClient.sendMessage(
      params.chatId,
      "Bu giriş bağlantısı artık geçerli değil. Lütfen web sayfasından yeniden deneyin.",
    );
    return;
  }

  if (!telegramAccount.companyUserId) {
    await prisma.loginApproval.update({
      where: { id: approval.id },
      data: {
        status: "NOT_LINKED",
        telegramAccountId: telegramAccount.id,
        respondedAt: new Date(),
      },
    });
    await telegramBotClient.sendMessage(
      params.chatId,
      "Bu hesap henüz bir firma ile eşleştirilmemiş. Web sayfasında devam etmek için yöneticinizden eşleştirme kodu isteyin.",
    );
    return;
  }

  const companyUser = await prisma.companyUser.findUniqueOrThrow({
    where: { id: telegramAccount.companyUserId },
    include: { company: true },
  });

  await prisma.loginApproval.update({
    where: { id: approval.id },
    data: { telegramAccountId: telegramAccount.id, companyId: companyUser.companyId },
  });

  const purposeLabel = approval.purpose === "LOGIN" ? "Giriş" : approval.purpose;
  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: "✅ Onayla", callback_data: `approve:${approval.id}` },
        { text: "❌ Reddet", callback_data: `deny:${approval.id}` },
      ],
    ],
  };

  await telegramBotClient.sendMessage(
    params.chatId,
    [
      `${purposeLabel} isteği`,
      `Firma: ${companyUser.company.shortName ?? companyUser.company.phone}`,
      `Cihaz: ${approval.deviceInfo ?? "bilinmiyor"}`,
      `Tarih: ${formatDate(approval.requestedAt)}`,
      "",
      "Bu giriş size mi ait?",
    ].join("\n"),
    { replyMarkup: keyboard },
  );
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
