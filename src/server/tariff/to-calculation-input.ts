import Decimal from "decimal.js";
import type { TariffForCalculation } from "@/lib/tariff-engine";

interface PrismaTariffVersionWithRatesForCalculation {
  id: string;
  versionNumber: number;
  singlePaymentRates: {
    nextDayRate: unknown;
    foreignCardRate: unknown;
    commercialCardRate: unknown;
  } | null;
  installmentRates: Array<{
    installmentCount: number;
    commissionRate: unknown;
    valorDays: number;
    fixedFee: unknown;
  }>;
  paymentTerms: { blockDurationDays: number | null } | null;
}

/**
 * DB'den (Prisma Decimal) hesaplama motorunun beklediği saf `decimal.js`
 * girdisine dönüştürür. Motor Prisma'yı hiç bilmez — bu eşleme sınırda
 * (repository katmanında) yapılır.
 */
export function toTariffForCalculation(
  tariffVersion: PrismaTariffVersionWithRatesForCalculation,
): TariffForCalculation {
  if (!tariffVersion.singlePaymentRates) {
    throw new Error(
      `TariffVersion ${tariffVersion.id} için tek çekim oranı bulunamadı — hesaplama yapılamaz.`,
    );
  }

  return {
    tariffVersionId: tariffVersion.id,
    versionNumber: tariffVersion.versionNumber,
    singlePayment: {
      nextDayRate: new Decimal(String(tariffVersion.singlePaymentRates.nextDayRate)),
      foreignCardRate: tariffVersion.singlePaymentRates.foreignCardRate
        ? new Decimal(String(tariffVersion.singlePaymentRates.foreignCardRate))
        : undefined,
      commercialCardRate: tariffVersion.singlePaymentRates.commercialCardRate
        ? new Decimal(String(tariffVersion.singlePaymentRates.commercialCardRate))
        : undefined,
    },
    installments: tariffVersion.installmentRates.map((rate) => ({
      installmentCount: rate.installmentCount,
      commissionRate: new Decimal(String(rate.commissionRate)),
      valorDays: rate.valorDays,
      fixedFee: rate.fixedFee ? new Decimal(String(rate.fixedFee)) : undefined,
    })),
    paymentTerms: tariffVersion.paymentTerms
      ? { blockDurationDays: tariffVersion.paymentTerms.blockDurationDays ?? undefined }
      : undefined,
  };
}
