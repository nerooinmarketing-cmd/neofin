import { prisma } from "@/lib/prisma";
import type { TenantContext } from "@/server/tenant-context";
import type { DifferenceReasonCode, DifferenceRiskLevel, RuleExplanation } from "@/lib/payment-comparison";
import { statusFromDifference } from "@/server/payments/status-labels";

export interface DifferenceFilters {
  bankId?: string;
  posId?: string;
  branchId?: string;
  status?: string;
}

const FALLBACK_RULE_EXPLANATION: RuleExplanation = {
  reasonCode: "MISSING_DATA",
  possibleReason: "Bu kayıt için ayrıntılı açıklama üretilmemiş",
  documentToCheck: "—",
  questionForBank: "—",
  recommendedAction: "—",
  riskLevel: "medium",
};

/** Durum bazında varsayılan risk/neden — Aşama 9 öncesi (eski şema) kayıtları tamamlamak için. */
const DEFAULT_BY_STATUS: Record<string, { reasonCode: DifferenceReasonCode; riskLevel: DifferenceRiskLevel }> = {
  MATCHED: { reasonCode: "ROUNDING", riskLevel: "low" },
  DELAYED: { reasonCode: "VALOR", riskLevel: "low" },
  NEEDS_REVIEW: { reasonCode: "RATE_OR_CARD_TYPE", riskLevel: "medium" },
  DIFFERENCE_FOUND: { reasonCode: "OVERPAYMENT", riskLevel: "medium" },
  PARTIALLY_PAID: { reasonCode: "PARTIAL_PAYMENT", riskLevel: "high" },
};

function hasPossibleReason(value: unknown): value is Partial<RuleExplanation> {
  return Boolean(value) && typeof value === "object" && "possibleReason" in (value as object);
}

/** Eski kayıtlarda `reasonCode`/`riskLevel` alanları eksik olabilir — durum bazlı varsayılanla tamamla. */
function normalizeRuleExplanation(value: unknown, status: string): RuleExplanation {
  if (!hasPossibleReason(value)) return FALLBACK_RULE_EXPLANATION;
  const fallback = DEFAULT_BY_STATUS[status] ?? { reasonCode: "MISSING_DATA" as const, riskLevel: "medium" as const };
  return {
    reasonCode: value.reasonCode ?? fallback.reasonCode,
    possibleReason: value.possibleReason ?? FALLBACK_RULE_EXPLANATION.possibleReason,
    documentToCheck: value.documentToCheck ?? "—",
    questionForBank: value.questionForBank ?? "—",
    recommendedAction: value.recommendedAction ?? "—",
    riskLevel: value.riskLevel ?? fallback.riskLevel,
  };
}

export const differenceRepository = {
  async listWithFilters(ctx: TenantContext, filters: DifferenceFilters) {
    const where: Record<string, unknown> = { companyId: ctx.companyId };
    if (filters.status) where.status = filters.status;
    if (filters.bankId || filters.posId || filters.branchId) {
      where.expectedPayment = {
        ...(filters.bankId ? { bankId: filters.bankId } : {}),
        ...(filters.posId ? { posId: filters.posId } : {}),
        ...(filters.branchId ? { branchId: filters.branchId } : {}),
      };
    }

    const differences = await prisma.paymentDifference.findMany({
      where,
      include: {
        expectedPayment: { include: { bank: true, pos: true, branch: true } },
        actualPayment: true,
        tariffVersion: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return differences.map((d) => {
      const grossAmount = Number(d.expectedPayment.grossAmount);
      const expectedNet = Number(d.expectedPayment.expectedNet);
      const registeredRate =
        grossAmount > 0 ? ((grossAmount - expectedNet) / grossAmount) * 100 : null;

      const ruleExplanation = normalizeRuleExplanation(d.ruleExplanations, d.status);

      return {
        id: d.id,
        status: d.status,
        displayStatus: statusFromDifference(d.status),
        createdAt: d.createdAt,
        bankName: d.expectedPayment.bank.name,
        posName: d.expectedPayment.pos.name,
        branchName: d.expectedPayment.branch.name,
        saleDate: d.expectedPayment.saleDate,
        expectedPaymentDate: d.expectedPayment.expectedPaymentDate,
        receivedDate: d.actualPayment.receivedDate,
        expectedNet,
        actualAmount: Number(d.actualPayment.receivedAmount),
        differenceAmount: Number(d.differenceAmount),
        differencePercentage: Number(d.differencePercentage),
        registeredRate,
        estimatedAppliedRate: d.estimatedAppliedRate ? Number(d.estimatedAppliedRate) : null,
        delayDays: d.delayDays,
        valorCompliance:
          d.delayDays > 0 ? `${d.delayDays} iş günü gecikmeli` : "Kayıtlı valöre uyumlu",
        feeCompliance:
          d.status === "MATCHED" || d.status === "DELAYED"
            ? "Uyumlu görünüyor"
            : "Kontrol edilmeli",
        tariffLabel: `v${d.tariffVersion.versionNumber}${d.tariffVersion.campaignName ? ` · ${d.tariffVersion.campaignName}` : ""}`,
        sourceDocumentUrl: d.actualPayment.documentUrl,
        ruleExplanation,
      };
    });
  },
};

export type DifferenceListItem = Awaited<
  ReturnType<typeof differenceRepository.listWithFilters>
>[number];
