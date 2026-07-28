import { NextResponse, type NextRequest } from "next/server";
import {
  handleTelegramCallback,
  handleTelegramStart,
} from "@/server/auth/login-approval-service";
import { notificationService } from "@/server/notifications/notification-service";
import {
  startGunSonuFlow,
  handlePosSelection,
  handleTextReply,
  handleConfirm,
} from "@/server/telegram/gun-sonu-conversation";
import { tryConsumePairingCode } from "@/server/telegram/pairing-service";

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
        await handleTelegramStart({
          token,
          telegramUserId: BigInt(from.id),
          firstName: from.first_name,
          lastName: from.last_name,
          username: from.username,
          chatId: update.message.chat.id,
        });
      }
    } else if (update.message?.text === "/gunsonu" && update.message.from) {
      await startGunSonuFlow({
        telegramUserId: BigInt(update.message.from.id),
        chatId: update.message.chat.id,
      });
    } else if (update.message?.text && update.message.from) {
      // "/" ile başlamayan sıradan bir metin — aktif bir /gunsonu sohbeti varsa
      // yanıt olarak işlenir, yoksa sessizce yok sayılır.
      await handleTextReply({
        telegramUserId: BigInt(update.message.from.id),
        chatId: update.message.chat.id,
        text: update.message.text,
      });
    } else if (update.callback_query?.data && update.callback_query.message) {
      const [action, entityId] = update.callback_query.data.split(":");
      const telegramUserId = BigInt(update.callback_query.from.id);
      const chatId = update.callback_query.message.chat.id;
      const messageId = update.callback_query.message.message_id;

      if (action === "snooze" && entityId) {
        await notificationService.snooze(entityId, update.callback_query.id, chatId, messageId);
      } else if (action === "gunsonupos" && entityId) {
        await handlePosSelection({
          telegramUserId,
          chatId,
          callbackQueryId: update.callback_query.id,
          messageId,
          posId: entityId,
        });
      } else if (action === "gunsonuconfirm" || action === "gunsonucancel") {
        await handleConfirm({
          telegramUserId,
          chatId,
          callbackQueryId: update.callback_query.id,
          messageId,
          confirmed: action === "gunsonuconfirm",
        });
      } else {
        await handleTelegramCallback({
          callbackQueryId: update.callback_query.id,
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
