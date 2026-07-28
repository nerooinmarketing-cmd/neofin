export type FinanceIntent =
  | "MONTHLY_DEDUCTION_REASON"
  | "BANK_COST_COMPARISON"
  | "TOMORROW_EXPECTED_PAYMENT"
  | "BEST_POS_FOR_INSTALLMENT"
  | "CONTRACT_RISKIEST_CLAUSES"
  | "NEGOTIATION_ADVICE"
  | "VALOR_COST_ESTIMATE"
  | "UNKNOWN";

export interface ClassifiedIntent {
  intent: FinanceIntent;
  /** Yalnızca BEST_POS_FOR_INSTALLMENT için — soruda geçen taksit sayısı (belirtilmemişse 6). */
  installmentCount?: number;
}
