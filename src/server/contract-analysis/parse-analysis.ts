import type { ComparableTerms } from "@/lib/contract-comparison";
import type { FinancialImpact } from "./provider";

/** `ContractAnalysis.advantages`/`attentionPoints` (Json) → string[] güvenli dönüşüm. */
export function parseStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

const EMPTY_FINANCIAL_IMPACT: FinancialImpact = {
  estimatedMonthlyCost: null,
  estimatedAnnualCost: null,
  comparedToCurrentDiff: null,
  volumeShortfallCost: null,
  earlyExitCost: null,
};

/** `ContractAnalysis.commissionSummary` (Json) → FinancialImpact güvenli dönüşüm. */
export function parseFinancialImpact(value: unknown): FinancialImpact {
  if (!value || typeof value !== "object") return EMPTY_FINANCIAL_IMPACT;
  const record = value as Record<string, unknown>;
  const num = (key: keyof FinancialImpact) => (typeof record[key] === "number" ? (record[key] as number) : null);
  return {
    estimatedMonthlyCost: num("estimatedMonthlyCost"),
    estimatedAnnualCost: num("estimatedAnnualCost"),
    comparedToCurrentDiff: num("comparedToCurrentDiff"),
    volumeShortfallCost: num("volumeShortfallCost"),
    earlyExitCost: num("earlyExitCost"),
  };
}

const EMPTY_COMPARABLE_TERMS: ComparableTerms = {
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

/** `ContractAnalysis.comparableTerms` (Json) → ComparableTerms güvenli dönüşüm. */
export function parseComparableTerms(value: unknown): ComparableTerms {
  if (!value || typeof value !== "object") return EMPTY_COMPARABLE_TERMS;
  const record = value as Record<string, unknown>;
  const num = (key: keyof ComparableTerms) => (typeof record[key] === "number" ? (record[key] as number) : null);
  const bool = (key: keyof ComparableTerms) => (typeof record[key] === "boolean" ? (record[key] as boolean) : null);

  const installmentRates: Partial<Record<number, number>> = {};
  if (record.installmentRates && typeof record.installmentRates === "object") {
    for (const [key, val] of Object.entries(record.installmentRates as Record<string, unknown>)) {
      if (typeof val === "number") installmentRates[Number(key)] = val;
    }
  }

  return {
    singlePaymentRate: num("singlePaymentRate"),
    installmentRates,
    valorDays: num("valorDays"),
    monthlyDeviceFee: num("monthlyDeviceFee"),
    otherFixedFees: num("otherFixedFees"),
    volumeCommitmentMonthly: num("volumeCommitmentMonthly"),
    earlyTerminationFee: num("earlyTerminationFee"),
    autoRenewal: bool("autoRenewal"),
    commercialCardExtraRate: num("commercialCardExtraRate"),
    foreignCardExtraRate: num("foreignCardExtraRate"),
    tariffChangeAuthority: bool("tariffChangeAuthority"),
  };
}
