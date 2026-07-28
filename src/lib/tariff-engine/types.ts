import type Decimal from "decimal.js";

export type SaleTransactionType =
  | "SINGLE"
  | "INSTALLMENT"
  | "FOREIGN_CARD"
  | "COMMERCIAL_CARD"
  | "REFUND"
  | "CANCEL";

export interface SaleLineInput {
  transactionType: SaleTransactionType;
  /** Yalnızca transactionType = INSTALLMENT için (2..12). */
  installmentCount?: number;
  amount: Decimal;
  transactionCount: number;
}

export interface InstallmentRateForCalculation {
  installmentCount: number;
  /** Yüzde olarak, örn. 3.10 = %3,10 */
  commissionRate: Decimal;
  valorDays: number;
  fixedFee?: Decimal;
}

export interface TariffForCalculation {
  tariffVersionId: string;
  versionNumber: number;
  singlePayment: {
    nextDayRate: Decimal;
    foreignCardRate?: Decimal;
    commercialCardRate?: Decimal;
  };
  installments: InstallmentRateForCalculation[];
  paymentTerms?: {
    blockDurationDays?: number;
  };
}

export interface SaleLineCalculationResult {
  transactionType: SaleTransactionType;
  installmentCount?: number;
  grossAmount: Decimal;
  commissionRate: Decimal;
  expectedCommission: Decimal;
  fixedFee: Decimal;
  expectedNet: Decimal;
  valorDays: number;
  expectedPaymentDate: Date;
  tariffVersionId: string;
  /** İade/iptal gibi satırlar gelecekte beklenen bir ödeme oluşturmaz. */
  generatesExpectedPayment: boolean;
}

export interface DailySaleCalculationSummary {
  grossTotal: Decimal;
  expectedCommissionTotal: Decimal;
  fixedFeeTotal: Decimal;
  otherDeductionTotal: Decimal;
  expectedNetTotal: Decimal;
  lines: SaleLineCalculationResult[];
  tariffVersionId: string;
  tariffVersionNumber: number;
}
