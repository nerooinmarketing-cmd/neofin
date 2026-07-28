import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { PaymentCard } from "@/components/shared/payment-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PaymentFilterBar } from "@/components/payments/payment-filter-bar";
import { requireTenantContext } from "@/server/auth/require-tenant-context";
import {
  expectedPaymentRepository,
  type ExpectedPaymentRangeFilter,
} from "@/server/repositories/expected-payment-repository";
import { bankRepository } from "@/server/repositories/bank-repository";
import { posDeviceRepository } from "@/server/repositories/pos-device-repository";
import { prisma } from "@/lib/prisma";

const VALID_RANGES: ExpectedPaymentRangeFilter[] = ["today", "tomorrow", "week", "overdue"];

export default async function BeklenenOdemelerPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; bankId?: string; posId?: string; branchId?: string }>;
}) {
  const params = await searchParams;
  const ctx = await requireTenantContext();

  const range = VALID_RANGES.includes(params.range as ExpectedPaymentRangeFilter)
    ? (params.range as ExpectedPaymentRangeFilter)
    : undefined;

  const [items, banks, posDevices, branches] = await Promise.all([
    expectedPaymentRepository.listWithFilters(ctx, {
      range,
      bankId: params.bankId,
      posId: params.posId,
      branchId: params.branchId,
    }),
    bankRepository.listActive(ctx),
    posDeviceRepository.listActive(ctx),
    prisma.branch.findMany({ where: { companyId: ctx.companyId, deletedAt: null } }),
  ]);

  return (
    <AppShell>
      <PageHeader
        title="Beklenen Ödemeler"
        description="Bankadan hesabınıza geçmesi beklenen tutarlar."
      />
      <PaymentFilterBar
        banks={banks.map((b) => ({ id: b.id, name: b.name }))}
        posDevices={posDevices.map((p) => ({ id: p.id, name: p.name }))}
        branches={branches.map((b) => ({ id: b.id, name: b.name }))}
      />

      {items.length === 0 ? (
        <EmptyState
          title="Bu filtrede bekleyen ödeme yok"
          description="Farklı bir filtre deneyin veya gün sonu girişi yaparak yeni beklenen ödemeler oluşturun."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ payment, isResolved, displayStatus }) => (
            <PaymentCard
              key={payment.id}
              bankName={payment.bank.name}
              posName={payment.pos.name}
              saleDate={payment.saleDate}
              paymentDate={payment.expectedPaymentDate}
              grossAmount={Number(payment.grossAmount)}
              expectedDeduction={Number(payment.expectedDeduction)}
              expectedNet={Number(payment.expectedNet)}
              status={displayStatus}
              markReceivedHref={isResolved ? undefined : `/odemeler/beklenen/${payment.id}/kaydet`}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
