import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { FinanceChat } from "@/components/finance-assistant/finance-chat";
import { requireTenantContext } from "@/server/auth/require-tenant-context";

export default async function AsistanPage() {
  await requireTenantContext();

  return (
    <AppShell>
      <PageHeader
        title="Finans Asistanı"
        description="Doğal dilde soru sorun — her yanıt gerçek verilere ve ilgili ekrana bağlantı verir."
      />
      <FinanceChat />
    </AppShell>
  );
}
