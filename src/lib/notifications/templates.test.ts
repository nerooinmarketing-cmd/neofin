import { describe, expect, it } from "vitest";
import { buildNotificationContent } from "./templates";

describe("buildNotificationContent", () => {
  it("matches the product doc's §20 worked example for PAYMENT_DUE_TODAY", () => {
    const content = buildNotificationContent({
      type: "PAYMENT_DUE_TODAY",
      bankName: "Akbank",
      posName: "POS-01",
      amount: 33742.5,
    });

    expect(content.title).toBe("Ödeme Uyarısı");
    expect(content.body).toBe(
      "Akbank POS-01 için bugün 33.742,50 TL ödeme bekleniyor.\nHesabınıza geçen tutarı kaydetmek için dokunun.",
    );
  });

  it("builds a delayed payment message with business-day count", () => {
    const content = buildNotificationContent({
      type: "PAYMENT_DELAYED",
      bankName: "Yapı Kredi",
      posName: "POS-03",
      amount: 10000,
      delayDays: 2,
    });

    expect(content.title).toBe("Ödeme Gecikti");
    expect(content.body).toContain("2 iş günü gecikme");
  });

  it("builds a volume commitment risk message with both amounts", () => {
    const content = buildNotificationContent({
      type: "VOLUME_COMMITMENT_RISK",
      bankName: "Akbank",
      posName: "POS-01",
      currentAmount: 400000,
      targetAmount: 750000,
    });

    expect(content.body).toContain("400.000,00 TL");
    expect(content.body).toContain("750.000,00 TL");
  });
});
