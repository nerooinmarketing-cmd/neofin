export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
  web_app?: { url: string };
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface KeyboardButton {
  text: string;
  /** Mini App açan buton (bkz. "📄 POS Bilgi Formu") — tıklanınca metin mesajı gönderilmez. */
  web_app?: { url: string };
}

/** Sohbetin altında kalıcı olarak görünen 4 sabit menü butonu (bkz. `getMainMenuKeyboard`). */
export interface ReplyKeyboardMarkup {
  keyboard: KeyboardButton[][];
  resize_keyboard: true;
  is_persistent: true;
}

const TELEGRAM_API_BASE = "https://api.telegram.org";

function getBotToken(): string | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  return token && token.length > 0 ? token : null;
}

async function callTelegramApi<T>(
  method: string,
  payload: Record<string, unknown>,
): Promise<T | null> {
  const token = getBotToken();
  if (!token) {
    // Yerel geliştirmede gerçek bot yoksa istekleri sessizce loglayıp devam et.
    console.warn(
      `[telegram] TELEGRAM_BOT_TOKEN tanımlı değil — ${method} çağrısı gönderilmedi:`,
      payload,
    );
    return null;
  }

  const response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as { ok: boolean; result?: T; description?: string };
  if (!body.ok) {
    throw new Error(`Telegram API hatası (${method}): ${body.description ?? "bilinmiyor"}`);
  }
  return body.result ?? null;
}

export interface SentMessage {
  message_id: number;
  chat: { id: number };
}

export const telegramBotClient = {
  isConfigured(): boolean {
    return getBotToken() !== null;
  },

  sendMessage(
    chatId: number | string,
    text: string,
    opts?: {
      replyMarkup?: InlineKeyboardMarkup | ReplyKeyboardMarkup;
      parseMode?: "HTML" | "MarkdownV2";
    },
  ) {
    return callTelegramApi<SentMessage>("sendMessage", {
      chat_id: chatId,
      text,
      parse_mode: opts?.parseMode,
      reply_markup: opts?.replyMarkup,
    });
  },

  answerCallbackQuery(callbackQueryId: string, opts?: { text?: string; showAlert?: boolean }) {
    return callTelegramApi<true>("answerCallbackQuery", {
      callback_query_id: callbackQueryId,
      text: opts?.text,
      show_alert: opts?.showAlert ?? false,
    });
  },

  editMessageReplyMarkup(
    chatId: number | string,
    messageId: number,
    replyMarkup: InlineKeyboardMarkup | undefined,
  ) {
    return callTelegramApi<SentMessage>("editMessageReplyMarkup", {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: replyMarkup,
    });
  },

  /** Rapor PDF'leri gibi ikili dosyaları gönderir (bkz. `src/server/reports/pdf.ts`). */
  async sendDocument(
    chatId: number | string,
    document: { filename: string; buffer: Buffer; caption?: string },
  ): Promise<SentMessage | null> {
    const token = getBotToken();
    if (!token) {
      console.warn(
        `[telegram] TELEGRAM_BOT_TOKEN tanımlı değil — sendDocument çağrısı gönderilmedi: ${document.filename}`,
      );
      return null;
    }

    const form = new FormData();
    form.set("chat_id", String(chatId));
    if (document.caption) form.set("caption", document.caption);
    form.set("document", new Blob([new Uint8Array(document.buffer)], { type: "application/pdf" }), document.filename);

    const response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendDocument`, {
      method: "POST",
      body: form,
    });

    const body = (await response.json()) as { ok: boolean; result?: SentMessage; description?: string };
    if (!body.ok) {
      throw new Error(`Telegram API hatası (sendDocument): ${body.description ?? "bilinmiyor"}`);
    }
    return body.result ?? null;
  },

  /** Ops aracı: production webhook URL'sini Telegram'a bir kere kaydetmek için. */
  setWebhook(url: string, secretToken: string) {
    return callTelegramApi<true>("setWebhook", {
      url,
      secret_token: secretToken,
    });
  },
};
