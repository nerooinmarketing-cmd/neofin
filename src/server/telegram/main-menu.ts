import { prisma } from "@/lib/prisma";
import { telegramBotClient, type ReplyKeyboardMarkup } from "./bot-client";

/**
 * Telegram botunun 4 sabit menü butonu — kullanıcı isteği üzerine 21
 * aşamalık planın dışında eklendi (bkz. `AGENTS.md` "Ek özellik" bölümü).
 * "POS Bilgi Formu" bir Mini App (`web_app`) açar ve tıklanınca hiçbir metin
 * mesajı göndermez; diğer 3'ü normal metin mesajı olarak gelir ve webhook bu
 * tam metinlerle eşleştirir (bkz. `MAIN_MENU_LABELS`).
 */
export const MAIN_MENU_LABELS = {
  posInfoForm: "📄 POS Bilgi Formu",
  newPos: "➕ Yeni POS",
  reports: "📊 Raporlar",
  gunSonu: "💰 Gün Sonu Gir",
} as const;

export function getMainMenuKeyboard(): ReplyKeyboardMarkup {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return {
    keyboard: [
      [
        { text: MAIN_MENU_LABELS.posInfoForm, web_app: { url: `${appUrl}/telegram-app/pos-bilgi-formu` } },
        { text: MAIN_MENU_LABELS.newPos },
      ],
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
