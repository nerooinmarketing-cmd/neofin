import { prisma } from "@/lib/prisma";
import type { PosType } from "@/generated/prisma/enums";
import type { TenantContext } from "@/server/tenant-context";
import type { StatusTone } from "@/components/shared/status-badge";
import { NotFoundError } from "@/server/errors";
import { currentMonthRange } from "@/server/reporting/date-ranges";
import { notificationService } from "@/server/notifications/notification-service";

export interface CreatePosDeviceInput {
  branchId: string;
  bankId: string;
  name: string;
  terminalNo: string;
  merchantNo: string;
  type: PosType;
}

/**
 * Reference implementation of the repository pattern used across the app:
 * every query is filtered by `companyId` from the tenant context — never by
 * id alone — and every mutation writes an AuditLog row in the same
 * transaction. Copy this shape for the other entity repositories.
 */
export interface PosStats {
  activeTariffName: string | null;
  lastTransactionDate: Date | null;
  monthlyRevenue: number;
  monthlyDeduction: number;
  status: { label: string; tone: StatusTone };
}

export const posDeviceRepository = {
  listActive(ctx: TenantContext) {
    return prisma.posDevice.findMany({
      where: { companyId: ctx.companyId, deletedAt: null },
      include: { bank: true, branch: true },
      orderBy: { createdAt: "desc" },
    });
  },

  listByBank(ctx: TenantContext, bankId: string) {
    return prisma.posDevice.findMany({
      where: { companyId: ctx.companyId, bankId, deletedAt: null },
      include: { branch: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async getStats(ctx: TenantContext, posId: string): Promise<PosStats> {
    const { start, end } = currentMonthRange();

    const [activeTariff, lastSale, monthlyAgg] = await Promise.all([
      prisma.tariffVersion.findFirst({
        where: { companyId: ctx.companyId, posId, status: "ACTIVE" },
        orderBy: { versionNumber: "desc" },
      }),
      prisma.dailySale.findFirst({
        where: { companyId: ctx.companyId, posId },
        orderBy: { saleDate: "desc" },
      }),
      prisma.expectedPayment.aggregate({
        where: { companyId: ctx.companyId, posId, saleDate: { gte: start, lte: end } },
        _sum: { grossAmount: true, expectedDeduction: true },
      }),
    ]);

    const status: PosStats["status"] = !activeTariff
      ? { label: "Tarife yok", tone: "neutral" }
      : { label: "Aktif", tone: "success" };

    return {
      activeTariffName: activeTariff?.campaignName ?? (activeTariff ? "Standart Tarife" : null),
      lastTransactionDate: lastSale?.saleDate ?? null,
      monthlyRevenue: Number(monthlyAgg._sum.grossAmount ?? 0),
      monthlyDeduction: Number(monthlyAgg._sum.expectedDeduction ?? 0),
      status,
    };
  },

  async listByBankWithStats(ctx: TenantContext, bankId: string) {
    const devices = await this.listByBank(ctx, bankId);
    return Promise.all(
      devices.map(async (pos) => ({ pos, stats: await this.getStats(ctx, pos.id) })),
    );
  },

  async getByIdOrThrow(ctx: TenantContext, id: string) {
    const pos = await prisma.posDevice.findFirst({
      where: { id, companyId: ctx.companyId, deletedAt: null },
      include: { bank: true, branch: true },
    });
    if (!pos) throw new NotFoundError("PosDevice", id);
    return pos;
  },

  create(ctx: TenantContext, input: CreatePosDeviceInput) {
    return prisma.$transaction(async (tx) => {
      const pos = await tx.posDevice.create({
        data: {
          companyId: ctx.companyId,
          branchId: input.branchId,
          bankId: input.bankId,
          name: input.name,
          terminalNo: input.terminalNo,
          merchantNo: input.merchantNo,
          type: input.type,
          createdById: ctx.companyUserId,
        },
      });

      await tx.auditLog.create({
        data: {
          companyId: ctx.companyId,
          actorType: "USER",
          actorUserId: ctx.companyUserId,
          action: "POS_DEVICE_CREATE",
          entityType: "PosDevice",
          entityId: pos.id,
          after: { name: pos.name, terminalNo: pos.terminalNo },
        },
      });

      return pos;
    });
  },

  /** "Silme yerine pasife alma": kayıt asla veritabanından silinmez. */
  async deactivate(ctx: TenantContext, id: string) {
    const existing = await this.getByIdOrThrow(ctx, id); // tenant sahipliğini doğrula

    const pos = await prisma.$transaction(async (tx) => {
      const pos = await tx.posDevice.update({
        where: { id },
        data: { isActive: false, deletedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          companyId: ctx.companyId,
          actorType: "USER",
          actorUserId: ctx.companyUserId,
          action: "POS_DEVICE_DEACTIVATE",
          entityType: "PosDevice",
          entityId: pos.id,
          before: { isActive: true },
          after: { isActive: false },
        },
      });

      return pos;
    });

    const actor = await prisma.companyUser.findUnique({ where: { id: ctx.companyUserId } });
    await notificationService.notifyCriticalSettingChange(
      ctx,
      actor?.name ?? "Bir kullanıcı",
      `"${existing.name}" POS'unu pasife alma`,
    );

    return pos;
  },
};
