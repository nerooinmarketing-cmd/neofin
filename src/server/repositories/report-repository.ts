import { prisma } from "@/lib/prisma";
import type { TenantContext } from "@/server/tenant-context";
import { startOfDay, endOfDay, currentMonthRange, trailing12MonthsRange } from "@/server/reporting/date-ranges";
import { countBusinessDaysBetween, StaticTurkishHolidayCalendar } from "@/lib/tariff-engine";
import type { ReportFormat, ReportType } from "@/generated/prisma/enums";

const holidayCalendar = new StaticTurkishHolidayCalendar();

const MONTH_LABELS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

export const reportRepository = {
  /** 1. Günlük özet — verilen satış tarihi için. */
  async getDailySummary(ctx: TenantContext, date: Date) {
    const payments = await prisma.expectedPayment.findMany({
      where: { companyId: ctx.companyId, saleDate: { gte: startOfDay(date), lte: endOfDay(date) } },
      include: { bank: true, pos: true },
    });

    const grossTotal = payments.reduce((s, p) => s + Number(p.grossAmount), 0);
    const expectedDeductionTotal = payments.reduce((s, p) => s + Number(p.expectedDeduction), 0);
    const expectedNetTotal = payments.reduce((s, p) => s + Number(p.expectedNet), 0);

    const byBankMap = new Map<string, { bankName: string; grossTotal: number; expectedDeductionTotal: number }>();
    const byPosMap = new Map<
      string,
      { posName: string; bankName: string; grossTotal: number; expectedDeductionTotal: number; transactionCount: number }
    >();

    for (const p of payments) {
      const bank = byBankMap.get(p.bankId) ?? { bankName: p.bank.name, grossTotal: 0, expectedDeductionTotal: 0 };
      bank.grossTotal += Number(p.grossAmount);
      bank.expectedDeductionTotal += Number(p.expectedDeduction);
      byBankMap.set(p.bankId, bank);

      const pos = byPosMap.get(p.posId) ?? {
        posName: p.pos.name,
        bankName: p.bank.name,
        grossTotal: 0,
        expectedDeductionTotal: 0,
        transactionCount: 0,
      };
      pos.grossTotal += Number(p.grossAmount);
      pos.expectedDeductionTotal += Number(p.expectedDeduction);
      pos.transactionCount += 1;
      byPosMap.set(p.posId, pos);
    }

    return {
      date,
      grossTotal,
      expectedDeductionTotal,
      expectedNetTotal,
      transactionCount: payments.length,
      byBank: [...byBankMap.values()].sort((a, b) => b.grossTotal - a.grossTotal),
      byPos: [...byPosMap.values()].sort((a, b) => b.grossTotal - a.grossTotal),
    };
  },

  /** 2. Aylık maliyet — verilen ay için (varsayılan: bu ay). */
  async getMonthlyCost(ctx: TenantContext, anchor: Date) {
    const { start, end } = currentMonthRange(anchor);
    const prevAnchor = new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1);
    const { start: prevStart, end: prevEnd } = currentMonthRange(prevAnchor);

    const [current, previous, byBank] = await Promise.all([
      prisma.expectedPayment.aggregate({
        where: { companyId: ctx.companyId, saleDate: { gte: start, lte: end } },
        _sum: { grossAmount: true, expectedDeduction: true, expectedNet: true },
      }),
      prisma.expectedPayment.aggregate({
        where: { companyId: ctx.companyId, saleDate: { gte: prevStart, lte: prevEnd } },
        _sum: { expectedDeduction: true },
      }),
      prisma.expectedPayment.groupBy({
        by: ["bankId"],
        where: { companyId: ctx.companyId, saleDate: { gte: start, lte: end } },
        _sum: { grossAmount: true, expectedDeduction: true },
      }),
    ]);

    const banks = await prisma.bank.findMany({ where: { id: { in: byBank.map((b) => b.bankId) } } });
    const bankNameById = new Map(banks.map((b) => [b.id, b.name]));

    const currentDeduction = Number(current._sum.expectedDeduction ?? 0);
    const previousDeduction = Number(previous._sum.expectedDeduction ?? 0);

    return {
      monthLabel: `${MONTH_LABELS[anchor.getMonth()]} ${anchor.getFullYear()}`,
      grossTotal: Number(current._sum.grossAmount ?? 0),
      expectedDeductionTotal: currentDeduction,
      expectedNetTotal: Number(current._sum.expectedNet ?? 0),
      percentChangeVsPreviousMonth: previousDeduction > 0 ? ((currentDeduction - previousDeduction) / previousDeduction) * 100 : null,
      byBank: byBank
        .map((b) => ({
          bankName: bankNameById.get(b.bankId) ?? "—",
          grossTotal: Number(b._sum.grossAmount ?? 0),
          expectedDeductionTotal: Number(b._sum.expectedDeduction ?? 0),
        }))
        .sort((a, b) => b.grossTotal - a.grossTotal),
    };
  },

  /** 3. Banka karşılaştırma — bkz. UX §17.3 (ciro, ort. oran, kesinti, beklenen kesinti, fark, ort. valör, sabit ücret). */
  async getBankComparison(ctx: TenantContext, range: { start: Date; end: Date }) {
    const banks = await prisma.bank.findMany({ where: { companyId: ctx.companyId, deletedAt: null } });

    return Promise.all(
      banks.map(async (bank) => {
        const payments = await prisma.expectedPayment.findMany({
          where: { companyId: ctx.companyId, bankId: bank.id, saleDate: { gte: range.start, lte: range.end } },
          include: { actualPayments: { orderBy: { createdAt: "desc" }, take: 1 } },
        });

        const grossTotal = payments.reduce((s, p) => s + Number(p.grossAmount), 0);
        const expectedDeductionTotal = payments.reduce((s, p) => s + Number(p.expectedDeduction), 0);

        // "Fark" yalnızca çözümlenmiş (gerçekleşen ödemesi kaydedilmiş) işlemler
        // üzerinden hesaplanır — aksi halde henüz çözümlenmemiş işlemlerin
        // beklenen tutarı, gerçekleşenle kıyaslanıp yanıltıcı bir fark üretir.
        const resolved = payments.filter((p) => p.actualPayments[0]);
        const actualDeductionTotal = resolved.reduce(
          (s, p) => s + (Number(p.grossAmount) - Number(p.actualPayments[0]!.receivedAmount)),
          0,
        );
        const expectedDeductionForResolvedTotal = resolved.reduce((s, p) => s + Number(p.expectedDeduction), 0);

        const avgValorDays =
          payments.length > 0
            ? payments.reduce((s, p) => s + countBusinessDaysBetween(p.saleDate, p.expectedPaymentDate, holidayCalendar), 0) /
              payments.length
            : 0;

        const fees = await prisma.tariffFee.findMany({
          where: { tariffVersion: { companyId: ctx.companyId, bankId: bank.id, status: "ACTIVE" } },
        });
        const fixedFeeTotal = fees.reduce((s, f) => s + Number(f.amount), 0);

        return {
          bankId: bank.id,
          bankName: bank.name,
          grossTotal,
          avgRate: grossTotal > 0 ? (expectedDeductionTotal / grossTotal) * 100 : 0,
          actualDeductionTotal: resolved.length > 0 ? actualDeductionTotal : null,
          expectedDeductionTotal,
          expectedDeductionForResolvedTotal,
          difference: resolved.length > 0 ? actualDeductionTotal - expectedDeductionForResolvedTotal : null,
          avgValorDays,
          fixedFeeTotal,
          paymentCount: payments.length,
          resolvedCount: resolved.length,
        };
      }),
    );
  },

  /** 4. POS karşılaştırma — bkz. UX §17.4. */
  async getPosComparison(ctx: TenantContext, range: { start: Date; end: Date }) {
    const posDevices = await prisma.posDevice.findMany({
      where: { companyId: ctx.companyId, deletedAt: null },
      include: { bank: true },
    });

    const rows = await Promise.all(
      posDevices.map(async (pos) => {
        const payments = await prisma.expectedPayment.findMany({
          where: { companyId: ctx.companyId, posId: pos.id, saleDate: { gte: range.start, lte: range.end } },
        });
        const differences = await prisma.paymentDifference.findMany({
          where: { companyId: ctx.companyId, expectedPayment: { posId: pos.id }, createdAt: { gte: range.start, lte: range.end } },
        });
        const installmentRates = await prisma.tariffInstallmentRate.findMany({
          where: { tariffVersion: { companyId: ctx.companyId, posId: pos.id, status: "ACTIVE" } },
        });

        const grossTotal = payments.reduce((s, p) => s + Number(p.grossAmount), 0);
        const expectedDeductionTotal = payments.reduce((s, p) => s + Number(p.expectedDeduction), 0);
        const totalDifferenceAbs = differences.reduce((s, d) => s + Math.abs(Number(d.differenceAmount)), 0);
        const maxInstallmentRate =
          installmentRates.length > 0 ? Math.max(...installmentRates.map((r) => Number(r.commissionRate))) : 0;

        return {
          posId: pos.id,
          posName: pos.name,
          bankName: pos.bank.name,
          grossTotal,
          expectedDeductionTotal,
          totalDifferenceAbs,
          maxInstallmentRate,
        };
      }),
    );

    const withVolume = rows.filter((r) => r.grossTotal > 0);
    const highestCost = withVolume.length > 0 ? withVolume.reduce((a, b) => (b.expectedDeductionTotal > a.expectedDeductionTotal ? b : a)) : null;
    const lowestCost = withVolume.length > 0 ? withVolume.reduce((a, b) => (b.expectedDeductionTotal < a.expectedDeductionTotal ? b : a)) : null;
    const mostDifference = rows.length > 0 ? rows.reduce((a, b) => (b.totalDifferenceAbs > a.totalDifferenceAbs ? b : a)) : null;
    const highestInstallmentCost = rows.length > 0 ? rows.reduce((a, b) => (b.maxInstallmentRate > a.maxInstallmentRate ? b : a)) : null;

    return {
      rows: rows.sort((a, b) => b.grossTotal - a.grossTotal),
      highestCost,
      lowestCost,
      mostDifference: mostDifference && mostDifference.totalDifferenceAbs > 0 ? mostDifference : null,
      highestInstallmentCost: highestInstallmentCost && highestInstallmentCost.maxInstallmentRate > 0 ? highestInstallmentCost : null,
    };
  },

  /** 5. Fark raporu — dönem içindeki tüm fark kayıtları + özet. */
  async getDifferenceReport(ctx: TenantContext, range: { start: Date; end: Date }) {
    const differences = await prisma.paymentDifference.findMany({
      where: { companyId: ctx.companyId, createdAt: { gte: range.start, lte: range.end } },
      include: { expectedPayment: { include: { bank: true, pos: true } } },
      orderBy: { createdAt: "desc" },
    });

    const byStatus = new Map<string, { count: number; totalAbs: number }>();
    for (const d of differences) {
      const entry = byStatus.get(d.status) ?? { count: 0, totalAbs: 0 };
      entry.count += 1;
      entry.totalAbs += Math.abs(Number(d.differenceAmount));
      byStatus.set(d.status, entry);
    }

    return {
      totalCount: differences.length,
      totalAbs: differences.reduce((s, d) => s + Math.abs(Number(d.differenceAmount)), 0),
      byStatus: [...byStatus.entries()].map(([status, v]) => ({ status, ...v })),
      items: differences.map((d) => ({
        id: d.id,
        bankName: d.expectedPayment.bank.name,
        posName: d.expectedPayment.pos.name,
        saleDate: d.expectedPayment.saleDate,
        differenceAmount: Number(d.differenceAmount),
        status: d.status,
        createdAt: d.createdAt,
      })),
    };
  },

  /** 6. Yıllık maliyet ve pazarlık raporu (flagship) — bkz. UX §17. */
  async getAnnualNegotiationReport(ctx: TenantContext) {
    const now = new Date();
    const range = trailing12MonthsRange(now);

    const [company, bankComparison, posComparison, tariffVersions, commitments] = await Promise.all([
      prisma.company.findUniqueOrThrow({ where: { id: ctx.companyId } }),
      this.getBankComparison(ctx, range),
      this.getPosComparison(ctx, range),
      prisma.tariffVersion.findMany({
        where: { companyId: ctx.companyId },
        include: { bank: true, pos: true },
        orderBy: [{ bankId: "asc" }, { versionNumber: "desc" }],
      }),
      prisma.tariffCommitment.findMany({
        where: { tariffVersion: { companyId: ctx.companyId, status: "ACTIVE" }, monthlyVolumeCommitment: { not: null } },
        include: { tariffVersion: { include: { bank: true, pos: true } } },
      }),
    ]);

    const grossTotal = bankComparison.reduce((s, b) => s + b.grossTotal, 0);
    const expectedDeductionTotal = bankComparison.reduce((s, b) => s + b.expectedDeductionTotal, 0);
    const actualDeductionTotal = bankComparison.reduce((s, b) => s + (b.actualDeductionTotal ?? 0), 0);
    const totalPaymentCount = bankComparison.reduce((s, b) => s + b.paymentCount, 0);
    const totalResolvedCount = bankComparison.reduce((s, b) => s + b.resolvedCount, 0);
    // Çözümlenme oranı düşükse "gerçekleşen kesinti" rakamı dönemin küçük bir
    // kısmını yansıtır ve "beklenen"le kıyaslanması yanıltıcı olur — bu
    // durumda henüz gerçekleşmemiş kabul edip yalnızca beklenen tutarı gösteririz.
    const hasActualData = totalPaymentCount > 0 && totalResolvedCount / totalPaymentCount >= 0.5;
    // Her bankanın "fark"ı zaten yalnızca çözümlenmiş işlemler üzerinden
    // hesaplanmıştı (bkz. getBankComparison) — burada onları toplarız, tüm
    // dönemin beklenen tutarıyla yeniden karıştırmayız.
    const difference = hasActualData ? bankComparison.reduce((s, b) => s + (b.difference ?? 0), 0) : null;

    // Gelecek yıl tahmini: çözümlenen örneklemde gözlenen gerçekleşen/beklenen
    // oranını tüm dönemin beklenen tutarına uygularız — ham (eksik
    // çözümlenmiş) gerçekleşen toplamı doğrudan kullanmak dönemi olduğundan
    // düşük gösterirdi.
    const expectedDeductionForResolvedTotal = bankComparison.reduce(
      (s, b) => s + b.expectedDeductionForResolvedTotal,
      0,
    );
    const varianceRatio =
      hasActualData && expectedDeductionForResolvedTotal > 0 ? actualDeductionTotal / expectedDeductionForResolvedTotal : 1;

    const ratesWithVolume = bankComparison.filter((b) => b.grossTotal > 0);
    const distinctRates = new Set(ratesWithVolume.map((b) => b.bankId)).size > 1;
    const highestRateBank = distinctRates ? ratesWithVolume.reduce((a, b) => (b.avgRate > a.avgRate ? b : a)) : null;
    const lowestRateBank = distinctRates ? ratesWithVolume.reduce((a, b) => (b.avgRate < a.avgRate ? b : a)) : null;

    const feesToNegotiate = bankComparison.filter((b) => b.fixedFeeTotal > 0);
    const valorImprovementCandidates = bankComparison.filter((b) => b.avgValorDays > 1);

    return {
      company: { name: company.shortName ?? company.name ?? company.phone, banks: bankComparison.map((b) => b.bankName) },
      periodStart: range.start,
      periodEnd: range.end,
      grossTotal,
      expectedDeductionTotal,
      actualDeductionTotal: hasActualData ? actualDeductionTotal : null,
      difference,
      bankComparison,
      posComparison,
      forecastNextYear: expectedDeductionTotal * varianceRatio,
      negotiation: {
        rateRange: highestRateBank && lowestRateBank ? { highestRateBank, lowestRateBank } : null,
        feesToNegotiate,
        valorImprovementCandidates,
        volumeCommitmentRisks: commitments.map((c) => ({
          bankName: c.tariffVersion.bank.name,
          posName: c.tariffVersion.pos.name,
          monthlyVolumeCommitment: Number(c.monthlyVolumeCommitment),
          breachPenalty: c.breachPenalty ? Number(c.breachPenalty) : null,
        })),
      },
      tariffVersions: tariffVersions.map((t) => ({
        bankName: t.bank.name,
        posName: t.pos.name,
        versionNumber: t.versionNumber,
        campaignName: t.campaignName,
        status: t.status,
        startDate: t.startDate,
        endDate: t.endDate,
      })),
    };
  },

  /** 7. Sözleşme analiz özeti — bkz. Aşama 10. */
  async getContractAnalysisSummary(ctx: TenantContext) {
    const contracts = await prisma.contract.findMany({
      where: { companyId: ctx.companyId, deletedAt: null, analysis: { isNot: null } },
      include: { bank: true, pos: true, analysis: { include: { risks: true } } },
      orderBy: { createdAt: "desc" },
    });

    return contracts.map((c) => ({
      id: c.id,
      title: c.title,
      bankName: c.bank?.name ?? null,
      posName: c.pos?.name ?? null,
      status: c.status,
      summary60s: c.analysis!.summary60s,
      confidenceScore: c.analysis!.confidenceScore,
      criticalRiskCount: c.analysis!.risks.filter((r) => r.severity === "HIGH").length,
      totalRiskCount: c.analysis!.risks.length,
      analyzedAt: c.analysis!.createdAt,
    }));
  },

  /**
   * Rapor görüntülemesini kaydeder — Aşama 15'teki "Son rapor" alanı bu
   * tabloya dayanır. Her sayfa yüklemesinde HTML formatıyla loglanır; PDF
   * (yazdırma) ve CSV indirmeleri ayrı bir istemci olayı gerektirdiğinden
   * şimdilik loglanmıyor.
   */
  logGenerated(ctx: TenantContext, type: ReportType, periodStart: Date, periodEnd: Date, format: ReportFormat = "HTML") {
    return prisma.report.create({
      data: {
        companyId: ctx.companyId,
        type,
        format,
        periodStart,
        periodEnd,
        createdById: ctx.companyUserId,
      },
    });
  },
};
