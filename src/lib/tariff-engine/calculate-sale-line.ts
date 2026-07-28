import Decimal from "decimal.js";
import type { HolidayCalendar } from "./holiday-calendar";
import { addBusinessDays } from "./business-days";
import type {
  DailySaleCalculationSummary,
  SaleLineCalculationResult,
  SaleLineInput,
  TariffForCalculation,
} from "./types";

/** "Tarife eksikse hesaplama yapma" — çağıran taraf tarife bulunamadığında bunu fırlatır. */
export class MissingTariffError extends Error {
  constructor(message = "Bu POS için aktif tarife bulunmuyor. Beklenen ödeme hesaplanamaz.") {
    super(message);
    this.name = "MissingTariffError";
  }
}

export class UnsupportedInstallmentError extends Error {
  constructor(count: number) {
    super(`${count} taksit için kayıtlı tarife oranı bulunamadı.`);
    this.name = "UnsupportedInstallmentError";
  }
}

const ZERO = new Decimal(0);

/**
 * Tek bir gün sonu satış satırının beklenen komisyon/net/ödeme tarihini
 * hesaplar. Saf fonksiyon — DB, ağ veya UI'a bağımlı değildir (bkz. Aşama 6:
 * "Hesaplama motorunu UI'dan bağımsız saf TypeScript fonksiyonları olarak
 * yaz"). Komisyon matematiği ve tarih hesaplama burada tamamen
 * deterministiktir — yapay zekâ kullanılmaz.
 */
export function calculateSaleLine(
  line: SaleLineInput,
  tariff: TariffForCalculation,
  saleDate: Date,
  calendar: HolidayCalendar,
): SaleLineCalculationResult {
  const blockDays = tariff.paymentTerms?.blockDurationDays ?? 0;

  if (line.transactionType === "REFUND" || line.transactionType === "CANCEL") {
    // İade/iptal gelecekte beklenen bir ödeme doğurmaz; o günün brüt
    // tutarından düşülen bir kayıt olarak tutulur.
    return {
      transactionType: line.transactionType,
      installmentCount: line.installmentCount,
      grossAmount: line.amount.negated(),
      commissionRate: ZERO,
      expectedCommission: ZERO,
      fixedFee: ZERO,
      expectedNet: line.amount.negated(),
      valorDays: 0,
      expectedPaymentDate: saleDate,
      tariffVersionId: tariff.tariffVersionId,
      generatesExpectedPayment: false,
    };
  }

  let commissionRate: Decimal;
  let valorDays: number;
  let fixedFee = ZERO;

  if (line.transactionType === "INSTALLMENT") {
    if (!line.installmentCount) {
      throw new Error("Taksitli satış için installmentCount gerekli.");
    }
    const rate = tariff.installments.find((r) => r.installmentCount === line.installmentCount);
    if (!rate) throw new UnsupportedInstallmentError(line.installmentCount);
    commissionRate = rate.commissionRate;
    valorDays = rate.valorDays;
    fixedFee = rate.fixedFee ?? ZERO;
  } else if (line.transactionType === "FOREIGN_CARD") {
    commissionRate = tariff.singlePayment.foreignCardRate ?? tariff.singlePayment.nextDayRate;
    valorDays = 1;
  } else if (line.transactionType === "COMMERCIAL_CARD") {
    commissionRate = tariff.singlePayment.commercialCardRate ?? tariff.singlePayment.nextDayRate;
    valorDays = 1;
  } else {
    // SINGLE — "ertesi gün ödeme oranı" varsayılan valör.
    commissionRate = tariff.singlePayment.nextDayRate;
    valorDays = 1;
  }

  const expectedCommission = line.amount.mul(commissionRate).div(100);
  const expectedNet = line.amount.minus(expectedCommission).minus(fixedFee);
  const expectedPaymentDate = addBusinessDays(saleDate, valorDays + blockDays, calendar);

  return {
    transactionType: line.transactionType,
    installmentCount: line.installmentCount,
    grossAmount: line.amount,
    commissionRate,
    expectedCommission,
    fixedFee,
    expectedNet,
    valorDays,
    expectedPaymentDate,
    tariffVersionId: tariff.tariffVersionId,
    generatesExpectedPayment: true,
  };
}

/** Bir gün sonu girişindeki tüm satırları hesaplayıp toplamları çıkarır. */
export function summarizeDailySale(
  lines: SaleLineInput[],
  tariff: TariffForCalculation,
  saleDate: Date,
  calendar: HolidayCalendar,
): DailySaleCalculationSummary {
  const results = lines.map((line) => calculateSaleLine(line, tariff, saleDate, calendar));

  const grossTotal = results.reduce((sum, r) => sum.plus(r.grossAmount), ZERO);
  const expectedCommissionTotal = results.reduce(
    (sum, r) => sum.plus(r.expectedCommission),
    ZERO,
  );
  const fixedFeeTotal = results.reduce((sum, r) => sum.plus(r.fixedFee), ZERO);
  const expectedNetTotal = results.reduce((sum, r) => sum.plus(r.expectedNet), ZERO);

  return {
    grossTotal,
    expectedCommissionTotal,
    fixedFeeTotal,
    otherDeductionTotal: ZERO,
    expectedNetTotal,
    lines: results,
    tariffVersionId: tariff.tariffVersionId,
    tariffVersionNumber: tariff.versionNumber,
  };
}
