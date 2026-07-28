import { prisma } from "@/lib/prisma";
import type { TenantContext } from "@/server/tenant-context";
import type { StatusTone } from "@/components/shared/status-badge";
import { NotFoundError } from "@/server/errors";
import { currentMonthRange } from "@/server/reporting/date-ranges";
import { notificationService } from "@/server/notifications/notification-service";

export interface CreateBankInput {
  name: string;
  branchName?: string;
  customerNumber?: string;
  note?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export interface BankStats {
  activePosCount: number;
  monthlyRevenue: number;
  avgCommissionRate: number;
  pendingPayment: number;
  status: { label: string; tone: StatusTone };
}

export const bankRepository = {
  listActive(ctx: TenantContext) {
    return prisma.bank.findMany({
      where: { companyId: ctx.companyId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  },

  async getByIdOrThrow(ctx: TenantContext, id: string) {
    const bank = await prisma.bank.findFirst({
      where: { id, companyId: ctx.companyId, deletedAt: null },
      include: { contacts: { where: { deletedAt: null } } },
    });
    if (!bank) throw new NotFoundError("Bank", id);
    return bank;
  },

  /** BankCard'daki özet rakamlar — gerçek işlem verisi yoksa sıfır döner. */
  async getStats(ctx: TenantContext, bankId: string): Promise<BankStats> {
    const { start, end } = currentMonthRange();

    const [activePosCount, monthlyAgg, pendingAgg, activeTariffRates, reviewCount] =
      await Promise.all([
        prisma.posDevice.count({
          where: { companyId: ctx.companyId, bankId, deletedAt: null, isActive: true },
        }),
        prisma.expectedPayment.aggregate({
          where: { companyId: ctx.companyId, bankId, saleDate: { gte: start, lte: end } },
          _sum: { grossAmount: true },
        }),
        prisma.expectedPayment.aggregate({
          where: {
            companyId: ctx.companyId,
            bankId,
            status: { in: ["WAITING", "DUE_TODAY", "DELAYED", "PARTIALLY_PAID"] },
          },
          _sum: { expectedNet: true },
        }),
        prisma.tariffSinglePaymentRate.findMany({
          where: { tariffVersion: { companyId: ctx.companyId, bankId, status: "ACTIVE" } },
          select: { nextDayRate: true },
        }),
        prisma.paymentDifference.count({
          where: {
            companyId: ctx.companyId,
            expectedPayment: { bankId },
            status: { in: ["NEEDS_REVIEW", "DIFFERENCE_FOUND"] },
          },
        }),
      ]);

    const avgCommissionRate =
      activeTariffRates.length > 0
        ? activeTariffRates.reduce((sum, r) => sum + Number(r.nextDayRate), 0) /
          activeTariffRates.length
        : 0;

    const status: BankStats["status"] =
      reviewCount > 0
        ? { label: "Kontrol edilmeli", tone: "warning" }
        : activePosCount === 0
          ? { label: "Veri yok", tone: "neutral" }
          : { label: "Uyumlu", tone: "success" };

    return {
      activePosCount,
      monthlyRevenue: Number(monthlyAgg._sum.grossAmount ?? 0),
      avgCommissionRate,
      pendingPayment: Number(pendingAgg._sum.expectedNet ?? 0),
      status,
    };
  },

  async listWithStats(ctx: TenantContext) {
    const banks = await this.listActive(ctx);
    return Promise.all(
      banks.map(async (bank) => ({ bank, stats: await this.getStats(ctx, bank.id) })),
    );
  },

  create(ctx: TenantContext, input: CreateBankInput) {
    return prisma.$transaction(async (tx) => {
      const bank = await tx.bank.create({
        data: {
          companyId: ctx.companyId,
          name: input.name,
          branchName: input.branchName,
          customerNumber: input.customerNumber,
          note: input.note,
          createdById: ctx.companyUserId,
          contacts: input.contactName
            ? {
                create: {
                  name: input.contactName,
                  phone: input.contactPhone,
                  email: input.contactEmail,
                  isPrimary: true,
                  createdById: ctx.companyUserId,
                },
              }
            : undefined,
        },
      });

      await tx.auditLog.create({
        data: {
          companyId: ctx.companyId,
          actorType: "USER",
          actorUserId: ctx.companyUserId,
          action: "BANK_CREATE",
          entityType: "Bank",
          entityId: bank.id,
          after: { name: bank.name },
        },
      });

      return bank;
    });
  },

  async deactivate(ctx: TenantContext, id: string) {
    const existing = await this.getByIdOrThrow(ctx, id);

    const bank = await prisma.$transaction(async (tx) => {
      const bank = await tx.bank.update({
        where: { id },
        data: { isActive: false, deletedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          companyId: ctx.companyId,
          actorType: "USER",
          actorUserId: ctx.companyUserId,
          action: "BANK_DEACTIVATE",
          entityType: "Bank",
          entityId: bank.id,
          before: { isActive: true },
          after: { isActive: false },
        },
      });

      return bank;
    });

    const actor = await prisma.companyUser.findUnique({ where: { id: ctx.companyUserId } });
    await notificationService.notifyCriticalSettingChange(
      ctx,
      actor?.name ?? "Bir kullanıcı",
      `"${existing.name}" bankasını pasife alma`,
    );

    return bank;
  },
};
