import { prisma } from "@/lib/prisma";
import type { TenantContext } from "@/server/tenant-context";
import { NotFoundError } from "@/server/errors";
import { compareTariffTerms } from "@/lib/contract-comparison";
import { toComparableTerms } from "@/server/tariff/to-comparable-terms";
import { parseComparableTerms } from "@/server/contract-analysis/parse-analysis";
import { currentMonthRange } from "@/server/reporting/date-ranges";

export type ContractComparisonUnavailableReason = "ANALYSIS_PENDING" | "NO_POS_LINKED" | "NO_ACTIVE_TARIFF";

export const contractComparisonRepository = {
  async getComparison(ctx: TenantContext, contractId: string) {
    const contract = await prisma.contract.findFirst({
      where: { id: contractId, companyId: ctx.companyId, deletedAt: null },
      include: { analysis: true, bank: true, pos: true },
    });
    if (!contract) throw new NotFoundError("Contract", contractId);

    if (!contract.analysis) {
      return { available: false as const, reason: "ANALYSIS_PENDING" as ContractComparisonUnavailableReason };
    }
    if (!contract.posId) {
      return { available: false as const, reason: "NO_POS_LINKED" as ContractComparisonUnavailableReason };
    }

    const currentTariff = await prisma.tariffVersion.findFirst({
      where: { companyId: ctx.companyId, posId: contract.posId, status: "ACTIVE" },
      include: {
        singlePaymentRates: true,
        installmentRates: true,
        transactionSupport: true,
        fees: true,
        paymentTerms: true,
        commitments: true,
      },
      orderBy: { versionNumber: "desc" },
    });
    if (!currentTariff) {
      return { available: false as const, reason: "NO_ACTIVE_TARIFF" as ContractComparisonUnavailableReason };
    }

    const current = toComparableTerms(currentTariff);
    const next = parseComparableTerms(contract.analysis.comparableTerms);

    const { start, end } = currentMonthRange();
    const monthlyAgg = await prisma.expectedPayment.aggregate({
      where: { companyId: ctx.companyId, posId: contract.posId, saleDate: { gte: start, lte: end } },
      _sum: { grossAmount: true },
    });
    const actualMonthlyVolume = Number(monthlyAgg._sum.grossAmount ?? 0);
    const monthlyVolumeAssumption = actualMonthlyVolume > 0 ? actualMonthlyVolume : next.volumeCommitmentMonthly;

    const comparison = compareTariffTerms(current, next, monthlyVolumeAssumption);

    return {
      available: true as const,
      comparison,
      currentTariffLabel: `v${currentTariff.versionNumber}${currentTariff.campaignName ? ` · ${currentTariff.campaignName}` : ""}`,
      bankName: contract.bank?.name ?? null,
      posName: contract.pos?.name ?? null,
      contractTitle: contract.title,
      monthlyVolumeAssumption,
      needsManualReview: contract.status === "NEEDS_MANUAL_REVIEW",
    };
  },
};
