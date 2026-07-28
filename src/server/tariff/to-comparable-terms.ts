import type { ComparableTerms } from "@/lib/contract-comparison";

interface PrismaTariffVersionForComparison {
  singlePaymentRates: {
    nextDayRate: unknown;
    foreignCardRate: unknown;
    commercialCardRate: unknown;
  } | null;
  installmentRates: Array<{
    installmentCount: number;
    commissionRate: unknown;
  }>;
  transactionSupport: {
    commercialCard: boolean;
    foreignCard: boolean;
  } | null;
  paymentTerms: unknown;
  fees: Array<{ feeType: string; amount: unknown }>;
  commitments: {
    monthlyVolumeCommitment: unknown;
    annualVolumeCommitment: unknown;
    breachPenalty: unknown;
  } | null;
}

function toNumberOrNull(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}

/**
 * Kayıtlı (aktif) `TariffVersion`'ı Aşama 11 karşılaştırma motorunun
 * beklediği `ComparableTerms` şekline çevirir — DB↔motor eşlemesi burada
 * yapılır, `src/lib/contract-comparison/` Prisma'dan bağımsız kalır.
 */
export function toComparableTerms(tariffVersion: PrismaTariffVersionForComparison): ComparableTerms {
  const installmentRates: Partial<Record<number, number>> = {};
  for (const rate of tariffVersion.installmentRates) {
    installmentRates[rate.installmentCount] = Number(rate.commissionRate);
  }

  const monthlyDeviceFee = tariffVersion.fees
    .filter((f) => f.feeType === "MONTHLY_POS" || f.feeType === "DEVICE_MAINTENANCE")
    .reduce((sum, f) => sum + Number(f.amount), 0);

  const otherFixedFeesTotal = tariffVersion.fees
    .filter((f) => f.feeType !== "MONTHLY_POS" && f.feeType !== "DEVICE_MAINTENANCE" && f.feeType !== "EARLY_TERMINATION")
    .reduce((sum, f) => sum + Number(f.amount), 0);

  const earlyTerminationFromFees = tariffVersion.fees.find((f) => f.feeType === "EARLY_TERMINATION");
  const earlyTerminationFee = earlyTerminationFromFees
    ? Number(earlyTerminationFromFees.amount)
    : toNumberOrNull(tariffVersion.commitments?.breachPenalty);

  const monthlyVolumeCommitment =
    toNumberOrNull(tariffVersion.commitments?.monthlyVolumeCommitment) ??
    (tariffVersion.commitments?.annualVolumeCommitment
      ? Number(tariffVersion.commitments.annualVolumeCommitment) / 12
      : null);

  return {
    singlePaymentRate: toNumberOrNull(tariffVersion.singlePaymentRates?.nextDayRate),
    installmentRates,
    // Kayıtlı tarifede "1 gün" (nextDayRate) her zaman zorunlu alandır —
    // standart tek çekim valörü olarak kabul edilir.
    valorDays: tariffVersion.singlePaymentRates ? 1 : null,
    monthlyDeviceFee: tariffVersion.fees.length > 0 ? monthlyDeviceFee : null,
    otherFixedFees: tariffVersion.fees.length > 0 ? otherFixedFeesTotal : null,
    volumeCommitmentMonthly: monthlyVolumeCommitment,
    earlyTerminationFee,
    // Kayıtlı tarife sihirbazında otomatik yenileme/tek taraflı değişiklik
    // yetkisi ayrı alanlar olarak tutulmuyor — bilinmiyor kabul edilir.
    autoRenewal: null,
    commercialCardExtraRate: toNumberOrNull(tariffVersion.singlePaymentRates?.commercialCardRate),
    foreignCardExtraRate: toNumberOrNull(tariffVersion.singlePaymentRates?.foreignCardRate),
    tariffChangeAuthority: null,
  };
}
