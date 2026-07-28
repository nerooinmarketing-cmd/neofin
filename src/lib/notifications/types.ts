export type NotificationContext =
  | { type: "PAYMENT_DUE_TOMORROW"; bankName: string; posName: string; amount: number }
  | { type: "PAYMENT_DUE_TODAY"; bankName: string; posName: string; amount: number }
  | { type: "PAYMENT_DELAYED"; bankName: string; posName: string; amount: number; delayDays: number }
  | { type: "PAYMENT_BELOW_EXPECTED"; bankName: string; posName: string; diffAmount: number }
  | { type: "TARIFF_EXPIRING"; bankName: string; posName: string; expiryDateLabel: string }
  | {
      type: "CAMPAIGN_EXPIRING";
      bankName: string;
      posName: string;
      campaignName: string;
      expiryDateLabel: string;
    }
  | {
      type: "VOLUME_COMMITMENT_RISK";
      bankName: string;
      posName: string;
      currentAmount: number;
      targetAmount: number;
    }
  | { type: "MONTHLY_REPORT_READY"; monthLabel: string }
  | { type: "NEW_DEVICE_LOGIN"; deviceInfo: string }
  | { type: "CRITICAL_SETTING_CHANGE"; actorName: string; description: string }
  | { type: "MISSING_DATA_WARNING"; message: string };

export interface NotificationContent {
  title: string;
  body: string;
}
