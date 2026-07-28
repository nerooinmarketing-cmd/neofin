import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ActualPaymentForm } from "@/components/payments/actual-payment-form";
import { formatCurrency, formatDate } from "@/lib/format";
import { requireTenantContext } from "@/server/auth/require-tenant-context";
import { expectedPaymentRepository } from "@/server/repositories/expected-payment-repository";

export default async function KaydetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireTenantContext();
  const payment = await expectedPaymentRepository.getByIdOrThrow(ctx, id);

  return (
    <AppShell>
      <PageHeader
        title="Hesaba Geçeni Gir"
        description={`${payment.bank.name} · ${payment.pos.name}`}
      />
      <div className="rounded-xl border border-border bg-card p-4">
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-muted-foreground">Satış tarihi</dt>
            <dd className="font-medium text-foreground">{formatDate(payment.saleDate)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Beklenen ödeme tarihi</dt>
            <dd className="font-medium text-foreground">
              {formatDate(payment.expectedPaymentDate)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Brüt satış</dt>
            <dd className="tabular-money font-medium text-foreground">
              {formatCurrency(Number(payment.grossAmount))}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Beklenen net ödeme</dt>
            <dd className="tabular-money font-semibold text-primary">
              {formatCurrency(Number(payment.expectedNet))}
            </dd>
          </div>
        </dl>
      </div>
      <ActualPaymentForm expectedPaymentId={payment.id} defaultAmount={Number(payment.expectedNet)} />
    </AppShell>
  );
}
