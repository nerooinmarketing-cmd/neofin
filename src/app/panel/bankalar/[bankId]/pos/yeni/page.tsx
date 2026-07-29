import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { PosCreateForm } from "@/components/pos/pos-create-form";
import { requireTenantContext } from "@/server/auth/require-tenant-context";
import { getShellIdentity } from "@/server/auth/shell-identity";
import { bankRepository } from "@/server/repositories/bank-repository";

export default async function YeniPosPage({
  params,
}: {
  params: Promise<{ bankId: string }>;
}) {
  const { bankId } = await params;
  const ctx = await requireTenantContext();
  const [bank, identity] = await Promise.all([
    bankRepository.getByIdOrThrow(ctx, bankId),
    getShellIdentity(ctx),
  ]);

  return (
    <AppShell userName={identity.userName} companyName={identity.companyName}>
      <PageHeader title="Yeni POS Ekle" description={`${bank.name} için yeni bir POS cihazı ekleyin.`} />
      <PosCreateForm bankId={bank.id} bankReturnPath={`/panel/bankalar/${bank.id}?tab=poslar`} />
    </AppShell>
  );
}
