import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { NotificationItem } from "@/components/notifications/notification-item";
import { NotificationCheckButton } from "@/components/notifications/notification-check-button";
import { NotificationPreferencesForm } from "@/components/notifications/notification-preferences-form";
import { requireTenantContext } from "@/server/auth/require-tenant-context";
import { notificationRepository } from "@/server/repositories/notification-repository";
import { NOTIFICATION_TYPE_LABELS, notificationStatusLabel } from "@/server/notifications/labels";
import type { NotificationType } from "@/generated/prisma/enums";

export default async function BildirimlerPage() {
  const ctx = await requireTenantContext();

  const [notifications, preference] = await Promise.all([
    notificationRepository.listForCompany(ctx),
    notificationRepository.getPreference(ctx.companyUserId),
  ]);

  const typeOptions = (Object.keys(NOTIFICATION_TYPE_LABELS) as NotificationType[]).map((type) => ({
    type,
    label: NOTIFICATION_TYPE_LABELS[type],
  }));

  return (
    <AppShell>
      <PageHeader
        title="Bildirimler"
        description="Telegram bildirim geçmişi ve tercihleri."
        action={<NotificationCheckButton />}
      />

      <h2 className="font-heading text-lg font-semibold text-foreground">Tercihler</h2>
      <NotificationPreferencesForm
        typeOptions={typeOptions}
        initialEnabledTypes={(preference?.enabledTypes as Partial<Record<NotificationType, boolean>>) ?? {}}
        initialDailySummaryHour={preference?.dailySummaryHour ?? null}
        initialQuietHoursStart={preference?.quietHoursStart ?? null}
        initialQuietHoursEnd={preference?.quietHoursEnd ?? null}
      />

      <h2 className="font-heading text-lg font-semibold text-foreground">Geçmiş</h2>
      {notifications.length === 0 ? (
        <EmptyState
          title="Henüz bildirim yok"
          description="Beklenen ödeme, tarife bitişi gibi durumlar oluştuğunda burada listelenecek. 'Bildirimleri Kontrol Et' ile hemen tarayabilirsiniz."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {notifications.map((n) => (
            <NotificationItem
              key={n.id}
              id={n.id}
              typeLabel={NOTIFICATION_TYPE_LABELS[n.type]}
              title={n.title}
              body={n.body}
              status={n.status}
              statusLabel={notificationStatusLabel(n.status)}
              createdAt={n.createdAt}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
