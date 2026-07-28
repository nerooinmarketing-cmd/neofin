import { prisma } from "@/lib/prisma";
import type { TenantContext } from "@/server/tenant-context";
import type { StatusTone } from "@/components/shared/status-badge";
import { NotFoundError } from "@/server/errors";
import { currentWeekRange, endOfDay, startOfDay } from "@/server/reporting/date-ranges";
import { statusFromDifference } from "@/server/payments/status-labels";

export type ExpectedPaymentRangeFilter = "today" | "tomorrow" | "week" | "overdue" | "all";

export interface ExpectedPaymentFilters {
  range?: ExpectedPaymentRangeFilter;
  bankId?: string;
  posId?: string;
  branchId?: string;
}

function statusFromDate(expectedPaymentDate: Date, now: Date): { label: string; tone: StatusTone } {
  const today = startOfDay(now);
  const due = startOfDay(expectedPaymentDate);
  if (due < today) return { label: "Gecikti", tone: "danger" };
  if (due.getTime() === today.getTime()) return { label: "Bugün yatmalı", tone: "warning" };
  return { label: "Bekleniyor", tone: "info" };
}

export const expectedPaymentRepository = {
  async listWithFilters(ctx: TenantContext, filters: ExpectedPaymentFilters) {
    const now = new Date();
    const where: Record<string, unknown> = { companyId: ctx.companyId };

    if (filters.bankId) where.bankId = filters.bankId;
    if (filters.posId) where.posId = filters.posId;
    if (filters.branchId) where.branchId = filters.branchId;

    if (filters.range === "today") {
      where.expectedPaymentDate = { gte: startOfDay(now), lte: endOfDay(now) };
    } else if (filters.range === "tomorrow") {
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      where.expectedPaymentDate = { gte: startOfDay(tomorrow), lte: endOfDay(tomorrow) };
    } else if (filters.range === "week") {
      const { start, end } = currentWeekRange(now);
      where.expectedPaymentDate = { gte: start, lte: end };
    } else if (filters.range === "overdue") {
      where.expectedPaymentDate = { lt: startOfDay(now) };
      where.actualPayments = { none: {} };
    }

    const payments = await prisma.expectedPayment.findMany({
      where,
      include: {
        bank: true,
        pos: true,
        actualPayments: {
          include: { paymentDifferences: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { expectedPaymentDate: "asc" },
    });

    return payments.map((payment) => {
      const latestActual = payment.actualPayments[0];
      const latestDifference = latestActual?.paymentDifferences[0];
      const displayStatus = latestDifference
        ? statusFromDifference(latestDifference.status)
        : statusFromDate(payment.expectedPaymentDate, now);

      return {
        payment,
        isResolved: Boolean(latestActual),
        displayStatus,
      };
    });
  },

  async getByIdOrThrow(ctx: TenantContext, id: string) {
    const payment = await prisma.expectedPayment.findFirst({
      where: { id, companyId: ctx.companyId },
      include: { bank: true, pos: true, branch: true, tariffVersion: true },
    });
    if (!payment) throw new NotFoundError("ExpectedPayment", id);
    return payment;
  },
};
