import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { GunSonuForm } from "@/components/daily-sale/gun-sonu-form";
import { EmptyState } from "@/components/shared/empty-state";
import { requireTenantContext } from "@/server/auth/require-tenant-context";
import { getShellIdentity } from "@/server/auth/shell-identity";
import { bankRepository } from "@/server/repositories/bank-repository";
import { posDeviceRepository } from "@/server/repositories/pos-device-repository";
import { dailySaleRepository } from "@/server/repositories/daily-sale-repository";
import { prisma } from "@/lib/prisma";

export default async function GunSonuPage() {
  const ctx = await requireTenantContext();

  const [branches, banks, posDevices, lastUsedPosId, identity] = await Promise.all([
    prisma.branch.findMany({ where: { companyId: ctx.companyId, deletedAt: null } }),
    bankRepository.listActive(ctx),
    posDeviceRepository.listActive(ctx),
    dailySaleRepository.getLastUsedPosId(ctx),
    getShellIdentity(ctx),
  ]);

  if (branches.length === 0 || banks.length === 0 || posDevices.length === 0) {
    return (
      <AppShell userName={identity.userName} companyName={identity.companyName}>
        <PageHeader title="Gün Sonu Girişi" description="Günlük satışlarınızı hızlıca girin." />
        <EmptyState
          title="Önce banka ve POS eklemelisiniz"
          description="Gün sonu girişi yapabilmek için en az bir banka ve bir POS kaydınız olmalı."
        />
      </AppShell>
    );
  }

  return (
    <AppShell userName={identity.userName} companyName={identity.companyName}>
      <PageHeader title="Gün Sonu Girişi" description="Günlük satışlarınızı hızlıca girin." />
      <GunSonuForm
        branches={branches.map((b) => ({ id: b.id, name: b.name }))}
        banks={banks.map((b) => ({ id: b.id, name: b.name }))}
        posDevices={posDevices.map((p) => ({
          id: p.id,
          name: p.name,
          bankId: p.bankId,
          branchId: p.branchId,
        }))}
        defaultBranchId={branches[0]!.id}
        defaultPosId={lastUsedPosId ?? posDevices[0]!.id}
      />
    </AppShell>
  );
}
