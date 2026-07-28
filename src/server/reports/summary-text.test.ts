import { describe, expect, it } from "vitest";
import { buildAnnualExecutiveSummary, buildBankNegotiationScript } from "./summary-text";

describe("buildAnnualExecutiveSummary", () => {
  it("matches the product doc's §17.2 worked example", () => {
    const text = buildAnnualExecutiveSummary({
      grossTotal: 18450000,
      actualDeductionTotal: 512450,
      expectedDeductionTotal: 468300,
      difference: 44150,
    });

    expect(text).toBe(
      "Son 12 ayda 18.450.000,00 TL POS cirosu oluştu. " +
        "Toplam 512.450,00 TL kesinti gerçekleşti. " +
        "Kayıtlı tarifelere göre beklenen kesinti 468.300,00 TL idi. " +
        "44.150,00 TL tutarındaki fark kontrol edilmelidir.",
    );
  });

  it("never uses accusatory language", () => {
    const text = buildAnnualExecutiveSummary({
      grossTotal: 1000000,
      actualDeductionTotal: 30000,
      expectedDeductionTotal: 25000,
      difference: 5000,
    });
    expect(text.toLowerCase()).not.toContain("hatalı");
  });

  it("omits realized-deduction sentence when no actual payments are recorded", () => {
    const text = buildAnnualExecutiveSummary({
      grossTotal: 1000000,
      actualDeductionTotal: null,
      expectedDeductionTotal: 25000,
      difference: null,
    });
    expect(text).toBe(
      "Son 12 ayda 1.000.000,00 TL POS cirosu oluştu. Kayıtlı tarifelere göre beklenen kesinti 25.000,00 TL idi.",
    );
  });
});

describe("buildBankNegotiationScript", () => {
  it("mentions rate, fees and valor when relevant", () => {
    const text = buildBankNegotiationScript({
      bankName: "Akbank",
      avgRate: 2.6,
      fixedFeeTotal: 250,
      avgValorDays: 2,
    });
    expect(text).toContain("Akbank");
    expect(text).toContain("%2,6");
    expect(text).toContain("250,00 TL");
    expect(text).toContain("2 gün");
  });
});
