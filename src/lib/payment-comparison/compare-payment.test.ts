import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import { StaticTurkishHolidayCalendar } from "@/lib/tariff-engine";
import { comparePayment } from "./compare-payment";

const calendar = new StaticTurkishHolidayCalendar();
// 2026-08-12 Çarşamba
const expectedDate = new Date(2026, 7, 12);

describe("comparePayment", () => {
  it("matches the product doc's 'uyumlu' example (rounding difference only)", () => {
    const result = comparePayment(
      {
        expectedNet: new Decimal("33742.50"),
        actualAmount: new Decimal("33741.70"),
        expectedPaymentDate: expectedDate,
        receivedDate: expectedDate,
        roundingTolerance: new Decimal(1),
      },
      calendar,
    );

    expect(result.status).toBe("MATCHED");
    expect(result.message).toBe("Ödeme beklenen tutarla uyumlu. 0,80 TL yuvarlama farkı var.");
  });

  it("matches the product doc's 'kontrol edilmeli' example (underpaid beyond tolerance)", () => {
    const result = comparePayment(
      {
        expectedNet: new Decimal("33742.50"),
        actualAmount: new Decimal("33515.00"),
        expectedPaymentDate: expectedDate,
        receivedDate: expectedDate,
        roundingTolerance: new Decimal(1),
      },
      calendar,
    );

    expect(result.status).toBe("NEEDS_REVIEW");
    expect(result.message).toContain("227,50 TL daha az geçti");
    expect(result.differenceAmount.toString()).toBe("-227.5");
  });

  it("matches the product doc's 'gecikmiş' example (on-amount, late arrival)", () => {
    // Perşembe 13 Ağustos'tan Pazartesi 17 Ağustos'a: 2 iş günü gecikme
    const result = comparePayment(
      {
        expectedNet: new Decimal(10000),
        actualAmount: new Decimal(10000),
        expectedPaymentDate: new Date(2026, 7, 13),
        receivedDate: new Date(2026, 7, 17),
        roundingTolerance: new Decimal(1),
      },
      calendar,
    );

    expect(result.status).toBe("DELAYED");
    expect(result.delayDays).toBe(2);
    expect(result.message).toBe("Ödeme kayıtlı valöre göre 2 iş günü gecikmiş görünüyor.");
  });

  it("flags a large shortfall as a partial payment", () => {
    const result = comparePayment(
      {
        expectedNet: new Decimal(10000),
        actualAmount: new Decimal(4000),
        expectedPaymentDate: expectedDate,
        receivedDate: expectedDate,
        roundingTolerance: new Decimal(1),
      },
      calendar,
    );

    expect(result.status).toBe("PARTIALLY_PAID");
  });

  it("flags an overpayment beyond tolerance as DIFFERENCE_FOUND", () => {
    const result = comparePayment(
      {
        expectedNet: new Decimal(10000),
        actualAmount: new Decimal(10050),
        expectedPaymentDate: expectedDate,
        receivedDate: expectedDate,
        roundingTolerance: new Decimal(1),
      },
      calendar,
    );

    expect(result.status).toBe("DIFFERENCE_FOUND");
    expect(result.message).toContain("50,00 TL daha fazla geçti");
  });

  it("estimates the applied rate from gross amount when provided", () => {
    const result = comparePayment(
      {
        expectedNet: new Decimal(9715),
        actualAmount: new Decimal(9624.5),
        expectedPaymentDate: expectedDate,
        receivedDate: expectedDate,
        roundingTolerance: new Decimal(1),
        grossAmount: new Decimal(10000),
      },
      calendar,
    );

    // (10000 - 9624.5) / 10000 * 100 = 3.755
    expect(result.estimatedAppliedRate?.toString()).toBe("3.755");
  });

  it("matches the product doc's §14 worked example with registered vs applied rate", () => {
    const result = comparePayment(
      {
        expectedNet: new Decimal(9690),
        actualAmount: new Decimal(9624.5),
        expectedPaymentDate: expectedDate,
        receivedDate: expectedDate,
        roundingTolerance: new Decimal(1),
        grossAmount: new Decimal(10000),
      },
      calendar,
    );

    expect(result.status).toBe("NEEDS_REVIEW");
    expect(result.registeredRate?.toString()).toBe("3.1");
    expect(result.estimatedAppliedRate?.toString()).toBe("3.755");
    expect(result.ruleExplanation.reasonCode).toBe("RATE_OR_CARD_TYPE");
    expect(result.ruleExplanation.possibleReason).toContain("%3,10");
    expect(result.ruleExplanation.possibleReason).toContain("%3,76");
    expect(result.ruleExplanation.possibleReason).toContain("ticari kart farkı");
    expect(result.ruleExplanation.riskLevel).toBe("medium");
  });

  it("flags missing gross amount as a data-quality issue rather than guessing a rate", () => {
    const result = comparePayment(
      {
        expectedNet: new Decimal(10000),
        actualAmount: new Decimal(9500),
        expectedPaymentDate: expectedDate,
        receivedDate: expectedDate,
        roundingTolerance: new Decimal(1),
      },
      calendar,
    );

    expect(result.status).toBe("NEEDS_REVIEW");
    expect(result.ruleExplanation.reasonCode).toBe("MISSING_DATA");
    expect(result.ruleExplanation.riskLevel).toBe("high");
  });

  it("respects a custom rounding tolerance", () => {
    const result = comparePayment(
      {
        expectedNet: new Decimal(10000),
        actualAmount: new Decimal(9995),
        expectedPaymentDate: expectedDate,
        receivedDate: expectedDate,
        roundingTolerance: new Decimal(10),
      },
      calendar,
    );

    expect(result.status).toBe("MATCHED");
  });
});
