import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";
import type { TenantContext } from "@/server/tenant-context";
import { tariffRepository } from "@/server/repositories/tariff-repository";
import { toTariffForCalculation } from "@/server/tariff/to-calculation-input";
import { isSameCalendarDay } from "@/server/reporting/date-ranges";
import {
  MissingTariffError,
  StaticTurkishHolidayCalendar,
  summarizeDailySale,
  type SaleLineInput,
  type SaleTransactionType,
} from "@/lib/tariff-engine";

const holidayCalendar = new StaticTurkishHolidayCalendar();

export interface DailySaleLineInput {
  transactionType: SaleTransactionType;
  installmentCount?: number;
  amount: number;
  transactionCount: number;
  cardType?: string;
  note?: string;
}

export interface DailySaleContextInput {
  branchId: string;
  bankId: string;
  posId: string;
  saleDate: Date;
  lines: DailySaleLineInput[];
}

async function resolveTariff(ctx: TenantContext, posId: string, saleDate: Date) {
  const version = await tariffRepository.findVersionForDate(ctx, posId, saleDate);
  if (!version) throw new MissingTariffError();
  return { version, calcInput: toTariffForCalculation(version) };
}

function toEngineLines(lines: DailySaleLineInput[]): SaleLineInput[] {
  return lines.map((line) => ({
    transactionType: line.transactionType,
    installmentCount: line.installmentCount,
    amount: new Decimal(line.amount),
    transactionCount: line.transactionCount,
  }));
}

export const dailySaleRepository = {
  /** "Varsayılan olarak son kullanılan POS seçili gelsin" (UX §10.1) */
  async getLastUsedPosId(ctx: TenantContext): Promise<string | null> {
    const last = await prisma.dailySale.findFirst({
      where: { companyId: ctx.companyId },
      orderBy: { createdAt: "desc" },
      select: { posId: true },
    });
    return last?.posId ?? null;
  },

  /** "Hesapla" önizlemesi — hiçbir şey kaydetmez. */
  async preview(ctx: TenantContext, input: Pick<DailySaleContextInput, "posId" | "saleDate" | "lines">) {
    const { version, calcInput } = await resolveTariff(ctx, input.posId, input.saleDate);
    const summary = summarizeDailySale(
      toEngineLines(input.lines),
      calcInput,
      input.saleDate,
      holidayCalendar,
    );
    return { summary, tariffVersion: version };
  },

  async create(ctx: TenantContext, input: DailySaleContextInput) {
    const { version, calcInput } = await resolveTariff(ctx, input.posId, input.saleDate);
    const summary = summarizeDailySale(
      toEngineLines(input.lines),
      calcInput,
      input.saleDate,
      holidayCalendar,
    );

    return prisma.$transaction(async (tx) => {
      const dailySale = await tx.dailySale.create({
        data: {
          companyId: ctx.companyId,
          branchId: input.branchId,
          bankId: input.bankId,
          posId: input.posId,
          tariffVersionId: version.id,
          saleDate: input.saleDate,
          createdById: ctx.companyUserId,
        },
      });

      const createdItems = [];
      const now = new Date();

      for (let i = 0; i < input.lines.length; i++) {
        const line = input.lines[i]!;
        const calcResult = summary.lines[i]!;

        const item = await tx.dailySaleItem.create({
          data: {
            dailySaleId: dailySale.id,
            transactionType: line.transactionType,
            installmentCount: line.installmentCount,
            amount: line.amount,
            transactionCount: line.transactionCount,
            cardType: line.cardType,
            note: line.note,
          },
        });
        createdItems.push(item);

        if (calcResult.generatesExpectedPayment) {
          const isToday = isSameCalendarDay(calcResult.expectedPaymentDate, now);
          await tx.expectedPayment.create({
            data: {
              companyId: ctx.companyId,
              branchId: input.branchId,
              bankId: input.bankId,
              posId: input.posId,
              tariffVersionId: version.id,
              dailySaleId: dailySale.id,
              dailySaleItemId: item.id,
              saleDate: input.saleDate,
              expectedPaymentDate: calcResult.expectedPaymentDate,
              grossAmount: calcResult.grossAmount.toFixed(2),
              expectedDeduction: calcResult.expectedCommission.plus(calcResult.fixedFee).toFixed(2),
              expectedNet: calcResult.expectedNet.toFixed(2),
              status: isToday ? "DUE_TODAY" : "WAITING",
              createdById: ctx.companyUserId,
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          companyId: ctx.companyId,
          actorType: "USER",
          actorUserId: ctx.companyUserId,
          action: "DAILY_SALE_CREATE",
          entityType: "DailySale",
          entityId: dailySale.id,
          after: {
            lineCount: input.lines.length,
            grossTotal: summary.grossTotal.toFixed(2),
            tariffVersionId: version.id,
          },
        },
      });

      return { dailySale, items: createdItems, summary };
    });
  },
};
