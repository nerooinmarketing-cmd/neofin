import type { NotificationStatus, NotificationType } from "@/generated/prisma/enums";
import type { StatusTone } from "@/components/shared/status-badge";

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  PAYMENT_DUE_TOMORROW: "Yarın beklenen ödeme",
  PAYMENT_DUE_TODAY: "Bugün ödeme bekleniyor",
  PAYMENT_DELAYED: "Ödeme gecikti",
  PAYMENT_BELOW_EXPECTED: "Beklenenden düşük ödeme",
  TARIFF_EXPIRING: "Tarife bitişi",
  CAMPAIGN_EXPIRING: "Kampanya bitişi",
  VOLUME_COMMITMENT_RISK: "Ciro taahhüdü riski",
  MONTHLY_REPORT_READY: "Aylık rapor hazır",
  NEW_DEVICE_LOGIN: "Yeni cihazdan giriş onayı",
  CRITICAL_SETTING_CHANGE: "Kritik ayar değişikliği",
  MISSING_DATA_WARNING: "Eksik veri uyarısı",
};

export function notificationStatusLabel(status: NotificationStatus): { label: string; tone: StatusTone } {
  switch (status) {
    case "PENDING":
      return { label: "Bekliyor", tone: "info" };
    case "SENT":
      return { label: "Gönderildi", tone: "success" };
    case "FAILED":
      return { label: "Başarısız", tone: "danger" };
    case "READ":
      return { label: "Okundu", tone: "neutral" };
  }
}
