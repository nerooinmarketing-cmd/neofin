import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { TenantContext } from "@/server/tenant-context";
import type { PosType } from "@/generated/prisma/enums";
import { telegramBotClient, type InlineKeyboardMarkup } from "@/server/telegram/bot-client";
import { bankRepository } from "@/server/repositories/bank-repository";
import { posDeviceRepository } from "@/server/repositories/pos-device-repository";

/**
 * Telegram menüsündeki "➕ Yeni POS" butonuyla başlayan sohbet akışı —
 * web'deki basit POS ekleme formunun (`pos-create-form.tsx`) Telegram
 * eşdeğeri. Aynı `posDeviceRepository.create()` çağrılır; şube web'deki
 * gibi firmanın ilk şubesi otomatik seçilir (bkz. `/api/pos-devices`
 * route'undaki aynı basitleştirme). `gun-sonu-conversation.ts` ile aynı
 * `TelegramConversationState` deseni kullanılır.
 */
const FLOW = "YENI_POS";

const POS_TYPE_LABELS: Record<PosType, string> = {
  PHYSICAL: "Fiziksel",
  VIRTUAL: "Sanal",
  MOBILE: "Mobil",
  QR: "QR",
};

interface FlowData {
  bankId?: string;
  bankLabel?: string;
  posType?: PosType;
  posName?: string;
  terminalNo?: string;
  merchantNo?: string;
}

async function resolveTenant(
  telegramUserId: bigint,
): Promise<{ ctx: TenantContext; telegramAccountId: string } | null> {
  const account = await prisma.telegramAccount.findUnique({ where: { telegramUserId } });
  if (!account || !account.companyId || !account.companyUserId) return null;
  return {
    ctx: { companyId: account.companyId, companyUserId: account.companyUserId },
    telegramAccountId: account.id,
  };
}

async function setState(telegramAccountId: string, step: string, data: FlowData) {
  await prisma.telegramConversationState.upsert({
    where: { telegramAccountId },
    create: { telegramAccountId, flow: FLOW, step, data: data as unknown as Prisma.InputJsonValue },
    update: { flow: FLOW, step, data: data as unknown as Prisma.InputJsonValue },
  });
}

async function clearState(telegramAccountId: string) {
  await prisma.telegramConversationState.deleteMany({ where: { telegramAccountId } });
}

async function sendConfirmation(chatId: number, data: FlowData) {
  const lines = [
    "📋 Yeni POS özeti",
    `Banka: ${data.bankLabel}`,
    `Tür: ${POS_TYPE_LABELS[data.posType!]}`,
    `POS adı: ${data.posName}`,
    `Terminal no: ${data.terminalNo}`,
    `Üye işyeri no: ${data.merchantNo}`,
    "",
    "Kaydetmek istiyor musunuz?",
  ];

  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: "✅ Onayla", callback_data: "yenipsconfirm" },
        { text: "❌ İptal", callback_data: "yenipscancel" },
      ],
    ],
  };
  await telegramBotClient.sendMessage(chatId, lines.join("\n"), { replyMarkup: keyboard });
}

export async function startYeniPosFlow(params: { telegramUserId: bigint; chatId: number }) {
  const resolved = await resolveTenant(params.telegramUserId);
  if (!resolved) {
    await telegramBotClient.sendMessage(
      params.chatId,
      "Hesabınız bir firmaya bağlı değil. Önce panelden giriş yapın.",
    );
    return;
  }
  const { ctx, telegramAccountId } = resolved;

  const banks = await bankRepository.listActive(ctx);
  if (banks.length === 0) {
    await telegramBotClient.sendMessage(params.chatId, "Kayıtlı banka bulunamadı. Önce panelden bir banka ekleyin.");
    return;
  }

  await setState(telegramAccountId, "AWAIT_BANK", {});

  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: banks.map((bank) => [{ text: bank.name, callback_data: `yenipsbank:${bank.id}` }]),
  };
  await telegramBotClient.sendMessage(params.chatId, "Yeni POS hangi bankaya bağlı olacak?", {
    replyMarkup: keyboard,
  });
}

export async function handleBankSelection(params: {
  telegramUserId: bigint;
  chatId: number;
  callbackQueryId: string;
  messageId: number;
  bankId: string;
}) {
  const resolved = await resolveTenant(params.telegramUserId);
  if (!resolved) return;
  const { ctx, telegramAccountId } = resolved;

  const state = await prisma.telegramConversationState.findUnique({ where: { telegramAccountId } });
  if (!state || state.flow !== FLOW || state.step !== "AWAIT_BANK") {
    await telegramBotClient.answerCallbackQuery(params.callbackQueryId, { text: "Bu işlem artık geçerli değil." });
    return;
  }

  const bank = await bankRepository.getByIdOrThrow(ctx, params.bankId).catch(() => null);
  if (!bank) {
    await telegramBotClient.answerCallbackQuery(params.callbackQueryId, { text: "Banka bulunamadı.", showAlert: true });
    return;
  }

  const data: FlowData = { bankId: bank.id, bankLabel: bank.name };
  await setState(telegramAccountId, "AWAIT_TYPE", data);

  await telegramBotClient.answerCallbackQuery(params.callbackQueryId);
  await telegramBotClient.editMessageReplyMarkup(params.chatId, params.messageId, undefined);

  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      (Object.entries(POS_TYPE_LABELS) as [PosType, string][]).map(([value, label]) => ({
        text: label,
        callback_data: `yenipstype:${value}`,
      })),
    ],
  };
  await telegramBotClient.sendMessage(params.chatId, "POS türü nedir?", { replyMarkup: keyboard });
}

export async function handleTypeSelection(params: {
  telegramUserId: bigint;
  chatId: number;
  callbackQueryId: string;
  messageId: number;
  posType: string;
}) {
  const resolved = await resolveTenant(params.telegramUserId);
  if (!resolved) return;
  const { telegramAccountId } = resolved;

  const state = await prisma.telegramConversationState.findUnique({ where: { telegramAccountId } });
  if (!state || state.flow !== FLOW || state.step !== "AWAIT_TYPE") {
    await telegramBotClient.answerCallbackQuery(params.callbackQueryId, { text: "Bu işlem artık geçerli değil." });
    return;
  }
  if (!(params.posType in POS_TYPE_LABELS)) {
    await telegramBotClient.answerCallbackQuery(params.callbackQueryId, { text: "Geçersiz tür.", showAlert: true });
    return;
  }

  const data = state.data as FlowData;
  data.posType = params.posType as PosType;
  await setState(telegramAccountId, "AWAIT_NAME", data);

  await telegramBotClient.answerCallbackQuery(params.callbackQueryId);
  await telegramBotClient.editMessageReplyMarkup(params.chatId, params.messageId, undefined);
  await telegramBotClient.sendMessage(params.chatId, "POS adı nedir? (örn. POS-02 · Şube)");
}

/** Aktif bir "Yeni POS" sohbeti yoksa `false` döner. */
export async function handleTextReply(params: {
  telegramUserId: bigint;
  chatId: number;
  text: string;
}): Promise<boolean> {
  const resolved = await resolveTenant(params.telegramUserId);
  if (!resolved) return false;
  const { telegramAccountId } = resolved;

  const state = await prisma.telegramConversationState.findUnique({ where: { telegramAccountId } });
  if (!state || state.flow !== FLOW) return false;

  const data = state.data as FlowData;
  const text = params.text.trim();

  if (state.step === "AWAIT_NAME") {
    if (text.length === 0) {
      await telegramBotClient.sendMessage(params.chatId, "Lütfen bir POS adı girin.");
      return true;
    }
    data.posName = text;
    await setState(telegramAccountId, "AWAIT_TERMINAL", data);
    await telegramBotClient.sendMessage(params.chatId, "Terminal numarası nedir?");
    return true;
  }

  if (state.step === "AWAIT_TERMINAL") {
    if (text.length === 0) {
      await telegramBotClient.sendMessage(params.chatId, "Lütfen bir terminal numarası girin.");
      return true;
    }
    data.terminalNo = text;
    await setState(telegramAccountId, "AWAIT_MERCHANT", data);
    await telegramBotClient.sendMessage(params.chatId, "Üye işyeri numarası nedir?");
    return true;
  }

  if (state.step === "AWAIT_MERCHANT") {
    if (text.length === 0) {
      await telegramBotClient.sendMessage(params.chatId, "Lütfen bir üye işyeri numarası girin.");
      return true;
    }
    data.merchantNo = text;
    await setState(telegramAccountId, "AWAIT_CONFIRM", data);
    await sendConfirmation(params.chatId, data);
    return true;
  }

  return true; // AWAIT_BANK / AWAIT_TYPE / AWAIT_CONFIRM — metin değil, buton bekleniyor.
}

export async function handleConfirm(params: {
  telegramUserId: bigint;
  chatId: number;
  callbackQueryId: string;
  messageId: number;
  confirmed: boolean;
}) {
  const resolved = await resolveTenant(params.telegramUserId);
  if (!resolved) return;
  const { ctx, telegramAccountId } = resolved;

  const state = await prisma.telegramConversationState.findUnique({ where: { telegramAccountId } });
  if (!state || state.flow !== FLOW || state.step !== "AWAIT_CONFIRM") {
    await telegramBotClient.answerCallbackQuery(params.callbackQueryId, { text: "Bu işlem artık geçerli değil." });
    return;
  }

  await telegramBotClient.editMessageReplyMarkup(params.chatId, params.messageId, undefined);

  if (!params.confirmed) {
    await clearState(telegramAccountId);
    await telegramBotClient.answerCallbackQuery(params.callbackQueryId, { text: "İptal edildi." });
    await telegramBotClient.sendMessage(params.chatId, "İşlem iptal edildi.");
    return;
  }

  const data = state.data as FlowData;

  try {
    const branch = await prisma.branch.findFirst({ where: { companyId: ctx.companyId } });
    if (!branch) {
      await telegramBotClient.answerCallbackQuery(params.callbackQueryId, { text: "Şube bulunamadı.", showAlert: true });
      await telegramBotClient.sendMessage(params.chatId, "Firma için henüz bir şube bulunmuyor. Önce panelden kurulumu tamamlayın.");
      return;
    }

    const pos = await posDeviceRepository.create(ctx, {
      branchId: branch.id,
      bankId: data.bankId!,
      name: data.posName!,
      terminalNo: data.terminalNo!,
      merchantNo: data.merchantNo!,
      type: data.posType!,
    });

    await telegramBotClient.answerCallbackQuery(params.callbackQueryId, { text: "Kaydedildi." });
    await telegramBotClient.sendMessage(params.chatId, `✅ "${pos.name}" POS'u kaydedildi.`);
  } catch {
    await telegramBotClient.answerCallbackQuery(params.callbackQueryId, { text: "Hata oluştu.", showAlert: true });
    await telegramBotClient.sendMessage(params.chatId, "Kayıt sırasında bir hata oluştu, lütfen tekrar deneyin.");
  } finally {
    await clearState(telegramAccountId);
  }
}
