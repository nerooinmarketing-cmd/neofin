import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { requireTenantContext } from "@/server/auth/require-tenant-context";
import { getShellIdentity } from "@/server/auth/shell-identity";
import { actualPaymentRepository } from "@/server/repositories/actual-payment-repository";
import { statusFromDifference } from "@/server/payments/status-labels";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function GerceklesenOdemelerPage() {
  const ctx = await requireTenantContext();
  const [payments, identity] = await Promise.all([
    actualPaymentRepository.listRecent(ctx),
    getShellIdentity(ctx),
  ]);

  return (
    <AppShell userName={identity.userName} companyName={identity.companyName}>
      <PageHeader
        title="Gerçekleşen Ödemeler"
        description="Hesaba geçen tutarların girildiği ve beklenenle karşılaştırıldığı kayıtlar."
      />

      {payments.length === 0 ? (
        <EmptyState
          title="Henüz gerçekleşen ödeme girilmedi"
          description="Beklenen Ödemeler ekranından 'Hesabıma Geçti' ile ilk kaydınızı oluşturun."
        />
      ) : (
        <div className="space-y-2">
          {payments.map((payment) => {
            const difference = payment.paymentDifferences[0];
            const status = difference
              ? statusFromDifference(difference.status)
              : { label: "Değerlendiriliyor", tone: "neutral" as const };
            return (
              <div
                key={payment.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {payment.expectedPayment.bank.name} · {payment.expectedPayment.pos.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Geçiş tarihi: {formatDate(payment.receivedDate)}
                    {payment.bankDescription ? ` · ${payment.bankDescription}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular-money text-sm font-semibold text-foreground">
                    {formatCurrency(Number(payment.receivedAmount))}
                  </span>
                  <StatusBadge label={status.label} tone={status.tone} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
