import { NextResponse, type NextRequest } from "next/server";
import { handleTelegramCallback } from "@/server/auth/login-approval-service";
import { notificationService } from "@/server/notifications/notification-service";
import {
  startGunSonuFlow,
  handlePosSelection as handleGunSonuPosSelection,
  handleTextReply as handleGunSonuTextReply,
  handleConfirm as handleGunSonuConfirm,
} from "@/server/telegram/gun-sonu-conversation";
import {
  startYeniPosFlow,
  handleBankSelection as handleYeniPosBankSelection,
  handleTypeSelection as handleYeniPosTypeSelection,
  handleTextReply as handleYeniPosTextReply,
  handleConfirm as handleYeniPosConfirm,
} from "@/server/telegram/yeni-pos-conversation";
import { sendReportsMenu, handleReportRequest } from "@/server/telegram/reports-menu";
import { MAIN_MENU_LABELS, sendMainMenu } from "@/server/telegram/main-menu";
import { tryConsumePairingCode } from "@/server/telegram/pairing-service";
import { telegramBotClient } from "@/server/telegram/bot-client";

interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

interface TelegramUpdate {
  message?: {
    text?: string;
    chat: { id: number };
    from?: TelegramUser;
  };
  callback_query?: {
    id: string;
    data?: string;
    from: TelegramUser;
    message?: { chat: { id: number }; message_id: number };
  };
}

/** Telegram, her isteğe bu başlığı ekler — bkz. setWebhook secret_token. */
function isValidWebhookRequest(request: NextRequest): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected) return false;
  return request.headers.get("x-telegram-bot-api-secret-token") === expected;
}

export async function POST(request: NextRequest) {
  if (!isValidWebhookRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const update = (await request.json().catch(() => null)) as TelegramUpdate | null;
  if (!update) {
    return NextResponse.json({ ok: true }); // Telegram'a her zaman 200 dön
  }

  try {
    if (update.message?.text?.startsWith("/start ") && update.message.from) {
      // "/start <token>" artık yalnızca eşleştirme kodları için kullanılır —
      // giriş (LOGIN) akışı GSM-ile-giriş'e taşındığından burada bir onay
      // isteği eşleştirmesi yapılmaz (bkz. `login-approval-service.ts`
      // `createLoginRequestByPhone`).
      const token = update.message.text.slice("/start ".length).trim();
      const from = update.message.from;
      const paired = await tryConsumePairingCode({
        token,
        telegramUserId: BigInt(from.id),
        chatId: update.message.chat.id,
        firstName: from.first_name,
        lastName: from.last_name,
        username: from.username,
      });
      if (!paired) {
        await telegramBotClient.sendMessage(
          update.message.chat.id,
          "Geçersiz veya süresi dolmuş bağlantı. Lütfen yöneticinizden yeni bir eşleştirme kodu isteyin.",
        );
      }
    } else if ((update.message?.text === "/start" || update.message?.text === "/menu") && update.message.from) {
      // Ana menü yalnızca eşleştirme anında bir kere gönderilir — bu komutlar
      // menüyü (ve içindeki "web_app" butonunu) istenildiği zaman
      // yeniden gösterir, örn. o tarihten önce eşleşmiş hesaplar için.
      await sendMainMenu({
        telegramUserId: BigInt(update.message.from.id),
        chatId: update.message.chat.id,
      });
    } else if (update.message?.text === MAIN_MENU_LABELS.gunSonu && update.message.from) {
      await startGunSonuFlow({
        telegramUserId: BigInt(update.message.from.id),
        chatId: update.message.chat.id,
      });
    } else if (update.message?.text === MAIN_MENU_LABELS.newPos && update.message.from) {
      await startYeniPosFlow({
        telegramUserId: BigInt(update.message.from.id),
        chatId: update.message.chat.id,
      });
    } else if (update.message?.text === MAIN_MENU_LABELS.reports && update.message.from) {
      await sendReportsMenu({
        telegramUserId: BigInt(update.message.from.id),
        chatId: update.message.chat.id,
      });
    } else if (update.message?.text === "/gunsonu" && update.message.from) {
      await startGunSonuFlow({
        telegramUserId: BigInt(update.message.from.id),
        chatId: update.message.chat.id,
      });
    } else if (update.message?.text && update.message.from) {
      // "/" ile başlamayan sıradan bir metin — aktif bir sohbet (gün sonu veya
      // yeni POS) varsa yanıt olarak işlenir, yoksa sessizce yok sayılır.
      const params = {
        telegramUserId: BigInt(update.message.from.id),
        chatId: update.message.chat.id,
        text: update.message.text,
      };
      const handled = await handleGunSonuTextReply(params);
      if (!handled) await handleYeniPosTextReply(params);
    } else if (update.callback_query?.data && update.callback_query.message) {
      const [action, entityId] = update.callback_query.data.split(":");
      const telegramUserId = BigInt(update.callback_query.from.id);
      const chatId = update.callback_query.message.chat.id;
      const messageId = update.callback_query.message.message_id;
      const callbackQueryId = update.callback_query.id;

      if (action === "snooze" && entityId) {
        await notificationService.snooze(entityId, callbackQueryId, chatId, messageId);
      } else if (action === "gunsonupos" && entityId) {
        await handleGunSonuPosSelection({ telegramUserId, chatId, callbackQueryId, messageId, posId: entityId });
      } else if (action === "gunsonuconfirm" || action === "gunsonucancel") {
        await handleGunSonuConfirm({
          telegramUserId,
          chatId,
          callbackQueryId,
          messageId,
          confirmed: action === "gunsonuconfirm",
        });
      } else if (action === "yenipsbank" && entityId) {
        await handleYeniPosBankSelection({ telegramUserId, chatId, callbackQueryId, messageId, bankId: entityId });
      } else if (action === "yenipstype" && entityId) {
        await handleYeniPosTypeSelection({ telegramUserId, chatId, callbackQueryId, messageId, posType: entityId });
      } else if (action === "yenipsconfirm" || action === "yenipscancel") {
        await handleYeniPosConfirm({
          telegramUserId,
          chatId,
          callbackQueryId,
          messageId,
          confirmed: action === "yenipsconfirm",
        });
      } else if (action === "report" && entityId) {
        await handleReportRequest({ telegramUserId, chatId, callbackQueryId, reportCode: entityId });
      } else {
        await handleTelegramCallback({
          callbackQueryId,
          callbackData: update.callback_query.data,
          telegramUserId,
          chatId,
          messageId,
        });
      }
    }
  } catch (error) {
    console.error("[telegram webhook]", error);
  }

  return NextResponse.json({ ok: true });
}
