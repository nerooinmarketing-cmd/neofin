import type Decimal from "decimal.js";

export type DifferenceStatus =
  | "MATCHED"
  | "NEEDS_REVIEW"
  | "DELAYED"
  | "PARTIALLY_PAID"
  | "DIFFERENCE_FOUND";

export interface PaymentComparisonInput {
  expectedNet: Decimal;
  actualAmount: Decimal;
  expectedPaymentDate: Date;
  receivedDate: Date;
  /** Varsayılan 1 TL — "yuvarlama toleransı ayarlanabilir olsun". */
  roundingTolerance: Decimal;
  /** "Tahmini uygulanan komisyon oranı" için — varsa. */
  grossAmount?: Decimal;
}

/** Seviye 3 (yapay zekâ öncesi rule-based açıklama) için sabit neden kategorileri. */
export type DifferenceReasonCode =
  | "NONE"
  | "ROUNDING"
  | "VALOR"
  | "RATE_OR_CARD_TYPE"
  | "OVERPAYMENT"
  | "PARTIAL_PAYMENT"
  | "MISSING_DATA";

export type DifferenceRiskLevel = "low" | "medium" | "high";

export interface RuleExplanation {
  reasonCode: DifferenceReasonCode;
  possibleReason: string;
  documentToCheck: string;
  questionForBank: string;
  recommendedAction: string;
  riskLevel: DifferenceRiskLevel;
}

export interface PaymentComparisonResult {
  differenceAmount: Decimal;
  differencePercentage: Decimal;
  delayDays: number;
  estimatedAppliedRate?: Decimal;
  /** "Kayıtlı oran" — expectedDeduction/grossAmount üzerinden hesaplanır. */
  registeredRate?: Decimal;
  status: DifferenceStatus;
  message: string;
  ruleExplanation: RuleExplanation;
}
