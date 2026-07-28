import { describe, expect, it } from "vitest";
import { compareTariffTerms } from "./compare-terms";
import type { ComparableTerms } from "./types";

const EMPTY: ComparableTerms = {
  singlePaymentRate: null,
  installmentRates: {},
  valorDays: null,
  monthlyDeviceFee: null,
  otherFixedFees: null,
  volumeCommitmentMonthly: null,
  earlyTerminationFee: null,
  autoRenewal: null,
  commercialCardExtraRate: null,
  foreignCardExtraRate: null,
  tariffChangeAuthority: null,
};

describe("compareTariffTerms", () => {
  it("matches the product doc's §16 worked example", () => {
    const current: ComparableTerms = {
      ...EMPTY,
      singlePaymentRate: 2.45,
      installmentRates: { 6: 4.1 },
      valorDays: 1,
      monthlyDeviceFee: 250,
      volumeCommitmentMonthly: null,
      earlyTerminationFee: null,
    };
    const next: ComparableTerms = {
      ...EMPTY,
      singlePaymentRate: 2.2,
      installmentRates: { 6: 4.35 },
      valorDays: 2,
      monthlyDeviceFee: 0,
      volumeCommitmentMonthly: 750000,
      earlyTerminationFee: 15000,
    };

    const result = compareTariffTerms(current, next, 750000);

    const bySingle = result.rows.find((r) => r.label === "Tek çekim oranı")!;
    expect(bySingle.currentDisplay).toBe("%2,45");
    expect(bySingle.newDisplay).toBe("%2,20");
    expect(bySingle.tone).toBe("advantageous");

    const by6Taksit = result.rows.find((r) => r.label === "6 taksit oranı")!;
    expect(by6Taksit.currentDisplay).toBe("%4,10");
    expect(by6Taksit.newDisplay).toBe("%4,35");
    expect(by6Taksit.tone).toBe("disadvantageous");

    const valor = result.rows.find((r) => r.label === "Valör")!;
    expect(valor.currentDisplay).toBe("1 gün");
    expect(valor.newDisplay).toBe("2 gün");
    expect(valor.tone).toBe("disadvantageous");

    const commitment = result.rows.find((r) => r.label === "Ciro taahhüdü")!;
    expect(commitment.currentDisplay).toBe("Yok");
    expect(commitment.tone).toBe("disadvantageous");

    expect(result.summary).toBe(
      "Yeni teklif tek çekimde avantajlı, ancak taksitli satış ve ciro taahhüdü ve erken fesih bedeli nedeniyle toplam yıllık maliyet mevcut sözleşmeden daha yüksek olabilir.",
    );
    expect(result.summary).not.toMatch(/imzala/i);
  });

  it("never recommends signing or not signing regardless of outcome", () => {
    const result = compareTariffTerms(
      { ...EMPTY, singlePaymentRate: 3, monthlyDeviceFee: 100 },
      { ...EMPTY, singlePaymentRate: 1, monthlyDeviceFee: 0 },
      100000,
    );
    expect(result.summary.toLowerCase()).not.toContain("imzala");
  });

  it("stays neutral when a field is unknown on either side", () => {
    const result = compareTariffTerms(EMPTY, EMPTY, null);
    const bySingle = result.rows.find((r) => r.label === "Tek çekim oranı")!;
    expect(bySingle.tone).toBe("neutral");
    expect(bySingle.currentDisplay).toBe("—");
    expect(result.projectedMonthlyImpact).toBeNull();
    expect(result.projectedAnnualImpact).toBeNull();
  });
});
