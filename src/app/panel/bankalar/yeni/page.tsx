import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { BankCreateForm } from "@/components/banks/bank-create-form";
import { requireTenantContext } from "@/server/auth/require-tenant-context";
import { getShellIdentity } from "@/server/auth/shell-identity";

export default async function YeniBankaPage() {
  const ctx = await requireTenantContext();
  const identity = await getShellIdentity(ctx);

  return (
    <AppShell userName={identity.userName} companyName={identity.companyName}>
      <PageHeader title="Yeni Banka Ekle" description="Firmanıza yeni bir banka ekleyin." />
      <BankCreateForm />
    </AppShell>
  );
}
