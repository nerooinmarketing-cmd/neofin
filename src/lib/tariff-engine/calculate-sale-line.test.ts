import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import {
  calculateSaleLine,
  summarizeDailySale,
  UnsupportedInstallmentError,
} from "./calculate-sale-line";
import { StaticTurkishHolidayCalendar } from "./holiday-calendar";
import type { SaleLineInput, TariffForCalculation } from "./types";

const calendar = new StaticTurkishHolidayCalendar();

const tariff: TariffForCalculation = {
  tariffVersionId: "tariff-1",
  versionNumber: 1,
  singlePayment: {
    nextDayRate: new Decimal("2.85"),
    foreignCardRate: new Decimal("3.40"),
    commercialCardRate: new Decimal("3.60"),
  },
  installments: [
    { installmentCount: 2, commissionRate: new Decimal("3.00"), valorDays: 2 },
    { installmentCount: 6, commissionRate: new Decimal("3.10"), valorDays: 2 },
    {
      installmentCount: 12,
      commissionRate: new Decimal("4.20"),
      valorDays: 3,
      fixedFee: new Decimal("5.00"),
    },
  ],
};

// 2026-08-12 Çarşamba
const saleDate = new Date(2026, 7, 12);

describe("calculateSaleLine — tek çekim", () => {
  it("matches the product doc's worked example (10.000 TL tek çekim -> ertesi iş günü)", () => {
    const line: SaleLineInput = {
      transactionType: "SINGLE",
      amount: new Decimal(10000),
      transactionCount: 1,
    };
    const result = calculateSaleLine(line, tariff, saleDate, calendar);

    expect(result.commissionRate.toString()).toBe("2.85");
    expect(result.expectedCommission.toString()).toBe("285");
    expect(result.expectedNet.toString()).toBe("9715");
    expect(result.expectedPaymentDate.toDateString()).toBe(
      new Date(2026, 7, 13).toDateString(),
    );
    expect(result.generatesExpectedPayment).toBe(true);
  });
});

describe("calculateSaleLine — taksit", () => {
  it("uses the rate/valor/fixed fee configured for that installment count", () => {
    const line: SaleLineInput = {
      transactionType: "INSTALLMENT",
      installmentCount: 12,
      amount: new Decimal(6000),
      transactionCount: 1,
    };
    const result = calculateSaleLine(line, tariff, saleDate, calendar);

    // 6000 * 4.20% = 252, sabit ücret 5 -> net = 6000 - 252 - 5 = 5743
    expect(result.expectedCommission.toString()).toBe("252");
    expect(result.fixedFee.toString()).toBe("5");
    expect(result.expectedNet.toString()).toBe("5743");
    expect(result.valorDays).toBe(3);
  });

  it("throws when the installment count has no configured rate", () => {
    const line: SaleLineInput = {
      transactionType: "INSTALLMENT",
      installmentCount: 9,
      amount: new Decimal(1000),
      transactionCount: 1,
    };
    expect(() => calculateSaleLine(line, tariff, saleDate, calendar)).toThrow(
      UnsupportedInstallmentError,
    );
  });
});

describe("calculateSaleLine — yabancı/ticari kart", () => {
  it("applies the foreign card override rate", () => {
    const line: SaleLineInput = {
      transactionType: "FOREIGN_CARD",
      amount: new Decimal(1000),
      transactionCount: 1,
    };
    const result = calculateSaleLine(line, tariff, saleDate, calendar);
    expect(result.commissionRate.toString()).toBe("3.4");
  });

  it("falls back to the next-day rate when no commercial card rate is set", () => {
    const tariffWithoutCommercialRate: TariffForCalculation = {
      ...tariff,
      singlePayment: { nextDayRate: new Decimal("2.85") },
    };
    const line: SaleLineInput = {
      transactionType: "COMMERCIAL_CARD",
      amount: new Decimal(1000),
      transactionCount: 1,
    };
    const result = calculateSaleLine(line, tariffWithoutCommercialRate, saleDate, calendar);
    expect(result.commissionRate.toString()).toBe("2.85");
  });
});

describe("calculateSaleLine — iade/iptal", () => {
  it("negates the amount and produces no expected payment", () => {
    const line: SaleLineInput = {
      transactionType: "REFUND",
      amount: new Decimal(500),
      transactionCount: 1,
    };
    const result = calculateSaleLine(line, tariff, saleDate, calendar);
    expect(result.expectedNet.toString()).toBe("-500");
    expect(result.generatesExpectedPayment).toBe(false);
  });
});

describe("calculateSaleLine — bloke süresi", () => {
  it("adds blockDurationDays on top of the valor days", () => {
    const tariffWithBlock: TariffForCalculation = {
      ...tariff,
      paymentTerms: { blockDurationDays: 2 },
    };
    const line: SaleLineInput = {
      transactionType: "SINGLE",
      amount: new Decimal(1000),
      transactionCount: 1,
    };
    const result = calculateSaleLine(line, tariffWithBlock, saleDate, calendar);
    // valör 1 + bloke 2 = 3 iş günü -> 12 Ağu Çrş + 3 iş günü -> 17 Ağu Pazartesi
    expect(result.expectedPaymentDate.toDateString()).toBe(
      new Date(2026, 7, 17).toDateString(),
    );
  });
});

describe("summarizeDailySale", () => {
  it("matches the product doc's combined worked example", () => {
    // "Tek çekim 10.000 TL" + "6 taksit 25.000 TL"
    const lines: SaleLineInput[] = [
      { transactionType: "SINGLE", amount: new Decimal(10000), transactionCount: 1 },
      {
        transactionType: "INSTALLMENT",
        installmentCount: 6,
        amount: new Decimal(25000),
        transactionCount: 1,
      },
    ];
    const summary = summarizeDailySale(lines, tariff, saleDate, calendar);

    expect(summary.grossTotal.toString()).toBe("35000");
    // komisyon: 285 + (25000*3.10%=775) = 1060
    expect(summary.expectedCommissionTotal.toString()).toBe("1060");
    expect(summary.expectedNetTotal.toString()).toBe("33940");
    expect(summary.lines).toHaveLength(2);
  });

  it("keeps exact decimal precision across many lines (no floating point drift)", () => {
    const lines: SaleLineInput[] = Array.from({ length: 10 }, () => ({
      transactionType: "SINGLE" as const,
      amount: new Decimal("10.1"),
      transactionCount: 1,
    }));
    const summary = summarizeDailySale(lines, tariff, saleDate, calendar);
    expect(summary.grossTotal.toString()).toBe("101");
  });
});
