import { prisma } from "@/lib/prisma";
import type { TenantContext } from "@/server/tenant-context";
import {
  buildNotificationContent,
  isRoleAllowed,
  isWithinQuietHours,
  type NotificationContext,
} from "@/lib/notifications";
import { notificationRepository } from "@/server/repositories/notification-repository";
import { telegramBotClient, type InlineKeyboardMarkup } from "@/server/telegram/bot-client";
import { startOfDay, endOfDay, currentMonthRange } from "@/server/reporting/date-ranges";
import { countBusinessDaysBetween, StaticTurkishHolidayCalendar } from "@/lib/tariff-engine";
import type { NotificationType } from "@/generated/prisma/enums";

const holidayCalendar = new StaticTurkishHolidayCalendar();
const EXPIRY_WARNING_DAYS = 14;
const MAX_DELIVERY_ATTEMPTS = 5;
const DEFAULT_SNOOZE_HOURS = 3;

const PAYMENT_TYPES: NotificationType[] = [
  "PAYMENT_DUE_TOMORROW",
  "PAYMENT_DUE_TODAY",
  "PAYMENT_DELAYED",
  "PAYMENT_BELOW_EXPECTED",
];

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function buildInlineKeyboard(notification: {
  id: string;
  type: NotificationType;
  relatedEntityId: string | null;
}): InlineKeyboardMarkup {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (PAYMENT_TYPES.includes(notification.type) && notification.relatedEntityId) {
    return {
      inline_keyboard: [
        [{ text: "Ödeme Geldi", url: `${appUrl}/panel/odemeler/beklenen/${notification.relatedEntityId}/kaydet` }],
        [
          { text: "Daha Sonra Hatırlat", callback_data: `snooze:${notification.id}` },
          { text: "Paneli Aç", url: `${appUrl}/panel` },
        ],
      ],
    };
  }

  return { inline_keyboard: [[{ text: "Paneli Aç", url: `${appUrl}/panel` }]] };
}

interface TargetUser {
  id: string;
  role: "OWNER" | "MANAGER" | "ACCOUNTANT";
  telegramChatId: string | null;
}

async function getTargetUsers(companyId: string): Promise<TargetUser[]> {
  const users = await prisma.companyUser.findMany({
    where: { companyId, isActive: true, deletedAt: null },
    include: { telegramAccounts: { where: { companyId }, take: 1 } },
  });
  return users.map((u) => ({
    id: u.id,
    role: u.role,
    telegramChatId: u.telegramAccounts[0] ? u.telegramAccounts[0].telegramUserId.toString() : null,
  }));
}

/**
 * Bir bildirim türünü, ilgili varlığı ve bağlamı yetkili tüm kullanıcılar
 * için (rol bazlı) oluşturur — `idempotencyKey` sayesinde aynı gün için
 * tekrar çağrılırsa yinelenmez.
 */
async function createForEligibleUsers(
  ctx: TenantContext,
  context: NotificationContext,
  relatedEntityType: string,
  relatedEntityId: string,
  dedupeSuffix: string,
) {
  const targetUsers = await getTargetUsers(ctx.companyId);
  const content = buildNotificationContent(context);

  await Promise.all(
    targetUsers
      .filter((user) => isRoleAllowed(context.type, user.role))
      .map((user) =>
        notificationRepository.createIfNotExists(ctx, {
          companyUserId: user.id,
          type: context.type,
          channel: user.telegramChatId ? "TELEGRAM" : "IN_APP",
          title: content.title,
          body: content.body,
          relatedEntityType,
          relatedEntityId,
          idempotencyKey: `${context.type}:${relatedEntityId}:${user.id}:${dedupeSuffix}`,
        }),
      ),
  );
}

export const notificationService = {
  /**
   * Gerçek verilerden (beklenen ödemeler, tarife/kampanya bitişleri, ciro
   * taahhüdü riski) bildirim üretir. Gerçek bir zamanlayıcı (cron) altyapısı
   * yok — bu fonksiyon `/bildirimler` sayfasındaki "Kontrol Et" eylemiyle
   * veya ileride eklenecek bir zamanlayıcıyla tetiklenir.
   */
  async generate(ctx: TenantContext) {
    const now = new Date();
    const today = dateKey(now);
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const unresolvedPayments = await prisma.expectedPayment.findMany({
      where: { companyId: ctx.companyId, actualPayments: { none: {} } },
      include: { bank: true, pos: true },
    });

    for (const payment of unresolvedPayments) {
      const due = startOfDay(payment.expectedPaymentDate);
      if (due.getTime() === startOfDay(tomorrow).getTime()) {
        await createForEligibleUsers(
          ctx,
          {
            type: "PAYMENT_DUE_TOMORROW",
            bankName: payment.bank.name,
            posName: payment.pos.name,
            amount: Number(payment.expectedNet),
          },
          "ExpectedPayment",
          payment.id,
          today,
        );
      } else if (due.getTime() === startOfDay(now).getTime()) {
        await createForEligibleUsers(
          ctx,
          {
            type: "PAYMENT_DUE_TODAY",
            bankName: payment.bank.name,
            posName: payment.pos.name,
            amount: Number(payment.expectedNet),
          },
          "ExpectedPayment",
          payment.id,
          today,
        );
      } else if (due < startOfDay(now)) {
        const delayDays = countBusinessDaysBetween(payment.expectedPaymentDate, now, holidayCalendar);
        await createForEligibleUsers(
          ctx,
          {
            type: "PAYMENT_DELAYED",
            bankName: payment.bank.name,
            posName: payment.pos.name,
            amount: Number(payment.expectedNet),
            delayDays,
          },
          "ExpectedPayment",
          payment.id,
          today,
        );
      }
    }

    const recentUnderpayments = await prisma.paymentDifference.findMany({
      where: {
        companyId: ctx.companyId,
        status: "NEEDS_REVIEW",
        createdAt: { gte: startOfDay(now), lte: endOfDay(now) },
      },
      include: { expectedPayment: { include: { bank: true, pos: true } } },
    });
    for (const diff of recentUnderpayments) {
      await createForEligibleUsers(
        ctx,
        {
          type: "PAYMENT_BELOW_EXPECTED",
          bankName: diff.expectedPayment.bank.name,
          posName: diff.expectedPayment.pos.name,
          diffAmount: Math.abs(Number(diff.differenceAmount)),
        },
        "PaymentDifference",
        diff.id,
        today,
      );
    }

    const expiryHorizon = new Date(now.getFullYear(), now.getMonth(), now.getDate() + EXPIRY_WARNING_DAYS);

    const expiringTariffs = await prisma.tariffVersion.findMany({
      where: { companyId: ctx.companyId, status: "ACTIVE", endDate: { not: null, lte: expiryHorizon, gte: now } },
      include: { bank: true, pos: true },
    });
    for (const tariff of expiringTariffs) {
      await createForEligibleUsers(
        ctx,
        {
          type: "TARIFF_EXPIRING",
          bankName: tariff.bank.name,
          posName: tariff.pos.name,
          expiryDateLabel: tariff.endDate!.toLocaleDateString("tr-TR"),
        },
        "TariffVersion",
        tariff.id,
        today,
      );
    }

    const expiringCampaigns = await prisma.tariffInstallmentRate.findMany({
      where: {
        tariffVersion: { companyId: ctx.companyId, status: "ACTIVE" },
        campaignName: { not: null },
        validUntil: { not: null, lte: expiryHorizon, gte: now },
      },
      include: { tariffVersion: { include: { bank: true, pos: true } } },
    });
    for (const rate of expiringCampaigns) {
      await createForEligibleUsers(
        ctx,
        {
          type: "CAMPAIGN_EXPIRING",
          bankName: rate.tariffVersion.bank.name,
          posName: rate.tariffVersion.pos.name,
          campaignName: rate.campaignName!,
          expiryDateLabel: rate.validUntil!.toLocaleDateString("tr-TR"),
        },
        "TariffInstallmentRate",
        rate.id,
        today,
      );
    }

    const commitments = await prisma.tariffCommitment.findMany({
      where: {
        tariffVersion: { companyId: ctx.companyId, status: "ACTIVE" },
        monthlyVolumeCommitment: { not: null },
      },
      include: { tariffVersion: { include: { bank: true, pos: true } } },
    });
    const { start, end } = currentMonthRange(now);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    for (const commitment of commitments) {
      const monthlyAgg = await prisma.expectedPayment.aggregate({
        where: { companyId: ctx.companyId, posId: commitment.tariffVersion.posId, saleDate: { gte: start, lte: end } },
        _sum: { grossAmount: true },
      });
      const current = Number(monthlyAgg._sum.grossAmount ?? 0);
      const target = Number(commitment.monthlyVolumeCommitment);
      const expectedPaceRatio = dayOfMonth / daysInMonth;
      const actualPaceRatio = target > 0 ? current / target : 1;
      // Ay yarılandıktan sonra, beklenen hıza göre belirgin geride kalınıyorsa risk say.
      if (dayOfMonth >= daysInMonth / 2 && actualPaceRatio < expectedPaceRatio * 0.8) {
        await createForEligibleUsers(
          ctx,
          {
            type: "VOLUME_COMMITMENT_RISK",
            bankName: commitment.tariffVersion.bank.name,
            posName: commitment.tariffVersion.pos.name,
            currentAmount: current,
            targetAmount: target,
          },
          "TariffCommitment",
          commitment.id,
          today,
        );
      }
    }
  },

  /** Bekleyen (ve erteleme süresi geçmiş) bildirimleri tercihlere/sessiz saatlere göre gönderir. */
  async dispatch(ctx: TenantContext) {
    const notifications = await prisma.notification.findMany({
      where: {
        companyId: ctx.companyId,
        OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: new Date() } }],
        status: { in: ["PENDING", "FAILED"] },
        attemptCount: { lt: MAX_DELIVERY_ATTEMPTS },
      },
    });

    const results = { sent: 0, skipped: 0, failed: 0 };

    for (const notification of notifications) {
      if (notification.channel === "IN_APP") {
        await notificationRepository.markSent(notification.id);
        results.sent++;
        continue;
      }

      if (!notification.companyUserId) {
        results.skipped++;
        continue;
      }

      const [user, preference] = await Promise.all([
        prisma.companyUser.findUnique({
          where: { id: notification.companyUserId },
          include: { telegramAccounts: { where: { companyId: ctx.companyId }, take: 1 } },
        }),
        notificationRepository.getPreference(notification.companyUserId),
      ]);

      const enabledTypes = preference?.enabledTypes as Partial<Record<NotificationType, boolean>> | null;
      const typeEnabled = enabledTypes?.[notification.type] ?? true;
      const now = new Date();
      const withinQuietHours = isWithinQuietHours(
        now.getHours(),
        preference?.quietHoursStart ?? null,
        preference?.quietHoursEnd ?? null,
      );

      const chatId = user?.telegramAccounts[0]?.telegramUserId;
      if (!typeEnabled || withinQuietHours || !chatId) {
        results.skipped++;
        continue;
      }

      try {
        await telegramBotClient.sendMessage(chatId.toString(), `${notification.title}\n\n${notification.body}`, {
          replyMarkup: buildInlineKeyboard(notification),
        });
        await notificationRepository.markSent(notification.id);
        results.sent++;
      } catch (error) {
        await notificationRepository.markFailed(notification.id, error instanceof Error ? error.message : String(error));
        results.failed++;
      }
    }

    return results;
  },

  /** "Daha Sonra Hatırlat" callback'i — bkz. webhook route. */
  async snooze(notificationId: string, callbackQueryId: string, chatId: number, messageId: number) {
    const until = new Date(Date.now() + DEFAULT_SNOOZE_HOURS * 60 * 60 * 1000);
    await notificationRepository.snooze(notificationId, until);
    await telegramBotClient.answerCallbackQuery(callbackQueryId, {
      text: `${DEFAULT_SNOOZE_HOURS} saat sonra tekrar hatırlatılacak.`,
    });
    await telegramBotClient.editMessageReplyMarkup(chatId, messageId, undefined);
  },

  /** Kritik ayar değişikliklerinde çağrılabilecek yardımcı — bkz. bank/pos deactivate. */
  async notifyCriticalSettingChange(ctx: TenantContext, actorName: string, description: string) {
    await createForEligibleUsers(
      ctx,
      { type: "CRITICAL_SETTING_CHANGE", actorName, description },
      "Company",
      ctx.companyId,
      dateKey(new Date()) + ":" + description,
    );
  },

  /** Yönetici paneli — "Eksik veri uyarısı gönder" aracı (bkz. Aşama 15). Oluşturur ve hemen gönderir. */
  async notifyMissingData(companyId: string, message: string) {
    const ctx: TenantContext = { companyId, companyUserId: "" };
    await createForEligibleUsers(
      ctx,
      { type: "MISSING_DATA_WARNING", message },
      "Company",
      companyId,
      Date.now().toString(),
    );
    return this.dispatch(ctx);
  },
};
