import { prisma } from "@/lib/prisma";
import type { TenantContext } from "@/server/tenant-context";
import { currentMonthRange, endOfDay, startOfDay } from "@/server/reporting/date-ranges";
import { statusFromDifference } from "@/server/payments/status-labels";

export interface DashboardTodayExpected {
  total: number;
  count: number;
  bankNames: string[];
}

export interface DashboardTodayActual {
  total: number;
  expectedTotal: number;
  lastUpdatedAt: Date | null;
}

export interface DashboardMonthlyDeduction {
  current: number;
  previous: number;
  percentChange: number | null;
}

export interface DashboardDifferenceSummary {
  count: number;
  totalAbs: number;
  topBank: string | null;
}

export interface DashboardAlert {
  id: string;
  tone: "warning" | "danger";
  title: string;
  createdAt: Date;
}

export interface DashboardMonthlyChartPoint {
  month: string; // "2026-07"
  label: string; // "Tem 2026"
  gross: number;
  deduction: number;
}

export interface DashboardBankCost {
  bankId: string;
  bankName: string;
  monthlyGross: number;
  monthlyDeduction: number;
}

export interface DashboardMonthlySummaryFigures {
  monthlyGross: number;
  monthlyExpectedDeduction: number;
  monthlyActualDeduction: number | null;
}

const MONTH_LABELS = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz",
  "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
];

export const dashboardRepository = {
  async getTodayExpected(ctx: TenantContext): Promise<DashboardTodayExpected> {
    const now = new Date();
    const payments = await prisma.expectedPayment.findMany({
      where: {
        companyId: ctx.companyId,
        expectedPaymentDate: { gte: startOfDay(now), lte: endOfDay(now) },
      },
      include: { bank: true },
    });

    const total = payments.reduce((sum, p) => sum + Number(p.expectedNet), 0);
    const bankNames = [...new Set(payments.map((p) => p.bank.name))];
    return { total, count: payments.length, bankNames };
  },

  async getTodayActual(ctx: TenantContext): Promise<DashboardTodayActual> {
    const now = new Date();
    const [actuals, expected] = await Promise.all([
      prisma.actualPayment.findMany({
        where: {
          companyId: ctx.companyId,
          receivedDate: { gte: startOfDay(now), lte: endOfDay(now) },
          deletedAt: null,
        },
      }),
      prisma.expectedPayment.aggregate({
        where: {
          companyId: ctx.companyId,
          expectedPaymentDate: { gte: startOfDay(now), lte: endOfDay(now) },
        },
        _sum: { expectedNet: true },
      }),
    ]);

    const total = actuals.reduce((sum, a) => sum + Number(a.receivedAmount), 0);
    const lastUpdatedAt = actuals.length
      ? actuals.reduce((latest, a) => (a.createdAt > latest ? a.createdAt : latest), actuals[0]!.createdAt)
      : null;

    return { total, expectedTotal: Number(expected._sum.expectedNet ?? 0), lastUpdatedAt };
  },

  async getMonthlyDeduction(ctx: TenantContext): Promise<DashboardMonthlyDeduction> {
    const now = new Date();
    const { start, end } = currentMonthRange(now);
    const prevMonthAnchor = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const { start: prevStart, end: prevEnd } = currentMonthRange(prevMonthAnchor);

    const [currentAgg, prevAgg] = await Promise.all([
      prisma.expectedPayment.aggregate({
        where: { companyId: ctx.companyId, saleDate: { gte: start, lte: end } },
        _sum: { expectedDeduction: true },
      }),
      prisma.expectedPayment.aggregate({
        where: { companyId: ctx.companyId, saleDate: { gte: prevStart, lte: prevEnd } },
        _sum: { expectedDeduction: true },
      }),
    ]);

    const current = Number(currentAgg._sum.expectedDeduction ?? 0);
    const previous = Number(prevAgg._sum.expectedDeduction ?? 0);
    const percentChange = previous > 0 ? ((current - previous) / previous) * 100 : null;

    return { current, previous, percentChange };
  },

  async getDifferencesNeedingReview(ctx: TenantContext): Promise<DashboardDifferenceSummary> {
    const differences = await prisma.paymentDifference.findMany({
      where: {
        companyId: ctx.companyId,
        status: { in: ["NEEDS_REVIEW", "DIFFERENCE_FOUND", "PARTIALLY_PAID"] },
      },
      include: { expectedPayment: { include: { bank: true } } },
    });

    const totalAbs = differences.reduce((sum, d) => sum + Math.abs(Number(d.differenceAmount)), 0);
    const byBank = new Map<string, number>();
    for (const d of differences) {
      const name = d.expectedPayment.bank.name;
      byBank.set(name, (byBank.get(name) ?? 0) + Math.abs(Number(d.differenceAmount)));
    }

    let topBank: string | null = null;
    let topAmount = -1;
    for (const [name, amount] of byBank) {
      if (amount > topAmount) {
        topAmount = amount;
        topBank = name;
      }
    }

    return { count: differences.length, totalAbs, topBank };
  },

  async getPendingPayments(ctx: TenantContext, limit = 4) {
    const payments = await prisma.expectedPayment.findMany({
      where: { companyId: ctx.companyId, actualPayments: { none: {} } },
      include: { bank: true, pos: true },
      orderBy: { expectedPaymentDate: "asc" },
      take: limit,
    });

    const now = new Date();
    return payments.map((payment) => {
      const today = startOfDay(now);
      const due = startOfDay(payment.expectedPaymentDate);
      const displayStatus =
        due < today
          ? { label: "Gecikti", tone: "danger" as const }
          : due.getTime() === today.getTime()
            ? { label: "Bugün yatmalı", tone: "warning" as const }
            : { label: "Bekleniyor", tone: "info" as const };
      return { payment, displayStatus };
    });
  },

  async getRecentAlerts(ctx: TenantContext, limit = 5): Promise<DashboardAlert[]> {
    const [differences, posWithoutTariff, overdue] = await Promise.all([
      prisma.paymentDifference.findMany({
        where: {
          companyId: ctx.companyId,
          status: { in: ["NEEDS_REVIEW", "DIFFERENCE_FOUND", "PARTIALLY_PAID"] },
        },
        include: { expectedPayment: { include: { bank: true, pos: true } } },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.posDevice.findMany({
        where: {
          companyId: ctx.companyId,
          deletedAt: null,
          isActive: true,
          tariffVersions: { none: { status: "ACTIVE" } },
        },
        take: limit,
      }),
      prisma.expectedPayment.findMany({
        where: {
          companyId: ctx.companyId,
          expectedPaymentDate: { lt: startOfDay(new Date()) },
          actualPayments: { none: {} },
        },
        include: { bank: true },
        orderBy: { expectedPaymentDate: "asc" },
        take: limit,
      }),
    ]);

    const alerts: DashboardAlert[] = [];

    for (const d of differences) {
      const status = statusFromDifference(d.status);
      alerts.push({
        id: `diff-${d.id}`,
        tone: status.tone === "danger" ? "danger" : "warning",
        title: `${d.expectedPayment.bank.name} — ${d.expectedPayment.pos.name}: kayıtlı koşullarla beklenen tutar arasında ${Math.abs(Number(d.differenceAmount)).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL fark var`,
        createdAt: d.createdAt,
      });
    }

    for (const pos of posWithoutTariff) {
      alerts.push({
        id: `pos-${pos.id}`,
        tone: "warning",
        title: `${pos.name} için aktif tarife bulunmuyor — gün sonu hesaplaması yapılamıyor`,
        createdAt: pos.updatedAt,
      });
    }

    for (const p of overdue) {
      alerts.push({
        id: `overdue-${p.id}`,
        tone: "danger",
        title: `${p.bank.name}: ${p.expectedPaymentDate.toLocaleDateString("tr-TR")} tarihli beklenen ödeme henüz hesaba geçmedi`,
        createdAt: p.expectedPaymentDate,
      });
    }

    return alerts
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  },

  async getMonthlyChartData(ctx: TenantContext, months = 6): Promise<DashboardMonthlyChartPoint[]> {
    const now = new Date();
    const anchors = Array.from({ length: months }, (_, i) => {
      const offset = months - 1 - i;
      return new Date(now.getFullYear(), now.getMonth() - offset, 1);
    });

    const results = await Promise.all(
      anchors.map(async (anchor) => {
        const { start, end } = currentMonthRange(anchor);
        const agg = await prisma.expectedPayment.aggregate({
          where: { companyId: ctx.companyId, saleDate: { gte: start, lte: end } },
          _sum: { grossAmount: true, expectedDeduction: true },
        });
        return {
          month: `${anchor.getFullYear()}-${String(anchor.getMonth() + 1).padStart(2, "0")}`,
          label: `${MONTH_LABELS[anchor.getMonth()]} ${anchor.getFullYear()}`,
          gross: Number(agg._sum.grossAmount ?? 0),
          deduction: Number(agg._sum.expectedDeduction ?? 0),
        };
      }),
    );

    return results;
  },

  async getMonthlySummaryFigures(ctx: TenantContext): Promise<DashboardMonthlySummaryFigures> {
    const { start, end } = currentMonthRange(new Date());

    const [expectedAgg, resolvedPayments] = await Promise.all([
      prisma.expectedPayment.aggregate({
        where: { companyId: ctx.companyId, saleDate: { gte: start, lte: end } },
        _sum: { grossAmount: true, expectedDeduction: true },
      }),
      prisma.expectedPayment.findMany({
        where: {
          companyId: ctx.companyId,
          saleDate: { gte: start, lte: end },
          actualPayments: { some: {} },
        },
        include: { actualPayments: { orderBy: { createdAt: "desc" }, take: 1 } },
      }),
    ]);

    const hasResolved = resolvedPayments.length > 0;
    const monthlyActualDeduction = hasResolved
      ? resolvedPayments.reduce((sum, p) => {
          const actual = p.actualPayments[0];
          if (!actual) return sum;
          return sum + (Number(p.grossAmount) - Number(actual.receivedAmount));
        }, 0)
      : null;

    return {
      monthlyGross: Number(expectedAgg._sum.grossAmount ?? 0),
      monthlyExpectedDeduction: Number(expectedAgg._sum.expectedDeduction ?? 0),
      monthlyActualDeduction,
    };
  },

  async getBankCostSummary(ctx: TenantContext): Promise<DashboardBankCost[]> {
    const now = new Date();
    const { start, end } = currentMonthRange(now);
    const banks = await prisma.bank.findMany({
      where: { companyId: ctx.companyId, deletedAt: null },
    });

    const results = await Promise.all(
      banks.map(async (bank) => {
        const agg = await prisma.expectedPayment.aggregate({
          where: { companyId: ctx.companyId, bankId: bank.id, saleDate: { gte: start, lte: end } },
          _sum: { grossAmount: true, expectedDeduction: true },
        });
        return {
          bankId: bank.id,
          bankName: bank.name,
          monthlyGross: Number(agg._sum.grossAmount ?? 0),
          monthlyDeduction: Number(agg._sum.expectedDeduction ?? 0),
        };
      }),
    );

    return results
      .filter((b) => b.monthlyGross > 0 || b.monthlyDeduction > 0)
      .sort((a, b) => b.monthlyDeduction - a.monthlyDeduction);
  },
};
