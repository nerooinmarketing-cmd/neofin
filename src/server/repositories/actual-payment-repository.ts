import Decimal from "decimal.js";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { TenantContext } from "@/server/tenant-context";
import { NotFoundError } from "@/server/errors";
import { comparePayment } from "@/lib/payment-comparison";
import { StaticTurkishHolidayCalendar } from "@/lib/tariff-engine";

const holidayCalendar = new StaticTurkishHolidayCalendar();
const DEFAULT_ROUNDING_TOLERANCE = new Decimal(1);

export interface RecordActualPaymentInput {
  expectedPaymentId: string;
  receivedAmount: number;
  receivedDate: Date;
  bankDescription?: string;
  documentUrl?: string;
  roundingTolerance?: number;
}

export const actualPaymentRepository = {
  listRecent(ctx: TenantContext, take = 50) {
    return prisma.actualPayment.findMany({
      where: { companyId: ctx.companyId },
      include: {
        expectedPayment: { include: { bank: true, pos: true } },
        paymentDifferences: true,
      },
      orderBy: { createdAt: "desc" },
      take,
    });
  },

  async record(ctx: TenantContext, input: RecordActualPaymentInput) {
    const expectedPayment = await prisma.expectedPayment.findFirst({
      where: { id: input.expectedPaymentId, companyId: ctx.companyId },
    });
    if (!expectedPayment) throw new NotFoundError("ExpectedPayment", input.expectedPaymentId);

    const tolerance = input.roundingTolerance
      ? new Decimal(input.roundingTolerance)
      : DEFAULT_ROUNDING_TOLERANCE;

    const comparison = comparePayment(
      {
        expectedNet: new Decimal(expectedPayment.expectedNet.toString()),
        actualAmount: new Decimal(input.receivedAmount),
        expectedPaymentDate: expectedPayment.expectedPaymentDate,
        receivedDate: input.receivedDate,
        roundingTolerance: tolerance,
        grossAmount: new Decimal(expectedPayment.grossAmount.toString()),
      },
      holidayCalendar,
    );

    return prisma.$transaction(async (tx) => {
      const actualPayment = await tx.actualPayment.create({
        data: {
          companyId: ctx.companyId,
          expectedPaymentId: expectedPayment.id,
          receivedAmount: input.receivedAmount,
          receivedDate: input.receivedDate,
          bankDescription: input.bankDescription,
          documentUrl: input.documentUrl,
          createdById: ctx.companyUserId,
        },
      });

      const paymentDifference = await tx.paymentDifference.create({
        data: {
          companyId: ctx.companyId,
          expectedPaymentId: expectedPayment.id,
          actualPaymentId: actualPayment.id,
          tariffVersionId: expectedPayment.tariffVersionId,
          differenceAmount: comparison.differenceAmount.toFixed(2),
          differencePercentage: comparison.differencePercentage.toFixed(3),
          delayDays: comparison.delayDays,
          estimatedAppliedRate: comparison.estimatedAppliedRate?.toFixed(3),
          roundingTolerance: tolerance.toFixed(2),
          status: comparison.status,
          ruleExplanations: comparison.ruleExplanation as unknown as Prisma.InputJsonValue,
          createdById: ctx.companyUserId,
        },
      });

      const newExpectedStatus =
        comparison.status === "PARTIALLY_PAID"
          ? "PARTIALLY_PAID"
          : comparison.status === "NEEDS_REVIEW" || comparison.status === "DIFFERENCE_FOUND"
            ? "DIFFERENCE_FOUND"
            : "FULLY_PAID";

      await tx.expectedPayment.update({
        where: { id: expectedPayment.id },
        data: { status: newExpectedStatus },
      });

      await tx.auditLog.create({
        data: {
          companyId: ctx.companyId,
          actorType: "USER",
          actorUserId: ctx.companyUserId,
          action: "ACTUAL_PAYMENT_RECORD",
          entityType: "ActualPayment",
          entityId: actualPayment.id,
          after: {
            expectedPaymentId: expectedPayment.id,
            status: comparison.status,
            differenceAmount: comparison.differenceAmount.toFixed(2),
          },
        },
      });

      return { actualPayment, paymentDifference, comparison };
    });
  },
};
