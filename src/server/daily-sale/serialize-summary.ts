import type { DailySaleCalculationSummary } from "@/lib/tariff-engine";

/** Decimal/Date içeren hesaplama özetini JSON'a uygun düz nesneye çevirir. */
export function serializeSummary(summary: DailySaleCalculationSummary) {
  return {
    grossTotal: summary.grossTotal.toFixed(2),
    expectedCommissionTotal: summary.expectedCommissionTotal.toFixed(2),
    fixedFeeTotal: summary.fixedFeeTotal.toFixed(2),
    otherDeductionTotal: summary.otherDeductionTotal.toFixed(2),
    expectedNetTotal: summary.expectedNetTotal.toFixed(2),
    tariffVersionId: summary.tariffVersionId,
    tariffVersionNumber: summary.tariffVersionNumber,
    lines: summary.lines.map((line) => ({
      transactionType: line.transactionType,
      installmentCount: line.installmentCount,
      grossAmount: line.grossAmount.toFixed(2),
      commissionRate: line.commissionRate.toFixed(3),
      expectedCommission: line.expectedCommission.toFixed(2),
      fixedFee: line.fixedFee.toFixed(2),
      expectedNet: line.expectedNet.toFixed(2),
      valorDays: line.valorDays,
      expectedPaymentDate: line.expectedPaymentDate.toISOString(),
      generatesExpectedPayment: line.generatesExpectedPayment,
    })),
  };
}

export type SerializedSummary = ReturnType<typeof serializeSummary>;
