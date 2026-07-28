import { describe, expect, it } from "vitest";
import { buildSmartSummary } from "./smart-summary";

describe("buildSmartSummary", () => {
  it("matches the product doc's worked example", () => {
    const text = buildSmartSummary({
      monthlyGross: 1245000,
      monthlyExpectedDeduction: 31420,
      monthlyActualDeduction: 33870,
      differenceCount: 3,
      differenceTotalAbs: 2450,
    });

    expect(text).toBe(
      "Bu ay toplam 1.245.000,00 TL POS satışı yaptınız. " +
        "Kayıtlı tarifelere göre 31.420,00 TL kesinti bekleniyordu. " +
        "Gerçekleşen toplam kesinti 33.870,00 TL oldu. " +
        "2.450,00 TL fark kontrol edilmeli.",
    );
  });

  it("returns a no-sales message when nothing was entered this month", () => {
    expect(
      buildSmartSummary({
        monthlyGross: 0,
        monthlyExpectedDeduction: 0,
        monthlyActualDeduction: null,
        differenceCount: 0,
        differenceTotalAbs: 0,
      }),
    ).toBe("Bu ay henüz gün sonu satışı girilmedi.");
  });

  it("omits the actual-deduction sentence when no payments have been recorded yet", () => {
    const text = buildSmartSummary({
      monthlyGross: 100000,
      monthlyExpectedDeduction: 2500,
      monthlyActualDeduction: null,
      differenceCount: 0,
      differenceTotalAbs: 0,
    });

    expect(text).toBe(
      "Bu ay toplam 100.000,00 TL POS satışı yaptınız. " +
        "Kayıtlı tarifelere göre 2.500,00 TL kesinti bekleniyordu.",
    );
  });

  it("reports no differences once payments are resolved and nothing needs review", () => {
    const text = buildSmartSummary({
      monthlyGross: 100000,
      monthlyExpectedDeduction: 2500,
      monthlyActualDeduction: 2500,
      differenceCount: 0,
      differenceTotalAbs: 0,
    });

    expect(text).toContain("Kontrol edilmesi gereken fark bulunmuyor.");
  });
});
