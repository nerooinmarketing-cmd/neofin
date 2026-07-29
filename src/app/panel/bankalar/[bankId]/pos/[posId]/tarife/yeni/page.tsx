import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { TariffWizard } from "@/components/tariff/tariff-wizard";
import { requireTenantContext } from "@/server/auth/require-tenant-context";
import { getShellIdentity } from "@/server/auth/shell-identity";
import { bankRepository } from "@/server/repositories/bank-repository";
import { posDeviceRepository } from "@/server/repositories/pos-device-repository";

export default async function YeniTarifePage({
  params,
}: {
  params: Promise<{ bankId: string; posId: string }>;
}) {
  const { bankId, posId } = await params;
  const ctx = await requireTenantContext();

  const [bank, pos, identity] = await Promise.all([
    bankRepository.getByIdOrThrow(ctx, bankId),
    posDeviceRepository.getByIdOrThrow(ctx, posId),
    getShellIdentity(ctx),
  ]);

  return (
    <AppShell userName={identity.userName} companyName={identity.companyName}>
      <PageHeader
        title="Resmî Tarife Girişi"
        description="Bankanız tarafından doldurulmuş ve kaşelenmiş POS Bilgi Formundaki verileri bu ekrana bir kez girin."
      />
      <TariffWizard
        posId={pos.id}
        bankId={bank.id}
        posName={pos.name}
        bankName={bank.name}
        returnPath={`/panel/bankalar/${bank.id}?tab=tarifeler`}
      />
    </AppShell>
  );
}
