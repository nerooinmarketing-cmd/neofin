import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { FinanceChat } from "@/components/finance-assistant/finance-chat";
import { requireTenantContext } from "@/server/auth/require-tenant-context";
import { getShellIdentity } from "@/server/auth/shell-identity";

export default async function AsistanPage() {
  const ctx = await requireTenantContext();
  const identity = await getShellIdentity(ctx);

  return (
    <AppShell userName={identity.userName} companyName={identity.companyName}>
      <PageHeader
        title="Finans Asistanı"
        description="Doğal dilde soru sorun — her yanıt gerçek verilere ve ilgili ekrana bağlantı verir."
      />
      <FinanceChat />
    </AppShell>
  );
}
