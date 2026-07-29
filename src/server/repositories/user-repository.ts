import { prisma } from "@/lib/prisma";
import type { CompanyUserRole } from "@/generated/prisma/enums";
import type { TenantContext } from "@/server/tenant-context";
import { NotFoundError } from "@/server/errors";
import { notificationService } from "@/server/notifications/notification-service";

export interface CreateCompanyUserInput {
  name: string;
  role: CompanyUserRole;
  email?: string;
  phone?: string;
}

/** "Kritik ayarları değiştiremez" (bkz. UX §3.3) — Muhasebe personeli kullanıcı yönetemez. */
export function canManageUsers(role: CompanyUserRole): boolean {
  return role === "OWNER" || role === "MANAGER";
}

export const userRepository = {
  async list(ctx: TenantContext) {
    const [users, telegramAccounts] = await Promise.all([
      prisma.companyUser.findMany({
        where: { companyId: ctx.companyId, deletedAt: null },
        orderBy: { createdAt: "asc" },
      }),
      prisma.telegramAccount.findMany({ where: { companyId: ctx.companyId } }),
    ]);

    return users.map((user) => ({
      ...user,
      telegramLinked: telegramAccounts.some((t) => t.companyUserId === user.id),
    }));
  },

  getCurrent(ctx: TenantContext) {
    return prisma.companyUser.findFirstOrThrow({
      where: { id: ctx.companyUserId, companyId: ctx.companyId },
    });
  },

  async getByIdOrThrow(ctx: TenantContext, id: string) {
    const user = await prisma.companyUser.findFirst({
      where: { id, companyId: ctx.companyId, deletedAt: null },
    });
    if (!user) throw new NotFoundError("CompanyUser", id);
    return user;
  },

  create(ctx: TenantContext, input: CreateCompanyUserInput) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.companyUser.create({
        data: {
          companyId: ctx.companyId,
          name: input.name,
          role: input.role,
          email: input.email,
          phone: input.phone,
          createdById: ctx.companyUserId,
        },
      });

      await tx.auditLog.create({
        data: {
          companyId: ctx.companyId,
          actorType: "USER",
          actorUserId: ctx.companyUserId,
          action: "COMPANY_USER_CREATE",
          entityType: "CompanyUser",
          entityId: user.id,
          after: { name: user.name, role: user.role },
        },
      });

      return user;
    });
  },

  async setRole(ctx: TenantContext, id: string, role: CompanyUserRole) {
    const existing = await this.getByIdOrThrow(ctx, id);

    const user = await prisma.$transaction(async (tx) => {
      const updated = await tx.companyUser.update({ where: { id }, data: { role } });

      await tx.auditLog.create({
        data: {
          companyId: ctx.companyId,
          actorType: "USER",
          actorUserId: ctx.companyUserId,
          action: "COMPANY_USER_ROLE_CHANGE",
          entityType: "CompanyUser",
          entityId: id,
          before: { role: existing.role },
          after: { role },
        },
      });

      return updated;
    });

    const actor = await this.getCurrent(ctx);
    await notificationService.notifyCriticalSettingChange(
      ctx,
      actor.name,
      `"${existing.name}" kullanıcısının rolünü değiştirme`,
    );

    return user;
  },

  async deactivate(ctx: TenantContext, id: string) {
    const existing = await this.getByIdOrThrow(ctx, id);

    const user = await prisma.$transaction(async (tx) => {
      const updated = await tx.companyUser.update({
        where: { id },
        data: { isActive: false, deletedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          companyId: ctx.companyId,
          actorType: "USER",
          actorUserId: ctx.companyUserId,
          action: "COMPANY_USER_DEACTIVATE",
          entityType: "CompanyUser",
          entityId: id,
          before: { isActive: true },
          after: { isActive: false },
        },
      });

      return updated;
    });

    const actor = await this.getCurrent(ctx);
    await notificationService.notifyCriticalSettingChange(
      ctx,
      actor.name,
      `"${existing.name}" kullanıcısını pasife alma`,
    );

    return user;
  },
};
