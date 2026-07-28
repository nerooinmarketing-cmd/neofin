import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { TariffWizard } from "@/components/tariff/tariff-wizard";
import { requireTenantContext } from "@/server/auth/require-tenant-context";
import { bankRepository } from "@/server/repositories/bank-repository";
import { posDeviceRepository } from "@/server/repositories/pos-device-repository";

export default async function YeniTarifePage({
  params,
}: {
  params: Promise<{ bankId: string; posId: string }>;
}) {
  const { bankId, posId } = await params;
  const ctx = await requireTenantContext();

  const [bank, pos] = await Promise.all([
    bankRepository.getByIdOrThrow(ctx, bankId),
    posDeviceRepository.getByIdOrThrow(ctx, posId),
  ]);

  return (
    <AppShell>
      <PageHeader
        title="Resmî Tarife Girişi"
        description="Bankanız tarafından doldurulmuş ve kaşelenmiş POS Bilgi Formundaki verileri bu ekrana bir kez girin."
      />
      <TariffWizard
        posId={pos.id}
        bankId={bank.id}
        posName={pos.name}
        bankName={bank.name}
        returnPath={`/bankalar/${bank.id}?tab=tarifeler`}
      />
    </AppShell>
  );
}
