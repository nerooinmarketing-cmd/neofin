import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DifferenceFilterBar } from "@/components/differences/difference-filter-bar";
import { DifferenceCard } from "@/components/differences/difference-card";
import { requireTenantContext } from "@/server/auth/require-tenant-context";
import { getShellIdentity } from "@/server/auth/shell-identity";
import { differenceRepository } from "@/server/repositories/difference-repository";
import { bankRepository } from "@/server/repositories/bank-repository";
import { posDeviceRepository } from "@/server/repositories/pos-device-repository";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["NEEDS_REVIEW", "DIFFERENCE_FOUND", "PARTIALLY_PAID", "DELAYED", "MATCHED"];

export default async function FarkAnaliziPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; bankId?: string; posId?: string; branchId?: string }>;
}) {
  const params = await searchParams;
  const ctx = await requireTenantContext();

  const status = VALID_STATUSES.includes(params.status ?? "") ? params.status : undefined;

  const [items, banks, posDevices, branches, identity] = await Promise.all([
    differenceRepository.listWithFilters(ctx, {
      status,
      bankId: params.bankId,
      posId: params.posId,
      branchId: params.branchId,
    }),
    bankRepository.listActive(ctx),
    posDeviceRepository.listActive(ctx),
    prisma.branch.findMany({ where: { companyId: ctx.companyId, deletedAt: null } }),
    getShellIdentity(ctx),
  ]);

  return (
    <AppShell userName={identity.userName} companyName={identity.companyName}>
      <PageHeader
        title="Fark Analizi Merkezi"
        description="Beklenen ve gerçekleşen ödemeler arasındaki farkların 3 katmanlı analizi: matematiksel fark, kural kontrolü ve rule-based açıklama."
      />
      <DifferenceFilterBar
        banks={banks.map((b) => ({ id: b.id, name: b.name }))}
        posDevices={posDevices.map((p) => ({ id: p.id, name: p.name }))}
        branches={branches.map((b) => ({ id: b.id, name: b.name }))}
      />

      {items.length === 0 ? (
        <EmptyState
          title="Bu filtrede fark kaydı yok"
          description="Farklı bir filtre deneyin veya gerçekleşen ödeme kaydettikçe fark analizleri burada görünecek."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <DifferenceCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
