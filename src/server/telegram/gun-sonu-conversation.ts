import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { TenantContext } from "@/server/tenant-context";
import { telegramBotClient, type InlineKeyboardMarkup } from "@/server/telegram/bot-client";
import { posDeviceRepository } from "@/server/repositories/pos-device-repository";
import { dailySaleRepository } from "@/server/repositories/daily-sale-repository";
import { MissingTariffError } from "@/lib/tariff-engine";
import { formatCurrency, formatDate } from "@/lib/format";

/**
 * Telegram'dan `/gunsonu` komutuyla başlayan adım adım sohbet akışı — web
 * formundaki (`gun-sonu-form.tsx`) tek çekim/taksitli/taksit sayısı akışının
 * basitleştirilmiş bir eşdeğeridir. Aynı `dailySaleRepository.create()`
 * fonksiyonunu çağırır, bu yüzden hesaplama/kayıt mantığı iki kanalda da
 * (web ve Telegram) birebir aynıdır. Bu özellik 21 aşamalık planın dışında,
 * kullanıcı isteği üzerine eklendi.
 */
const FLOW = "GUN_SONU";

interface FlowData {
  posId?: string;
  posLabel?: string;
  saleDate?: string;
  singleAmount?: number;
  installmentAmount?: number;
  installmentCount?: number;
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

/** "10000", "10.000", "10000,50" gibi Türkçe biçimli tutarları ayrıştırır. */
function parseTlNumber(text: string): number | null {
  const cleaned = text.trim().replace(/\./g, "").replace(",", ".");
  if (cleaned.length === 0) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
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
  const lines = [`📋 Özet — ${data.posLabel}`, formatDate(new Date(data.saleDate!))];
  if (data.singleAmount) lines.push(`Tek çekim: ${formatCurrency(data.singleAmount)}`);
  if (data.installmentAmount) {
    lines.push(`${data.installmentCount} taksit: ${formatCurrency(data.installmentAmount)}`);
  }
  if (!data.singleAmount && !data.installmentAmount) lines.push("(Girilen tutar yok)");
  lines.push("", "Kaydetmek istiyor musunuz?");

  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: "✅ Onayla", callback_data: "gunsonuconfirm" },
        { text: "❌ İptal", callback_data: "gunsonucancel" },
      ],
    ],
  };
  await telegramBotClient.sendMessage(chatId, lines.join("\n"), { replyMarkup: keyboard });
}

export async function startGunSonuFlow(params: { telegramUserId: bigint; chatId: number }) {
  const resolved = await resolveTenant(params.telegramUserId);
  if (!resolved) {
    await telegramBotClient.sendMessage(
      params.chatId,
      "Hesabınız bir firmaya bağlı değil. Önce panelden giriş yapın.",
    );
    return;
  }
  const { ctx, telegramAccountId } = resolved;

  const posDevices = await posDeviceRepository.listActive(ctx);
  if (posDevices.length === 0) {
    await telegramBotClient.sendMessage(params.chatId, "Kayıtlı POS bulunamadı. Önce panelden POS ekleyin.");
    return;
  }

  await setState(telegramAccountId, "AWAIT_POS", { saleDate: new Date().toISOString() });

  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: posDevices.map((pos) => [
      { text: `${pos.name} · ${pos.bank.name}`, callback_data: `gunsonupos:${pos.id}` },
    ]),
  };
  await telegramBotClient.sendMessage(params.chatId, "Hangi POS için gün sonu girişi yapmak istersiniz?", {
    replyMarkup: keyboard,
  });
}

export async function handlePosSelection(params: {
  telegramUserId: bigint;
  chatId: number;
  callbackQueryId: string;
  messageId: number;
  posId: string;
}) {
  const resolved = await resolveTenant(params.telegramUserId);
  if (!resolved) return;
  const { ctx, telegramAccountId } = resolved;

  const state = await prisma.telegramConversationState.findUnique({ where: { telegramAccountId } });
  if (!state || state.flow !== FLOW || state.step !== "AWAIT_POS") {
    await telegramBotClient.answerCallbackQuery(params.callbackQueryId, { text: "Bu işlem artık geçerli değil." });
    return;
  }

  const pos = await posDeviceRepository.getByIdOrThrow(ctx, params.posId).catch(() => null);
  if (!pos) {
    await telegramBotClient.answerCallbackQuery(params.callbackQueryId, { text: "POS bulunamadı.", showAlert: true });
    return;
  }

  const data = state.data as FlowData;
  data.posId = pos.id;
  data.posLabel = `${pos.name} · ${pos.bank.name}`;
  await setState(telegramAccountId, "AWAIT_SINGLE_AMOUNT", data);

  await telegramBotClient.answerCallbackQuery(params.callbackQueryId);
  await telegramBotClient.editMessageReplyMarkup(params.chatId, params.messageId, undefined);
  await telegramBotClient.sendMessage(params.chatId, "Tek çekim tutarı nedir? (TL olarak yazın, yoksa 0 gönderin)");
}

/** Aktif bir `/gunsonu` sohbeti yoksa `false` döner — webhook mesajı görmezden gelir. */
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

  if (state.step === "AWAIT_SINGLE_AMOUNT") {
    const value = parseTlNumber(params.text);
    if (value === null) {
      await telegramBotClient.sendMessage(params.chatId, "Geçerli bir sayı girin (örn. 10000 veya 0).");
      return true;
    }
    data.singleAmount = value;
    await setState(telegramAccountId, "AWAIT_INSTALLMENT_AMOUNT", data);
    await telegramBotClient.sendMessage(params.chatId, "Taksitli satış var mı? Tutarı yazın (yoksa 0):");
    return true;
  }

  if (state.step === "AWAIT_INSTALLMENT_AMOUNT") {
    const value = parseTlNumber(params.text);
    if (value === null) {
      await telegramBotClient.sendMessage(params.chatId, "Geçerli bir sayı girin (örn. 15000 veya 0).");
      return true;
    }
    data.installmentAmount = value;
    if (value > 0) {
      await setState(telegramAccountId, "AWAIT_INSTALLMENT_COUNT", data);
      await telegramBotClient.sendMessage(params.chatId, "Kaç taksit? (2-12)");
    } else {
      await setState(telegramAccountId, "AWAIT_CONFIRM", data);
      await sendConfirmation(params.chatId, data);
    }
    return true;
  }

  if (state.step === "AWAIT_INSTALLMENT_COUNT") {
    const count = Number(params.text.trim());
    if (!Number.isInteger(count) || count < 2 || count > 12) {
      await telegramBotClient.sendMessage(params.chatId, "2 ile 12 arasında bir taksit sayısı girin.");
      return true;
    }
    data.installmentCount = count;
    await setState(telegramAccountId, "AWAIT_CONFIRM", data);
    await sendConfirmation(params.chatId, data);
    return true;
  }

  return true; // AWAIT_CONFIRM — metin değil, buton bekleniyor.
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
    const pos = await posDeviceRepository.getByIdOrThrow(ctx, data.posId!);
    const lines = [
      ...(data.singleAmount ? [{ transactionType: "SINGLE" as const, amount: data.singleAmount, transactionCount: 1 }] : []),
      ...(data.installmentAmount
        ? [
            {
              transactionType: "INSTALLMENT" as const,
              amount: data.installmentAmount,
              installmentCount: data.installmentCount,
              transactionCount: 1,
            },
          ]
        : []),
    ];

    if (lines.length === 0) {
      await telegramBotClient.answerCallbackQuery(params.callbackQueryId, { text: "Girilen tutar yok." });
      await telegramBotClient.sendMessage(params.chatId, "Girilen bir tutar olmadığı için kaydedilmedi.");
      return;
    }

    const { summary } = await dailySaleRepository.create(ctx, {
      branchId: pos.branchId,
      bankId: pos.bankId,
      posId: pos.id,
      saleDate: new Date(data.saleDate!),
      lines,
    });

    await telegramBotClient.answerCallbackQuery(params.callbackQueryId, { text: "Kaydedildi." });
    await telegramBotClient.sendMessage(
      params.chatId,
      `✅ Kaydedildi.\nBeklenen net ödeme: ${formatCurrency(summary.expectedNetTotal.toNumber())}`,
    );
  } catch (error) {
    if (error instanceof MissingTariffError) {
      await telegramBotClient.answerCallbackQuery(params.callbackQueryId, { text: "Tarife bulunamadı.", showAlert: true });
      await telegramBotClient.sendMessage(
        params.chatId,
        "Bu POS için aktif tarife bulunamadı. Önce panelden tarife tanımlayın.",
      );
    } else {
      await telegramBotClient.answerCallbackQuery(params.callbackQueryId, { text: "Hata oluştu.", showAlert: true });
      await telegramBotClient.sendMessage(params.chatId, "Kayıt sırasında bir hata oluştu, lütfen tekrar deneyin.");
    }
  } finally {
    await clearState(telegramAccountId);
  }
}
