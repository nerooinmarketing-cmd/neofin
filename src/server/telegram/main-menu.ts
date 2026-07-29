import { prisma } from "@/lib/prisma";
import { telegramBotClient, type InlineKeyboardMarkup, type ReplyKeyboardMarkup } from "./bot-client";

/**
 * Telegram botunun 4 sabit menü butonu — kullanıcı isteği üzerine 21
 * aşamalık planın dışında eklendi (bkz. `AGENTS.md` "Ek özellik" bölümü).
 *
 * "POS Bilgi Formu" **düz metin** bir buton — Telegram'ın belgelenmiş
 * davranışı gereği bir `ReplyKeyboardMarkup` (kalıcı alt menü) butonuna
 * `web_app` eklenirse Mini App açılır ama `initData` HER ZAMAN boş gelir
 * (yalnızca `sendData` ile tek yönlü, kısıtlı veri dönebilir — bkz.
 * https://core.telegram.org/bots/webapps). initData/kimlik doğrulama
 * gerektiren bir Mini App için tek yol: bir **inline** klavye butonuna
 * `web_app` eklemek. Bu yüzden "POS Bilgi Formu" tıklanınca (metin mesajı
 * olarak webhook'a düşer) bot, gerçek Mini App'i açan tek satır inline
 * butonlu bir mesajla cevap verir (bkz. `sendPosInfoFormLauncher`).
 */
export const MAIN_MENU_LABELS = {
  posInfoForm: "📄 POS Bilgi Formu",
  newPos: "➕ Yeni POS",
  reports: "📊 Raporlar",
  gunSonu: "💰 Gün Sonu Gir",
} as const;

export function getMainMenuKeyboard(): ReplyKeyboardMarkup {
  return {
    keyboard: [
      [{ text: MAIN_MENU_LABELS.posInfoForm }, { text: MAIN_MENU_LABELS.newPos }],
      [{ text: MAIN_MENU_LABELS.reports }, { text: MAIN_MENU_LABELS.gunSonu }],
    ],
    resize_keyboard: true,
    is_persistent: true,
  };
}

/**
 * `/menu` komutu ve bare `/start` için: menü yalnızca eşleştirme anında
 * (`pairing-service.ts`) bir kere gönderildiğinden, o tarihten önce
 * eşleşmiş hesaplar hiç görmemiş olabilir — bu, menüyü istenildiği zaman
 * yeniden göndermenin tek yolu.
 */
export async function sendMainMenu(params: { telegramUserId: bigint; chatId: number }) {
  const account = await prisma.telegramAccount.findUnique({ where: { telegramUserId: params.telegramUserId } });

  if (!account?.companyUserId) {
    await telegramBotClient.sendMessage(
      params.chatId,
      "Bu hesap henüz bir firma ile eşleştirilmemiş. Panelden veya yöneticinizden bir eşleştirme kodu isteyin.",
    );
    return;
  }

  await telegramBotClient.sendMessage(params.chatId, "Ana menü:", { replyMarkup: getMainMenuKeyboard() });
}

/** "📄 POS Bilgi Formu" metin butonuna basılınca: gerçek initData'lı Mini App'i açan inline buton. */
export async function sendPosInfoFormLauncher(params: { telegramUserId: bigint; chatId: number }) {
  const account = await prisma.telegramAccount.findUnique({ where: { telegramUserId: params.telegramUserId } });

  if (!account?.companyUserId) {
    await telegramBotClient.sendMessage(
      params.chatId,
      "Bu hesap henüz bir firma ile eşleştirilmemiş. Panelden veya yöneticinizden bir eşleştirme kodu isteyin.",
    );
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [{ text: "🔓 Formu Aç", web_app: { url: `${appUrl}/telegram-app/pos-bilgi-formu?v=${Date.now()}` } }],
    ],
  };
  await telegramBotClient.sendMessage(
    params.chatId,
    "POS Bilgi Formunu açmak için aşağıdaki butona basın:",
    { replyMarkup: keyboard },
  );
}
