import type { NotificationContext, NotificationContent } from "./types";

function formatTl(amount: number): string {
  return `${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
}

/**
 * Bildirim başlığı/gövdesini üretir — saf/deterministik, yapay zekâ
 * kullanılmaz. Doküman §20 örneğiyle birebir eşleşir (bkz. PAYMENT_DUE_TODAY).
 */
export function buildNotificationContent(context: NotificationContext): NotificationContent {
  switch (context.type) {
    case "PAYMENT_DUE_TOMORROW":
      return {
        title: "Ödeme Uyarısı",
        body:
          `${context.bankName} ${context.posName} için yarın ${formatTl(context.amount)} ödeme bekleniyor.\n` +
          "Hesabınıza geçtiğinde kaydetmeyi unutmayın.",
      };
    case "PAYMENT_DUE_TODAY":
      return {
        title: "Ödeme Uyarısı",
        body:
          `${context.bankName} ${context.posName} için bugün ${formatTl(context.amount)} ödeme bekleniyor.\n` +
          "Hesabınıza geçen tutarı kaydetmek için dokunun.",
      };
    case "PAYMENT_DELAYED":
      return {
        title: "Ödeme Gecikti",
        body:
          `${context.bankName} ${context.posName} için beklenen ${formatTl(context.amount)} tutarındaki ödeme ` +
          `henüz hesabınıza geçmedi (${context.delayDays} iş günü gecikme).`,
      };
    case "PAYMENT_BELOW_EXPECTED":
      return {
        title: "Beklenenden Düşük Ödeme",
        body:
          `${context.bankName} ${context.posName}: hesabınıza beklenenden ${formatTl(context.diffAmount)} ` +
          "daha az geçti. Kontrol edilmesi önerilir.",
      };
    case "TARIFF_EXPIRING":
      return {
        title: "Tarife Bitişi",
        body: `${context.bankName} ${context.posName} tarifesi ${context.expiryDateLabel} tarihinde sona eriyor.`,
      };
    case "CAMPAIGN_EXPIRING":
      return {
        title: "Kampanya Bitişi",
        body:
          `${context.bankName} ${context.posName} "${context.campaignName}" kampanyası ` +
          `${context.expiryDateLabel} tarihinde sona eriyor.`,
      };
    case "VOLUME_COMMITMENT_RISK":
      return {
        title: "Ciro Taahhüdü Riski",
        body:
          `${context.bankName} ${context.posName} için bu ay ciro taahhüdünün altında kalma riski var ` +
          `(şu ana kadar ${formatTl(context.currentAmount)} / hedef ${formatTl(context.targetAmount)}).`,
      };
    case "MONTHLY_REPORT_READY":
      return {
        title: "Aylık Rapor Hazır",
        body: `${context.monthLabel} ayı raporu hazır. Detayları görüntülemek için panele gidin.`,
      };
    case "NEW_DEVICE_LOGIN":
      return {
        title: "Yeni Cihazdan Giriş",
        body: `Hesabınıza yeni bir cihazdan giriş isteği geldi (${context.deviceInfo}). Bu size mi ait?`,
      };
    case "CRITICAL_SETTING_CHANGE":
      return {
        title: "Kritik Ayar Değişikliği",
        body: `${context.actorName}, ${context.description} değişikliğini yaptı.`,
      };
    case "MISSING_DATA_WARNING":
      return {
        title: "Eksik Veri Uyarısı",
        body: context.message,
      };
  }
}
