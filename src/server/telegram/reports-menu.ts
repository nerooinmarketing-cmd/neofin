import { prisma } from "@/lib/prisma";
import { telegramBotClient, type InlineKeyboardMarkup } from "@/server/telegram/bot-client";
import { renderTenantReportToPdf } from "@/server/reports/pdf";

/**
 * Telegram menüsündeki "📊 Raporlar" butonu — web'deki `/panel/raporlar`
 * sayfasındaki 7 raporun aynısını başlık+açıklamalarıyla listeler.
 * Seçilen rapor gerçek PDF olarak üretilip (`renderTenantReportToPdf`)
 * `sendDocument` ile gönderilir.
 */
const REPORTS: { code: string; title: string; description: string; path: string }[] = [
  {
    code: "gunluk",
    title: "Günlük Özet",
    description: "Seçilen güne ait ciro, kesinti ve banka/POS bazlı dağılım.",
    path: "/panel/raporlar/gunluk",
  },
  {
    code: "aylik",
    title: "Aylık Maliyet",
    description: "Bu ayın toplam kesintisi, geçen aya göre değişim ve banka dağılımı.",
    path: "/panel/raporlar/aylik",
  },
  {
    code: "banka",
    title: "Banka Karşılaştırma",
    description: "Ciro, ortalama oran, kesinti, fark, valör ve sabit ücret — banka bazlı.",
    path: "/panel/raporlar/banka-karsilastirma",
  },
  {
    code: "pos",
    title: "POS Karşılaştırma",
    description: "En yüksek/düşük maliyetli POS, en fazla fark görülen POS.",
    path: "/panel/raporlar/pos-karsilastirma",
  },
  {
    code: "fark",
    title: "Fark Raporu",
    description: "Dönem içindeki tüm beklenen/gerçekleşen ödeme farkları.",
    path: "/panel/raporlar/fark-raporu",
  },
  {
    code: "yillik",
    title: "Yıllık Maliyet ve Pazarlık Raporu",
    description: "Son 12 ay özeti, banka/POS analizi, gelecek yıl tahmini ve pazarlık önerileri.",
    path: "/panel/raporlar/yillik-pazarlik",
  },
  {
    code: "sozlesme",
    title: "Sözleşme Analiz Özeti",
    description: "Analiz edilmiş tüm sözleşmelerin güven skoru ve kritik madde özeti.",
    path: "/panel/raporlar/sozlesme-ozeti",
  },
];

async function resolveCompanyUserId(telegramUserId: bigint): Promise<string | null> {
  const account = await prisma.telegramAccount.findUnique({ where: { telegramUserId } });
  if (!account?.companyId || !account.companyUserId) return null;
  return account.companyUserId;
}

export async function sendReportsMenu(params: { telegramUserId: bigint; chatId: number }) {
  const companyUserId = await resolveCompanyUserId(params.telegramUserId);
  if (!companyUserId) {
    await telegramBotClient.sendMessage(
      params.chatId,
      "Hesabınız bir firmaya bağlı değil. Önce panelden giriş yapın.",
    );
    return;
  }

  const lines = ["📊 Raporlar", ""];
  for (const report of REPORTS) lines.push(`• ${report.title} — ${report.description}`);
  lines.push("", "PDF olarak almak istediğiniz raporu seçin:");

  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: REPORTS.map((report) => [{ text: report.title, callback_data: `report:${report.code}` }]),
  };
  await telegramBotClient.sendMessage(params.chatId, lines.join("\n"), { replyMarkup: keyboard });
}

/**
 * Telegram'ın "answerCallbackQuery" ile onaylanması gereken bir süresi
 * vardır (~birkaç saniye); süre geçmişse veya id zaten geçersizse API
 * hata döner. Bu yalnızca butonun üstündeki "yükleniyor" göstergesini
 * kapatır — asıl işin (PDF üretimi/gönderimi) bu yüzden iptal olmamalı.
 */
async function ackCallback(callbackQueryId: string, opts?: { text?: string; showAlert?: boolean }) {
  try {
    await telegramBotClient.answerCallbackQuery(callbackQueryId, opts);
  } catch (error) {
    console.warn("[telegram reports] answerCallbackQuery başarısız (yok sayıldı):", error);
  }
}

export async function handleReportRequest(params: {
  telegramUserId: bigint;
  chatId: number;
  callbackQueryId: string;
  reportCode: string;
}) {
  const companyUserId = await resolveCompanyUserId(params.telegramUserId);
  if (!companyUserId) {
    await ackCallback(params.callbackQueryId, { text: "Hesabınız bir firmaya bağlı değil.", showAlert: true });
    return;
  }

  const report = REPORTS.find((r) => r.code === params.reportCode);
  if (!report) {
    await ackCallback(params.callbackQueryId, { text: "Rapor bulunamadı.", showAlert: true });
    return;
  }

  await ackCallback(params.callbackQueryId, { text: "Hazırlanıyor..." });
  await telegramBotClient.sendMessage(
    params.chatId,
    `⏳ "${report.title}" PDF olarak hazırlanıyor, birkaç saniye sürebilir...`,
  );

  try {
    const pdfBuffer = await renderTenantReportToPdf({ companyUserId, path: report.path });
    await telegramBotClient.sendDocument(params.chatId, {
      filename: `${report.code}-raporu.pdf`,
      buffer: pdfBuffer,
      caption: report.title,
    });
  } catch (error) {
    console.error("[telegram reports]", error);
    await telegramBotClient.sendMessage(
      params.chatId,
      "Rapor oluşturulurken bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
    );
  }
}
