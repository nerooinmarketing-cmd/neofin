import type { NotificationChannel, NotificationType } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { TenantContext } from "@/server/tenant-context";

export interface CreateNotificationInput {
  companyUserId: string | null;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  idempotencyKey: string;
}

export interface NotificationPreferenceInput {
  enabledTypes?: Partial<Record<NotificationType, boolean>>;
  dailySummaryHour?: number | null;
  quietHoursStart?: number | null;
  quietHoursEnd?: number | null;
}

export const notificationRepository = {
  listForCompany(ctx: TenantContext, take = 50) {
    return prisma.notification.findMany({
      where: { companyId: ctx.companyId },
      orderBy: { createdAt: "desc" },
      take,
    });
  },

  /**
   * `idempotencyKey` üzerinden atomik "yoksa oluştur" — aynı olay için
   * tekrar bildirim oluşturulmasını engeller. Notification'da ilişkili
   * (nested) yazma olmadığından `upsert` tek bir atomik SQL ifadesine
   * indirgenir (bkz. contract-repository.ts'teki P2002 yarış durumu notu —
   * o durumda nested create vardı, burada yok).
   */
  createIfNotExists(ctx: TenantContext, input: CreateNotificationInput) {
    return prisma.notification.upsert({
      where: { idempotencyKey: input.idempotencyKey },
      create: {
        companyId: ctx.companyId,
        companyUserId: input.companyUserId,
        type: input.type,
        channel: input.channel,
        title: input.title,
        body: input.body,
        relatedEntityType: input.relatedEntityType,
        relatedEntityId: input.relatedEntityId,
        idempotencyKey: input.idempotencyKey,
      },
      update: {},
    });
  },

  markSent(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { status: "SENT", sentAt: new Date() },
    });
  },

  markFailed(id: string, error: string) {
    return prisma.notification.update({
      where: { id },
      data: { status: "FAILED", lastError: error, attemptCount: { increment: 1 } },
    });
  },

  /** "Daha Sonra Hatırlat" — durumu PENDING'de tutar, belirtilen zamana kadar tekrar gönderilmez. */
  snooze(id: string, until: Date) {
    return prisma.notification.update({
      where: { id },
      data: { snoozedUntil: until, status: "PENDING" },
    });
  },

  async markRead(ctx: TenantContext, id: string) {
    const result = await prisma.notification.updateMany({
      where: { id, companyId: ctx.companyId },
      data: { status: "READ" },
    });
    return result.count > 0;
  },

  getPreference(companyUserId: string) {
    return prisma.notificationPreference.findUnique({ where: { companyUserId } });
  },

  upsertPreference(companyUserId: string, input: NotificationPreferenceInput) {
    return prisma.notificationPreference.upsert({
      where: { companyUserId },
      create: {
        companyUserId,
        enabledTypes: input.enabledTypes as unknown as Prisma.InputJsonValue,
        dailySummaryHour: input.dailySummaryHour,
        quietHoursStart: input.quietHoursStart,
        quietHoursEnd: input.quietHoursEnd,
      },
      update: {
        enabledTypes: input.enabledTypes as unknown as Prisma.InputJsonValue,
        dailySummaryHour: input.dailySummaryHour,
        quietHoursStart: input.quietHoursStart,
        quietHoursEnd: input.quietHoursEnd,
      },
    });
  },
};
